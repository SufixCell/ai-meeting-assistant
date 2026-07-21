const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const transcriptionService = require('../services/transcriptionService');
const aiService = require('../services/aiService');
const meetingService = require('../services/meetingService');
const supabase = require('../config/supabase');

async function processMeeting(req, res) {
  let audioFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { title = 'Untitled Meeting', userId = 'anonymous' } = req.body;
    audioFilePath = req.file.path;

    console.log(`Processing meeting: ${title} (File: ${req.file.originalname})`);

    // 1. Transcribe with Whisper
    const transcriptText = await transcriptionService.transcribeAudio(audioFilePath);
    console.log('Transcription successful.');

    // Clean up temporary audio file
    try {
      fs.unlinkSync(audioFilePath);
      audioFilePath = null;
    } catch (unlinkErr) {
      console.error('Failed to delete temporary audio file:', unlinkErr);
    }

    // 2. Summarize with GPT-4o-mini
    const llmOutput = await aiService.summarizeTranscript(transcriptText);
    console.log('Summarization successful.');

    const resultData = {
      user_id: userId,
      title: title,
      transcript: transcriptText,
      summary: llmOutput.summary,
      action_items: llmOutput.actionItems,
    };

    // 3. Save to database (if configured)
    if (supabase) {
      try {
        const savedData = await meetingService.saveMeeting(resultData);
        console.log('Saved to database successfully.');
        return res.status(200).json(savedData);
      } catch (dbErr) {
        console.error('Supabase Error:', dbErr);
        // Return 200 with the data even if DB fails, to ensure frontend gets the summary
        return res.status(200).json({ ...resultData, db_error: dbErr.message });
      }
    }

    // Return data without DB id if Supabase isn't configured
    return res.status(200).json(resultData);

  } catch (error) {
    console.error('Error processing meeting:', error);
    // Ensure we clean up the file if it failed midway
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      try {
        fs.unlinkSync(audioFilePath);
      } catch (_) {}
    }
    return res.status(500).json({ error: 'Failed to process meeting', details: error.message });
  }
}

async function processBotAudio(req, res) {
  let flacFilePath = null;
  let mp3FilePath = null;
  let chunkFiles = [];
  try {
    const { audioUrl, title = 'Bot Meeting', userId = 'anonymous' } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ error: 'No audio URL provided' });
    }

    console.log(`[1/5] Downloading audio from: ${audioUrl}`);
    flacFilePath = path.join(os.tmpdir(), `bot_audio_${Date.now()}.flac`);
    
    // Download with retry
    let downloaded = false;
    let downloadError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios({
          method: 'GET',
          url: audioUrl,
          responseType: 'stream',
          timeout: 60000 // 60 seconds generous timeout
        });
        
        // --- INSTRUMENTATION: Log download HTTP info ---
        const logPath = path.join(__dirname, '..', 'bot_debug.log');
        try {
            const headers = response.headers;
            const httpInfo = `\n[DOWNLOAD HTTP INFO at ${new Date().toISOString()}]\nURL: ${audioUrl}\nStatus: ${response.status}\nContent-Type: ${headers['content-type']}\nContent-Length: ${headers['content-length']}\n`;
            fs.appendFileSync(logPath, httpInfo);
        } catch(e) {}
        // -----------------------------------------------

        const writer = fs.createWriteStream(flacFilePath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        downloaded = true;
        break;
      } catch (e) {
        downloadError = e;
        console.warn(`Download attempt ${attempt} failed: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000 * attempt)); // exp backoff
      }
    }
    
    if (!downloaded) {
      throw new Error(`Audio download timeout or failure after 3 attempts: ${downloadError?.message}`);
    }

    // --- INSTRUMENTATION: FFprobe analysis before conversion ---
    try {
        const logPath = path.join(__dirname, '..', 'bot_debug.log');
        const stats = fs.statSync(flacFilePath);
        let duration = 'unknown';
        try {
            const { stdout } = await exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${flacFilePath}"`);
            duration = stdout.trim();
        } catch(e) { duration = 'error parsing duration'; }
        
        fs.appendFileSync(logPath, `\n[FFPROBE RAW DOWNLOAD at ${new Date().toISOString()}]\nFile Size (bytes): ${stats.size}\nDuration (seconds): ${duration}\n`);
    } catch(e) {}
    // -----------------------------------------------------------

    // Convert to MP3
    console.log('[2/5] Converting FLAC to MP3 using ffmpeg...');
    mp3FilePath = path.join(os.tmpdir(), `bot_audio_${Date.now()}.mp3`);
    try {
      await exec(`ffmpeg -i "${flacFilePath}" -y -vn -ar 44100 -ac 2 -b:a 192k "${mp3FilePath}"`);
    } catch (ffmpegErr) {
      throw new Error(`FFmpeg conversion failed: ${ffmpegErr.message}`);
    }

    // Check size limit (Whisper max is 25MB)
    console.log('[3/5] Checking file size...');
    const stats = fs.statSync(mp3FilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    let transcriptText = "";
    if (fileSizeInMB > 24) {
      console.log(`File is ${fileSizeInMB.toFixed(2)}MB (>24MB). Splitting into chunks...`);
      try {
        // Split into 15 minute segments
        const chunkPattern = path.join(os.tmpdir(), `bot_audio_chunk_${Date.now()}_%03d.mp3`);
        await exec(`ffmpeg -i "${mp3FilePath}" -f segment -segment_time 900 -c copy "${chunkPattern}"`);
        
        const files = fs.readdirSync(os.tmpdir());
        const basePattern = path.basename(chunkPattern).replace('%03d', '');
        chunkFiles = files.filter(f => f.startsWith(basePattern.substring(0, basePattern.length - 1))).sort();
        
        console.log(`Split into ${chunkFiles.length} chunks. Transcribing sequentially...`);
        for (let i = 0; i < chunkFiles.length; i++) {
          console.log(`Transcribing chunk ${i+1}/${chunkFiles.length}...`);
          const chunkPath = path.join(os.tmpdir(), chunkFiles[i]);
          const chunkText = await transcriptionService.transcribeAudio(chunkPath);
          transcriptText += chunkText + " ";
        }
      } catch (splitErr) {
        throw new Error(`Audio chunking or transcribing failed: ${splitErr.message}`);
      }
    } else {
      console.log(`File is ${fileSizeInMB.toFixed(2)}MB. Transcribing entirely...`);
      try {
        transcriptText = await transcriptionService.transcribeAudio(mp3FilePath);
      } catch (trErr) {
        throw new Error(`Whisper transcription failed: ${trErr.message}`);
      }
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      transcriptText = "(No spoken words were transcribed during this meeting)";
    }

    console.log('[4/5] Summarizing with LLM...');
    let llmOutput;
    try {
      llmOutput = await aiService.summarizeTranscript(transcriptText);
    } catch (llmErr) {
      throw new Error(`LLM Summarization failed: ${llmErr.message}`);
    }

    console.log('[5/5] Saving to Database...');
    const resultData = {
      user_id: userId,
      title: title,
      transcript: transcriptText,
      summary: llmOutput.summary,
      action_items: llmOutput.actionItems,
    };

    // Clean up files before returning
    [flacFilePath, mp3FilePath, ...chunkFiles.map(f => path.join(os.tmpdir(), f))].forEach(f => {
      if (f && fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) {}
    });

    if (supabase) {
      try {
        const savedData = await meetingService.saveMeeting(resultData);
        console.log('Saved to database successfully.');
        return res.status(200).json(savedData);
      } catch (dbErr) {
        return res.status(200).json({ ...resultData, db_error: dbErr.message });
      }
    }
    return res.status(200).json(resultData);
  } catch (error) {
    console.error('Error processing bot audio:', error);
    
    // Clean up files on error
    [flacFilePath, mp3FilePath, ...chunkFiles.map(f => path.join(os.tmpdir(), f))].forEach(f => {
      if (f && fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) {}
    });

    return res.status(500).json({ error: 'Failed to process bot audio', details: error.message });
  }
}

async function getMeetingsByUser(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }
  
  try {
    const meetings = await meetingService.getMeetingsByUser(req.params.userId);
    return res.status(200).json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return res.status(500).json({ error: 'Failed to fetch meetings', details: error.message });
  }
}

async function deleteMeeting(req, res) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  try {
    await meetingService.deleteMeeting(req.params.id);
    return res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return res.status(500).json({ error: 'Failed to delete meeting', details: error.message });
  }
}

async function joinOnlineMeeting(req, res) {
  try {
    const { meetingUrl } = req.body;
    if (!meetingUrl) {
      return res.status(400).json({
        error: "Meeting URL is required"
      });
    }

    const bot = await meetingService.joinOnlineMeeting(meetingUrl);
    return res.json(bot);
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}

async function getBotStatus(req, res) {
  try {
    const { botId } = req.params;
    if (!botId) return res.status(400).json({ error: "botId is required" });

    // Call MeetingBaaS API to get status
    const statusData = await meetingService.getBotStatus?.(botId) || 
                       await require('../services/meetingBaasService').getBotStatus(botId);
    return res.json(statusData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function disconnectBot(req, res) {
  try {
    const { botId } = req.params;
    if (!botId) return res.status(400).json({ error: "botId is required" });

    // Call MeetingBaaS API to disconnect bot
    const result = await meetingService.leaveMeeting?.(botId) || 
                   await require('../services/meetingBaasService').leaveMeeting(botId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  processMeeting,
  getMeetingsByUser,
  deleteMeeting,
  joinOnlineMeeting,
  getBotStatus,
  disconnectBot,
  processBotAudio
};

const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
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
  let audioFilePath = null;
  try {
    const { audioUrl, title = 'Bot Meeting', userId = 'anonymous' } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ error: 'No audio URL provided' });
    }

    console.log(`Downloading audio from: ${audioUrl}`);
    const response = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'stream'
    });

    audioFilePath = path.join(os.tmpdir(), `bot_audio_${Date.now()}.flac`);
    const writer = fs.createWriteStream(audioFilePath);
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('Audio downloaded. Transcribing with Whisper...');
    const transcriptText = await transcriptionService.transcribeAudio(audioFilePath);
    
    // Clean up
    try {
      fs.unlinkSync(audioFilePath);
      audioFilePath = null;
    } catch (e) {}

    console.log('Summarizing...');
    const llmOutput = await aiService.summarizeTranscript(transcriptText);

    const resultData = {
      user_id: userId,
      title: title,
      transcript: transcriptText,
      summary: llmOutput.summary,
      action_items: llmOutput.actionItems,
    };

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
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      try { fs.unlinkSync(audioFilePath); } catch (e) {}
    }
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

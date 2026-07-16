require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer for audio uploads (store temporarily in 'uploads/' folder)
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Database saving will be skipped.");
}

// --- API ENDPOINTS ---

/**
 * POST /api/process-meeting
 * Accepts an audio file, transcribes it via Whisper, summarizes it via GPT-4o-mini, and saves to Supabase.
 */
app.post('/api/process-meeting', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { title = 'Untitled Meeting', userId = 'anonymous' } = req.body;
    const audioFilePath = req.file.path;

    console.log(`Processing meeting: ${title} (File: ${req.file.originalname})`);

    // 1. Transcribe with OpenAI Whisper
    console.log('Sending to Whisper API for transcription...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });
    const transcriptText = transcription.text;
    console.log('Transcription successful.');

    // Clean up the temporary audio file
    fs.unlinkSync(audioFilePath);

    // 2. Summarize with OpenAI GPT-4o-mini
    console.log('Sending to GPT-4o-mini for summarization...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an elite meeting assistant. I will provide a transcript. Extract a concise, professional paragraph summary and a list of specific action items. Format the output in strict JSON with keys: "summary" (string) and "actionItems" (array of strings).'
        },
        {
          role: 'user',
          content: transcriptText
        }
      ],
      response_format: { type: 'json_object' }
    });

    const llmOutput = JSON.parse(completion.choices[0].message.content);
    console.log('Summarization successful.');

    const resultData = {
      user_id: userId,
      title: title,
      transcript: transcriptText,
      summary: llmOutput.summary,
      action_items: llmOutput.actionItems,
    };

    // 3. Save to Supabase (if configured)
    if (supabase) {
      console.log('Saving to Supabase database...');
      const { data, error } = await supabase
        .from('meetings')
        .insert([resultData])
        .select();
      
      if (error) {
        console.error('Supabase Error:', error);
        // We still return 200 with the data even if DB fails, to ensure the frontend gets the summary
        return res.status(200).json({ ...resultData, db_error: error.message });
      }
      console.log('Saved to database successfully.');
      return res.status(200).json(data[0]);
    }

    // Return data without DB id if Supabase isn't configured
    return res.status(200).json(resultData);

  } catch (error) {
    console.error('Error processing meeting:', error);
    // Ensure we clean up the file if it failed midway
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Failed to process meeting', details: error.message });
  }
});

// Health Check
app.get('/', (req, res) => {
  res.send('AI Meeting Assistant Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const fs = require('fs');
const Groq = require('groq-sdk');

async function transcribeAudio(audioFilePath) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in your backend .env file.');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  console.log('Sending to Groq Whisper (whisper-large-v3) for transcription...');
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-large-v3',
    response_format: 'text',
  });

  // Groq returns the text directly when response_format is 'text'
  return typeof transcription === 'string' ? transcription : transcription.text;
}

module.exports = {
  transcribeAudio,
};

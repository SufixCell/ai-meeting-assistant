const fs = require('fs');
const openai = require('../config/openai');

async function transcribeAudio(audioFilePath) {
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your backend .env file.');
  }

  console.log('Sending to Whisper API for transcription...');
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: 'whisper-1',
  });
  
  return transcription.text;
}

module.exports = {
  transcribeAudio
};

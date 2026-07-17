const OpenAI = require('openai');

let openai;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("Warning: OPENAI_API_KEY is missing or set to placeholder. Transcription & summarization will fail until configured in .env.");
}

module.exports = openai;

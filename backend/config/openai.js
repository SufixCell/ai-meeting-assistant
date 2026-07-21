const OpenAI = require('openai');

let openai;
if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Meeting Assistant',
    },
  });
} else {
  console.warn("Warning: OPENROUTER_API_KEY is missing or set to placeholder. Transcription & summarization will fail until configured in .env.");
}

module.exports = openai;

const openai = require('../config/openai');

async function summarizeTranscript(transcriptText) {
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your backend .env file.');
  }

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
  return {
    summary: llmOutput.summary,
    actionItems: llmOutput.actionItems
  };
}

module.exports = {
  summarizeTranscript
};

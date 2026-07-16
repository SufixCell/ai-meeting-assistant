const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface MeetingSummary {
  title: string;
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
}

export async function generateMeetingSummary(transcript: string): Promise<MeetingSummary> {
  if (!transcript || transcript.trim().length < 10) {
    return {
      title: 'Quick Note',
      summary: 'No significant speech was captured.',
      actionItems: [],
      keyDecisions: [],
    };
  }

  const prompt = `You are an AI meeting assistant. Analyze the following meeting transcript and extract structured information.

TRANSCRIPT:
"""
${transcript}
"""

Respond with ONLY valid JSON in exactly this format (no markdown, no code blocks, just raw JSON):
{
  "title": "Short 2-5 word meeting title based on the content",
  "summary": "2-3 sentence executive summary of what was discussed",
  "actionItems": ["Action item 1", "Action item 2"],
  "keyDecisions": ["Key decision 1", "Key decision 2"]
}

If the transcript is very short or unclear, still return valid JSON with your best guess. The title should be specific to the content discussed.`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Groq API error:', err);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('No content from Groq');

  try {
    const parsed = JSON.parse(content) as MeetingSummary;
    return parsed;
  } catch (e) {
    // Try to extract JSON from the string if it has extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MeetingSummary;
    }
    throw new Error('Failed to parse Groq response as JSON');
  }
}

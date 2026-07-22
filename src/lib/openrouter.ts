const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface MeetingSummary {
  title: string;
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
  suggestions: string[];
}

export async function generateMeetingSummary(transcript: string): Promise<MeetingSummary> {
  if (!transcript || transcript.trim().length < 10) {
    return {
      title: 'Quick Note',
      summary: 'No significant speech was captured.',
      actionItems: [],
      keyDecisions: [],
      suggestions: [],
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
  "keyDecisions": ["Key decision 1", "Key decision 2"],
  "suggestions": ["Identify any problems discussed and suggest a proactive solution", "Suggest an improvement"]
}

If the transcript is very short or unclear, still return valid JSON with your best guess. The title should be specific to the content discussed. If there are no obvious problems or solutions, return an empty array for suggestions.`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:8081',
      'X-Title': 'AI Meeting Assistant',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
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
    console.error('OpenRouter API error:', err);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('No content from OpenRouter');

  try {
    const parsed = JSON.parse(content) as MeetingSummary;
    return parsed;
  } catch (e) {
    // Try to extract JSON from the string if it has extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MeetingSummary;
    }
    throw new Error('Failed to parse OpenRouter response as JSON');
  }
}

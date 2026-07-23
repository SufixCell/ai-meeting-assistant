/**
 * Speech-to-Text Transcription Service using Groq Whisper (whisper-large-v3-turbo)
 * Acts as the single source of truth for audio transcription across all platforms.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

export async function transcribeAudioBlob(audioBlob: Blob, title: string = 'Untitled Meeting'): Promise<{
  transcript: string;
  summary?: string;
  action_items?: any[];
}> {
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

  // 1. Try primary backend server endpoint if available
  if (backendUrl) {
    try {
      const formData = new FormData();
      const filename = audioBlob.type.includes('mp4') ? 'recording.mp4' : 'recording.webm';
      formData.append('audio', audioBlob, filename);
      formData.append('title', title);

      const response = await fetch(`${backendUrl}/api/process-meeting`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          transcript: data.transcript || '',
          summary: data.summary,
          action_items: data.action_items,
        };
      }
    } catch (err) {
      console.warn('Backend server transcription unavailable, falling back to direct Groq Whisper API:', err);
    }
  }

  // 2. Direct Groq Whisper API Call (Fast Cloud AI Fallback)
  if (!apiKey) {
    throw new Error('Groq API Key is not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.');
  }

  const extension = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
  const file = new File([audioBlob], `recording.${extension}`, { type: audioBlob.type || 'audio/webm' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');

  const groqRes = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!groqRes.ok) {
    const errorText = await groqRes.text();
    console.error('Groq Whisper API Error:', errorText);
    throw new Error(`Groq Whisper transcription failed: ${groqRes.statusText}`);
  }

  const result = await groqRes.json();
  const transcriptText = result.text || '';

  return {
    transcript: transcriptText,
  };
}

import React, { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { generateMeetingSummary } from '../lib/openrouter';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BotPlatform = 'zoom' | 'meet' | 'teams' | 'discord';

export type BotSessionStatus =
  | 'idle'
  | 'joining'
  | 'in_call'
  | 'disconnecting'
  | 'processing'
  | 'disconnect_requested';

export interface BotSession {
  sessionId: string;
  platform: BotPlatform;
  label: string; // e.g. "Zoom call" or "#general"
  status: BotSessionStatus;
  startedAt: number; // epoch ms
  error?: string;
}

interface BotContextType {
  session: BotSession | null;
  joinMeetingLink: (url: string) => Promise<void>;
  joinDiscord: (guildId: string, channelId: string, channelName: string) => Promise<void>;
  disconnectBot: () => Promise<void>;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BotContext = createContext<BotContextType>({
  session: null,
  joinMeetingLink: async () => {},
  joinDiscord: async () => {},
  disconnectBot: async () => {},
  clearError: () => {},
});

export const useBotSession = () => useContext(BotContext);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function detectPlatform(url: string): BotPlatform | null {
  if (/zoom\.us/i.test(url)) return 'zoom';
  if (/meet\.google\.com/i.test(url)) return 'meet';
  if (/teams\.microsoft\.com/i.test(url) || /teams\.live\.com/i.test(url)) return 'teams';
  return null;
}

const POLL_INTERVAL_MS = 5000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BotSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BotSession | null>(null);
  const pollRef = useRef<any>(null);
  const router = useRouter();

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Finalize session (processing → summary) ──────────────────────────────
  const finalizeSession = useCallback(async (sessionId: string, transcript: string) => {
    setSession(prev => prev ? { ...prev, status: 'processing' } : prev);
    try {
      const summary = await generateMeetingSummary(transcript);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('meetings').insert({
          user_id: user.id,
          title: summary.title,
          transcript,
          summary: summary.summary,
          action_items: summary.actionItems,
          key_decisions: summary.keyDecisions,
          source: 'bot', // differentiates from mic recordings
        });
      }
      router.push({ pathname: '/(tabs)/summary', params: { transcript, ts: Date.now().toString() } });
    } catch (e) {
      console.error('Bot finalize error:', e);
    } finally {
      stopPolling();
      setSession(null);
    }
  }, [router, stopPolling]);

  // ── Poll the backend for session status ──────────────────────────────────
  const startPolling = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/bot/status/${sessionId}`);
        const result = await res.json();
        const data = result.data || result; // Handle MeetingBaaS nested data
        
        if (data.status) {
          setSession(prev => {
            if (!prev || prev.sessionId !== sessionId) return prev;
            
            // Map MeetingBaaS status to our UI status
            const status = typeof data.status === 'string' ? data.status.toLowerCase() : '';
            const errorCode = data.error_code || (data.bot_data && data.bot_data.error_code);
            let newStatus: BotSessionStatus = prev.status;
            
            const activeStatuses = ['joined', 'recording', 'in_call', 'in_call_recording', 'in_call_not_recording', 'active'];
            const joiningStatuses = ['joining', 'joining_call', 'in_waiting_room'];
            const failedStatuses = ['failed', 'fatal', 'bot_rejected', 'bot_removed', 'invalid_meeting_url', 'meeting_error', 'waiting_room_timeout'];

            if (joiningStatuses.includes(status)) {
              newStatus = 'joining';
            } else if (activeStatuses.includes(status)) {
              newStatus = 'in_call';
            }
            
            if (failedStatuses.includes(status) || errorCode) {
              stopPolling();
              return { ...prev, status: 'idle', error: data.error_message || errorCode || 'Bot failed to join or was kicked' };
            }
            
            if (status === 'call_ended') {
              newStatus = 'processing';
            }
            
            if (status === 'completed') {
              stopPolling();

              // Snapshot the data we need BEFORE the async call.
              // This avoids stale-closure bugs inside the IIFE.
              const audioUrl = data.audio as string | null;
              const meetingLabel = prev.label || 'Bot Meeting';
              const snapSessionId = sessionId;

              (async () => {
                setSession(p => p ? { ...p, status: 'processing' } : p);
                try {
                  if (audioUrl) {
                    // Give the backend up to 3 minutes (download + ffmpeg + Whisper)
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 180000);

                    let res: Response;
                    try {
                      res = await fetch('http://localhost:5000/api/meeting/process-bot-audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ audioUrl, title: meetingLabel }),
                        signal: controller.signal,
                      });
                    } finally {
                      clearTimeout(timeoutId);
                    }

                    const resultData = await res.json();
                    console.log('[Bot] process-bot-audio response:', res.status, JSON.stringify(resultData).slice(0, 300));

                    if (res.ok && resultData.transcript) {
                      setSession(null);
                      // Pass the pre-computed summary from the backend so summary.tsx
                      // does NOT need to call OpenRouter again.
                      router.push({
                        pathname: '/(tabs)/summary',
                        params: {
                          transcript: resultData.transcript,
                          precomputedSummary: resultData.summary || '',
                          precomputedActionItems: JSON.stringify(resultData.action_items || []),
                          ts: Date.now().toString(),
                        },
                      });
                      return;
                    }

                    // Backend returned an error — surface it
                    console.error('[Bot] process-bot-audio error body:', resultData);
                    setSession(p => p ? { ...p, status: 'idle', error: resultData.details || resultData.error || 'Backend processing failed' } : p);
                    return;
                  }

                  // No audio URL — nothing useful to transcribe
                  setSession(p => p ? { ...p, status: 'idle', error: 'Meeting ended but no audio was recorded by MeetingBaaS.' } : p);
                } catch (e: any) {
                  console.error('[Bot] Completion handler error:', e);
                  setSession(p => p ? { ...p, status: 'idle', error: e.name === 'AbortError' ? 'Transcription timed out (>3 min). Please try again.' : e.message } : p);
                }
              })();

              return { ...prev, status: 'processing' };
            }

            return { ...prev, status: newStatus };
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL_MS);
  }, [finalizeSession, stopPolling]);

  // ── Join a meeting link ───────────────────────────────────────────────────
  const joinMeetingLink = useCallback(async (url: string) => {
    const platform = detectPlatform(url);
    if (!platform) throw new Error('Unrecognized meeting URL');

    const tempId = `bot-${Date.now()}`;
    setSession({
      sessionId: tempId,
      platform,
      label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} call`,
      status: 'joining',
      startedAt: Date.now(),
    });

    try {
      const res = await fetch('http://localhost:5000/api/online-meeting/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingUrl: url }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to join meeting');
      
      // MeetingBaaS returns bot details. We assume success and start polling.
      const botId = data.data?.bot_id || data.bot_id || tempId;
      // We start polling immediately. The status will update to 'in_call' when the backend says so.
      setSession(prev => prev ? { ...prev, sessionId: botId } : prev);
      startPolling(botId);
    } catch (e: any) {
      setSession(prev => prev ? { ...prev, status: 'idle', error: e.message } : prev);
    }
  }, [startPolling]);

  // ── Join a Discord voice channel ──────────────────────────────────────────
  const joinDiscord = useCallback(async (guildId: string, channelId: string, channelName: string) => {
    const tempId = `bot-discord-${Date.now()}`;
    setSession({
      sessionId: tempId,
      platform: 'discord',
      label: `#${channelName}`,
      status: 'joining',
      startedAt: Date.now(),
    });

    try {
      // TODO (Mujtaba): replace stub
      // const res = await fetch('/api/bot/discord/join', { ... });
      setTimeout(() => {
        setSession(prev => prev ? { ...prev, status: 'in_call' } : prev);
        startPolling(tempId);
      }, 2000);
    } catch (e: any) {
      setSession(prev => prev ? { ...prev, status: 'idle', error: e.message } : prev);
    }
  }, [startPolling]);

  // ── Disconnect bot ────────────────────────────────────────────────────────
  const disconnectBot = useCallback(async () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, status: 'disconnecting' } : prev);

    try {
      // Physically remove the bot from the call
      const res = await fetch(`http://localhost:5000/api/bot/disconnect/${session.sessionId}`, { method: 'POST' });
      
      if (!res.ok) {
        throw new Error('Failed to disconnect bot instantly. It may take a minute to leave, or you can remove it manually from the call participants list.');
      }
      
      // Do NOT stop polling and do NOT finalize here. 
      // The polling loop will detect status='completed' in a few seconds, 
      // grab the transcript from MeetingBaaS, and trigger the finalize flow naturally.
    } catch (e: any) {
      setSession(prev => prev ? { ...prev, status: 'disconnect_requested', error: e.message } : prev);
    }
  }, [session]);

  const clearError = useCallback(() => {
    setSession(prev => prev ? { ...prev, error: undefined } : prev);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return (
    <BotContext.Provider value={{ session, joinMeetingLink, joinDiscord, disconnectBot, clearError }}>
      {children}
    </BotContext.Provider>
  );
}

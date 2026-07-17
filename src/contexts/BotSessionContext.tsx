import React, { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { generateMeetingSummary } from '../lib/groq';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BotPlatform = 'zoom' | 'meet' | 'teams' | 'discord';

export type BotSessionStatus =
  | 'idle'
  | 'joining'
  | 'in_call'
  | 'disconnecting'
  | 'processing';

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
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // ── Poll the backend for session status ──────────────────────────────────
  const startPolling = useCallback((sessionId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        // TODO (Mujtaba): replace with real endpoint
        // const res = await fetch(`/api/bot/status/${sessionId}`);
        // const data = await res.json();
        // Stub: simulate progression for UI wiring
        setSession(prev => {
          if (!prev || prev.sessionId !== sessionId) return prev;
          return prev; // real logic: update from data.status
        });
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  }, []);

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
      router.push({ pathname: '/summary', params: { transcript } });
    } catch (e) {
      console.error('Bot finalize error:', e);
    } finally {
      stopPolling();
      setSession(null);
    }
  }, [router, stopPolling]);

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
      // TODO (Mujtaba): replace stub with real API call
      // const res = await fetch('/api/bot/join', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ url }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message || 'Failed to join');
      // setSession(prev => prev ? { ...prev, sessionId: data.sessionId, status: 'in_call' } : prev);
      // startPolling(data.sessionId);

      // STUB: transition to in_call after 2s
      setTimeout(() => {
        setSession(prev => prev ? { ...prev, status: 'in_call' } : prev);
        startPolling(tempId);
      }, 2000);
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
    stopPolling();

    try {
      // TODO (Mujtaba): call disconnect endpoint
      // await fetch(`/api/bot/disconnect/${session.sessionId}`, { method: 'POST' });
      // Then get the transcript from the response and finalize:
      // await finalizeSession(session.sessionId, data.transcript);

      // STUB: finalize with placeholder transcript
      await finalizeSession(session.sessionId, '(Bot transcript will appear here once backend is wired)');
    } catch (e: any) {
      setSession(prev => prev ? { ...prev, error: e.message } : prev);
    }
  }, [session, stopPolling, finalizeSession]);

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

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ToastAndroid, Platform } from 'react-native';
import { useAuth } from './AuthContext';

export interface MeetingMetadata {
  id: string;
  title: string;
  created_at: string;
  source?: string;
  platform?: string;
  summary?: string; // Preview
  suggestions?: string[];
}

interface MeetingsContextType {
  meetings: MeetingMetadata[];
  loading: boolean;
  refreshMeetings: () => Promise<void>;
  upsertMeeting: (meeting: MeetingMetadata) => void;
  renameMeeting: (id: string, newTitle: string) => Promise<boolean>;
  deleteMeeting: (id: string) => Promise<boolean>;
}

const MeetingsContext = createContext<MeetingsContextType>({
  meetings: [],
  loading: true,
  refreshMeetings: async () => {},
  upsertMeeting: () => {},
  renameMeeting: async () => false,
  deleteMeeting: async () => false,
});

export const MeetingsProvider = ({ children }: { children: ReactNode }) => {
  const { user, initialized } = useAuth();
  const [meetings, setMeetings] = useState<MeetingMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else if (Platform.OS === 'web') {
      // Very basic web toast fallback
      alert(msg);
    } else {
      // iOS doesn't have a native toast without extra libs, so we could just use Alert
      // but to not interrupt flow, we'll just ignore for now or use a custom component later
    }
  };

  const refreshMeetings = useCallback(async () => {
    if (!initialized) return;

    if (!user?.id) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch only metadata to keep memory usage low
    const { data, error } = await supabase
      .from('meetings')
      .select('id, title, created_at, summary, suggestions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      console.log(`[PIPELINE] Updating MeetingsContext length to: ${data.length}`);
      setMeetings(data);
    } else if (error) {
      console.log(`[PIPELINE] Error fetching meetings: ${error.message}`);
    }
    setLoading(false);
  }, [initialized, user?.id]);

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings]);

  const upsertMeeting = useCallback((meeting: MeetingMetadata) => {
    setMeetings(prev => {
      const withoutDuplicate = prev.filter(item => item.id !== meeting.id);
      return [meeting, ...withoutDuplicate].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, []);

  const renameMeeting = async (id: string, newTitle: string): Promise<boolean> => {
    // 1. Optimistic Update
    const previousMeetings = [...meetings];
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, title: newTitle } : m));

    // 2. DB Sync
    const { error } = await supabase.from('meetings').update({ title: newTitle }).eq('id', id);
    
    // 3. Rollback on failure
    if (error) {
      console.error('Rename failed', error);
      setMeetings(previousMeetings);
      showToast('Failed to rename transcript.');
      return false;
    }
    
    return true;
  };

  const deleteMeeting = async (id: string): Promise<boolean> => {
    // 1. Optimistic Update
    const previousMeetings = [...meetings];
    setMeetings(prev => prev.filter(m => m.id !== id));

    // 2. DB Sync
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    
    // 3. Rollback on failure
    if (error) {
      console.error('Delete failed', error);
      setMeetings(previousMeetings);
      showToast('Failed to delete transcript.');
      return false;
    }
    
    showToast('Transcript deleted.');
    return true;
  };

  return (
    <MeetingsContext.Provider value={{ meetings, loading, refreshMeetings, upsertMeeting, renameMeeting, deleteMeeting }}>
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = () => useContext(MeetingsContext);

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
  deleted_at?: string;
}

interface MeetingsContextType {
  meetings: MeetingMetadata[];
  trashedMeetings: MeetingMetadata[];
  loading: boolean;
  refreshMeetings: () => Promise<void>;
  upsertMeeting: (meeting: MeetingMetadata) => void;
  renameMeeting: (id: string, newTitle: string) => Promise<boolean>;
  deleteMeeting: (id: string) => Promise<boolean>;
  moveToTrash: (id: string) => Promise<boolean>;
  restoreMeeting: (id: string) => Promise<boolean>;
  restoreMeetings: (ids: string[]) => Promise<boolean>;
  permanentlyDeleteMeeting: (id: string) => Promise<boolean>;
  permanentlyDeleteMeetings: (ids: string[]) => Promise<boolean>;
  emptyTrash: () => Promise<boolean>;
}

const MeetingsContext = createContext<MeetingsContextType>({
  meetings: [],
  trashedMeetings: [],
  loading: true,
  refreshMeetings: async () => {},
  upsertMeeting: () => {},
  renameMeeting: async () => false,
  deleteMeeting: async () => false,
  moveToTrash: async () => false,
  restoreMeeting: async () => false,
  restoreMeetings: async () => false,
  permanentlyDeleteMeeting: async () => false,
  permanentlyDeleteMeetings: async () => false,
  emptyTrash: async () => false,
});

const STORAGE_KEY = 'notia_trashed_meetings';

const loadTrashedFromStorage = (userId?: string): MeetingMetadata[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && userId) {
      const raw = window.localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    }
  } catch (e) {
    console.warn('Failed to load trashed meetings', e);
  }
  return [];
};

const saveTrashedToStorage = (items: MeetingMetadata[], userId?: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && userId) {
      window.localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    }
  } catch (e) {
    console.warn('Failed to save trashed meetings', e);
  }
};

export const MeetingsProvider = ({ children }: { children: ReactNode }) => {
  const { user, initialized } = useAuth();
  const [meetings, setMeetings] = useState<MeetingMetadata[]>([]);
  const [trashedMeetings, setTrashedMeetings] = useState<MeetingMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else if (Platform.OS === 'web') {
      console.log(`[Toast] ${msg}`);
    }
  };

  // Load trashed meetings on mount / user change
  useEffect(() => {
    if (user?.id) {
      const saved = loadTrashedFromStorage(user.id);
      setTrashedMeetings(saved);
    } else {
      setTrashedMeetings([]);
    }
  }, [user?.id]);

  const refreshMeetings = useCallback(async () => {
    if (!initialized) return;

    if (!user?.id) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('meetings')
      .select('id, title, created_at, summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      // Filter out any meetings currently in Trash
      const trashedIds = new Set(loadTrashedFromStorage(user.id).map(t => t.id));
      const activeMeetings = data.filter(m => !trashedIds.has(m.id));
      console.log(`[PIPELINE] Active meetings count: ${activeMeetings.length}, Trashed count: ${trashedIds.size}`);
      setMeetings(activeMeetings);
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
    const previousMeetings = [...meetings];
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, title: newTitle } : m));

    const { error } = await supabase.from('meetings').update({ title: newTitle }).eq('id', id);
    
    if (error) {
      console.error('Rename failed', error);
      setMeetings(previousMeetings);
      showToast('Failed to rename transcript.');
      return false;
    }
    
    return true;
  };

  // Move meeting to Trash (Soft Delete)
  const moveToTrash = async (id: string): Promise<boolean> => {
    const target = meetings.find(m => m.id === id);
    if (!target) return false;

    const trashedItem: MeetingMetadata = {
      ...target,
      deleted_at: new Date().toISOString()
    };

    setMeetings(prev => prev.filter(m => m.id !== id));
    setTrashedMeetings(prev => {
      const updated = [trashedItem, ...prev.filter(m => m.id !== id)];
      saveTrashedToStorage(updated, user?.id);
      return updated;
    });

    showToast('Moved to Trash. Restore anytime in Settings > Trash.');
    return true;
  };

  // Restore single meeting from Trash
  const restoreMeeting = async (id: string): Promise<boolean> => {
    const target = trashedMeetings.find(m => m.id === id);
    if (!target) return false;

    const { deleted_at, ...cleanMeeting } = target;

    setTrashedMeetings(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveTrashedToStorage(updated, user?.id);
      return updated;
    });

    setMeetings(prev => {
      const withoutDuplicate = prev.filter(item => item.id !== id);
      return [cleanMeeting, ...withoutDuplicate].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    showToast('Restored to workspace.');
    return true;
  };

  // Restore multiple meetings from Trash
  const restoreMeetings = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return true;
    const idSet = new Set(ids);
    const restoredItems = trashedMeetings.filter(m => idSet.has(m.id)).map(({ deleted_at, ...rest }) => rest);

    setTrashedMeetings(prev => {
      const updated = prev.filter(m => !idSet.has(m.id));
      saveTrashedToStorage(updated, user?.id);
      return updated;
    });

    setMeetings(prev => {
      const withoutDuplicates = prev.filter(m => !idSet.has(m.id));
      return [...restoredItems, ...withoutDuplicates].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    showToast(`${restoredItems.length} ${restoredItems.length === 1 ? 'item' : 'items'} restored to workspace.`);
    return true;
  };

  // Permanently delete single meeting from Trash & DB
  const permanentlyDeleteMeeting = async (id: string): Promise<boolean> => {
    setTrashedMeetings(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveTrashedToStorage(updated, user?.id);
      return updated;
    });

    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) {
      console.error('Permanent delete failed', error);
    }
    showToast('Permanently deleted from Trash.');
    return true;
  };

  // Permanently delete multiple selected meetings from Trash & DB
  const permanentlyDeleteMeetings = async (ids: string[]): Promise<boolean> => {
    if (ids.length === 0) return true;
    const idSet = new Set(ids);

    setTrashedMeetings(prev => {
      const updated = prev.filter(m => !idSet.has(m.id));
      saveTrashedToStorage(updated, user?.id);
      return updated;
    });

    const { error } = await supabase.from('meetings').delete().in('id', ids);
    if (error) {
      console.error('Permanent delete failed', error);
    }
    showToast(`${ids.length} ${ids.length === 1 ? 'item' : 'items'} permanently deleted.`);
    return true;
  };

  // Empty entire Trash
  const emptyTrash = async (): Promise<boolean> => {
    const ids = trashedMeetings.map(m => m.id);
    setTrashedMeetings([]);
    saveTrashedToStorage([], user?.id);

    if (ids.length > 0) {
      const { error } = await supabase.from('meetings').delete().in('id', ids);
      if (error) console.error('Empty trash failed', error);
    }

    showToast('Trash emptied.');
    return true;
  };

  return (
    <MeetingsContext.Provider value={{ 
      meetings, 
      trashedMeetings, 
      loading, 
      refreshMeetings, 
      upsertMeeting, 
      renameMeeting, 
      deleteMeeting: moveToTrash, 
      moveToTrash, 
      restoreMeeting, 
      restoreMeetings, 
      permanentlyDeleteMeeting, 
      permanentlyDeleteMeetings, 
      emptyTrash 
    }}>
      {children}
    </MeetingsContext.Provider>
  );
};

export const useMeetings = () => useContext(MeetingsContext);


import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

export type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

export const processingStages = [
  'Capturing audio…',
  'Generating transcript…',
  'Extracting decisions…',
  'Finding action items…',
  'Building summary…'
];

export function useRecording(onFinished?: (transcript: string) => void) {
  const router = useRouter();
  const [state, setState] = useState<RecordState>('idle');
  const [timer, setTimer] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [mediaStream, setMediaStream] = useState<any>(null);

  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef(false);
  const shouldBeRecordingRef = useRef(false);

  useEffect(() => {
    let interval: any;
    if (state === 'recording') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  const startRecognition = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setDisplayTranscript('Browser not supported for voice recognition.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcriptRef.current += result[0].transcript + ' ';
          setDisplayTranscript(transcriptRef.current);
          setInterimText('');
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    rec.onerror = (e: any) => {
      recognitionActiveRef.current = false;
    };

    rec.onend = () => {
      recognitionActiveRef.current = false;
      if (shouldBeRecordingRef.current) {
        setTimeout(() => {
          if (shouldBeRecordingRef.current && !recognitionActiveRef.current) {
            startRecognition();
          }
        }, 250);
      }
    };

    rec.onstart = () => {
      recognitionActiveRef.current = true;
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { }
  }, []);

  const stopRecognition = useCallback(() => {
    shouldBeRecordingRef.current = false;
    recognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track: any) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const startRecording = useCallback(() => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    
    if (Platform.OS === 'web' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setMediaStream(stream);
          startRecognition();
        })
        .catch(err => {
          setDisplayTranscript('Microphone access denied.');
        });
    } else {
      startRecognition();
    }
  }, [startRecognition]);

  const pauseRecording = useCallback(() => {
    if (state === 'recording') {
      shouldBeRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setState('paused');
    } else if (state === 'paused') {
      setState('recording');
      shouldBeRecordingRef.current = true;
      startRecognition();
    }
  }, [state, startRecognition]);

  const stopRecording = useCallback(() => {
    stopRecognition();
    setState('processing');
  }, [stopRecognition]);

  const cancelRecording = useCallback(() => {
    stopRecognition();
    setState('idle');
    setTimer(0);
    setDisplayTranscript('');
    setInterimText('');
  }, [stopRecognition]);

  // Handle processing state flow
  useEffect(() => {
    if (state === 'processing') {
      setProcessingStage(0);
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        if (stage < processingStages.length) {
          setProcessingStage(stage);
        }
      }, 1000);

      const finishTimer = setTimeout(() => {
        clearInterval(interval);
        const finalTranscript = transcriptRef.current.trim();
        if (onFinished) {
          onFinished(finalTranscript);
        } else {
          router.push({
            pathname: '/(tabs)/summary',
            params: { transcript: finalTranscript, ts: Date.now().toString() },
          });
        }
        
        setTimeout(() => {
          setState('idle');
          setTimer(0);
          setProcessingStage(0);
          setDisplayTranscript('');
          setInterimText('');
        }, 500);
      }, Math.min(processingStages.length * 1000, 4000));

      return () => {
        clearInterval(interval);
        clearTimeout(finishTimer);
      };
    }
  }, [state, onFinished, router]);

  return {
    state,
    timer,
    displayTranscript,
    interimText,
    processingStage,
    mediaStream,
    startRecording,
    pauseRecording,
    stopRecording,
    cancelRecording
  };
}

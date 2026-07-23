import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { transcribeAudioBlob } from '../services/transcriptionService';

export type RecordState = 'idle' | 'recording' | 'paused' | 'processing';

export const processingStages = [
  'Capturing audio…',
  'Transcribing with Groq Whisper…',
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
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    if (!SR) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let accumulatedFinal = '';
      let currentInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          accumulatedFinal += result[0].transcript + ' ';
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (accumulatedFinal) {
        transcriptRef.current = accumulatedFinal;
      }
      
      setDisplayTranscript(transcriptRef.current.trim());
      setInterimText(currentInterim.trim());
    };

    rec.onerror = (e: any) => {
      console.log('[WebSpeech Error]', e.error);
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (_) {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track: any) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const startRecording = useCallback(async () => {
    transcriptRef.current = '';
    setDisplayTranscript('');
    setInterimText('');
    setTimer(0);
    setState('recording');
    shouldBeRecordingRef.current = true;
    audioChunksRef.current = [];

    const audioConstraints: any = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (Platform.OS === 'web' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        setMediaStream(stream);

        const mimeType = (window as any).MediaRecorder?.isTypeSupported?.('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (window as any).MediaRecorder?.isTypeSupported?.('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

        const mr = new (window as any).MediaRecorder(stream, { mimeType });
        mr.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mr.start(500);
        mediaRecorderRef.current = mr;

        startRecognition();
      } catch (err) {
        console.error('Microphone access error:', err);
        setDisplayTranscript('Could not access microphone.');
      }
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.pause(); } catch (_) {}
      }
      setState('paused');
    } else if (state === 'paused') {
      setState('recording');
      shouldBeRecordingRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        try { mediaRecorderRef.current.resume(); } catch (_) {}
      }
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

  // Handle processing state flow with Groq Whisper
  useEffect(() => {
    if (state === 'processing') {
      setProcessingStage(0);
      let stage = 0;
      const interval = setInterval(() => {
        stage++;
        if (stage < processingStages.length) {
          setProcessingStage(stage);
        }
      }, 900);

      const processAudioTask = async () => {
        let finalTranscript = '';

        try {
          if (audioChunksRef.current.length > 0) {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

            if (audioBlob.size > 100) {
              setProcessingStage(1);
              const res = await transcribeAudioBlob(audioBlob, 'Recorded Meeting');
              if (res.transcript && res.transcript.trim().length > 0) {
                finalTranscript = res.transcript.trim();
              }
            }
          }
        } catch (err) {
          console.warn('Cloud Whisper API transcription warning, fallback text:', err);
        }

        if (!finalTranscript) {
          finalTranscript = transcriptRef.current.trim();
        }

        if (!finalTranscript) {
          finalTranscript = 'Meeting recording completed.';
        }

        clearInterval(interval);

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
      };

      processAudioTask();

      return () => {
        clearInterval(interval);
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VoiceState } from "@/types/voiceState.type";
import { useCallback, useEffect, useRef, useState } from "react";

export const useVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isPlaying: false,
    transcript: "",
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "vi-VN";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceState((prev) => ({ ...prev, transcript: finalTranscript }));
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setVoiceState((prev) => ({
          ...prev,
          error: event.error,
          isRecording: false,
        }));
      };
    }

    // Initialize Speech Synthesis
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (recognitionRef.current) {
      setVoiceState({
        isRecording: true,
        isPlaying: false,
        transcript: "",
        error: null,
      });
      recognitionRef.current.start();
    } else {
      setVoiceState((prev) => ({
        ...prev,
        error: "Trình duyệt không hỗ trợ nhận dạng giọng nói",
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceState((prev) => ({ ...prev, isRecording: false }));
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;

      utterance.onstart = () =>
        setVoiceState((prev) => ({ ...prev, isPlaying: true }));
      utterance.onend = () =>
        setVoiceState((prev) => ({ ...prev, isPlaying: false }));

      synthRef.current.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  return { voiceState, startRecording, stopRecording, speak, stopSpeaking };
};

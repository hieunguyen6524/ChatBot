/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VoiceState } from "@/types/voiceState.type";
import { useCallback, useEffect, useRef, useState } from "react";

export const useVoice = () => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isPlaying: false,
    transcript: "",
    error: null,
    audioLevel: 0,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const interimTranscriptRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>(""); // Lưu final transcript đã xác nhận

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
        let newFinalTranscript = "";
        let newInterimTranscript = "";
        
        // Chỉ lấy phần mới từ resultIndex trở đi (tránh duplicate)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            // Chỉ thêm phần mới vào final transcript (không cộng lại phần cũ)
            newFinalTranscript += transcript;
            // Cập nhật final transcript ref với phần đã final
            finalTranscriptRef.current += transcript;
          } else {
            // Lấy interim transcript mới nhất
            newInterimTranscript += transcript;
          }
        }
        
        // Cập nhật interim transcript ref
        if (newInterimTranscript) {
          interimTranscriptRef.current = newInterimTranscript;
        } else {
          interimTranscriptRef.current = "";
        }
        
        // Hiển thị: final transcript (đã xác nhận) + interim transcript (chưa xác nhận)
        const displayTranscript = (
          finalTranscriptRef.current + 
          (interimTranscriptRef.current ? " " + interimTranscriptRef.current : "")
        ).trim();
        
        setVoiceState((prev) => ({
          ...prev,
          transcript: displayTranscript,
        }));
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const isRecordingRef = useRef(false);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) {
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Sử dụng getByteTimeDomainData để lấy amplitude
    analyser.getByteTimeDomainData(dataArray);

    // Tính toán mức âm thanh (RMS - Root Mean Square)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Normalize từ 0-1 thành 0-100 với sensitivity boost
    const audioLevel = Math.min(100, rms * 200);

    setVoiceState((prev) => ({ ...prev, audioLevel }));

    if (isRecordingRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (recognitionRef.current) {
      try {
        // Lấy microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Tạo AudioContext và AnalyserNode
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        source.connect(analyser);

        setVoiceState({
          isRecording: true,
          isPlaying: false,
          transcript: "",
          error: null,
          audioLevel: 0,
        });

        // Reset transcript refs khi bắt đầu recording mới
        finalTranscriptRef.current = "";
        interimTranscriptRef.current = "";
        isRecordingRef.current = true;
        recognitionRef.current.start();
        // Bắt đầu phân tích audio
        analyzeAudio();
      } catch (error) {
        setVoiceState((prev) => ({
          ...prev,
          error: "Không thể truy cập microphone",
          isRecording: false,
        }));
      }
    } else {
      setVoiceState((prev) => ({
        ...prev,
        error: "Trình duyệt không hỗ trợ nhận dạng giọng nói",
      }));
    }
  }, [analyzeAudio]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    isRecordingRef.current = false;

    // Dừng phân tích audio
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Đóng audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Đóng audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // Lấy transcript cuối cùng: final + interim (nếu có)
    const finalTranscript = finalTranscriptRef.current.trim();
    const interimTranscript = interimTranscriptRef.current.trim();
    const finalCombinedTranscript = (
      finalTranscript + 
      (interimTranscript ? " " + interimTranscript : "")
    ).trim();
    
    setVoiceState((prev) => ({
      ...prev,
      isRecording: false,
      audioLevel: 0,
      transcript: finalCombinedTranscript,
    }));
    
    // Reset refs sau khi đã lấy transcript
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
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


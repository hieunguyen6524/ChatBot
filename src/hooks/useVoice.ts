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

      // recognitionRef.current.onresult = (event: any) => {
      //   let finalTranscript = "";
      //   let interimTranscript = "";
      //   let allFinalTranscript = ""; // Toàn bộ final transcript
        
      //   // Lấy toàn bộ final transcript từ đầu
      //   for (let i = 0; i < event.results.length; i++) {
      //     if (event.results[i].isFinal) {
      //       allFinalTranscript += event.results[i][0].transcript;
      //     }
      //   }
        
      //   // Lấy phần mới từ resultIndex (chỉ phần mới được thêm vào)
      //   for (let i = event.resultIndex; i < event.results.length; i++) {
      //     const transcript = event.results[i][0].transcript;
      //     if (event.results[i].isFinal) {
      //       finalTranscript += transcript;
      //     } else {
      //       interimTranscript += transcript;
      //     }
      //   }
        
      //   // Cập nhật transcript với toàn bộ final results (lấy từ đầu để tránh duplicate)
      //   if (allFinalTranscript) {
      //     setVoiceState((prev) => ({ 
      //       ...prev, 
      //       transcript: allFinalTranscript.trim()
      //     }));
      //     interimTranscriptRef.current = ""; // Clear interim sau khi có final
      //   } else if (interimTranscript) {
      //     // Hiển thị interim transcript nếu chưa có final
      //     // Lấy final transcript hiện tại + interim mới
      //     setVoiceState((prev) => {
      //       const currentFinal = prev.transcript.trim();
      //       const combinedTranscript = currentFinal ? 
      //         (currentFinal + " " + interimTranscript).trim() : 
      //         interimTranscript.trim();
            
      //       return {
      //         ...prev,
      //         transcript: combinedTranscript
      //       };
      //     });
      //     interimTranscriptRef.current = interimTranscript;
      //   }
      // };
      const finalTranscriptRef = useRef<string>("");

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = finalTranscriptRef.current;
        let interimTranscript = "";
      
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            finalTranscriptRef.current = finalTranscript; // Lưu phần final đã xác nhận
          } else {
            interimTranscript += transcript;
          }
        }
      
        const combined = (finalTranscript + " " + interimTranscript).trim();
      
        setVoiceState((prev) => ({
          ...prev,
          transcript: combined,
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

        // Reset interim transcript
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

    // Lấy transcript cuối cùng từ state (đã được update trong onresult)
    // Chỉ thêm interim nếu có và chưa được finalize
    setVoiceState((prev) => {
      let finalTranscript = prev.transcript.trim();
      
      // Nếu có interim transcript, thêm vào (chỉ nếu chưa có trong transcript)
      if (interimTranscriptRef.current && interimTranscriptRef.current.trim()) {
        const interim = interimTranscriptRef.current.trim();
        // Chỉ thêm nếu interim không trùng với phần cuối của transcript
        if (!finalTranscript.endsWith(interim)) {
          finalTranscript = (finalTranscript + " " + interim).trim();
        }
        interimTranscriptRef.current = "";
      }
      
      return {
        ...prev,
        isRecording: false,
        audioLevel: 0,
        transcript: finalTranscript,
      };
    });
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

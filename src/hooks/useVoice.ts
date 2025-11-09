/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VoiceState, LanguageCode } from "@/types/voiceState.type";
import { useCallback, useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

// Helper function to detect language from text
const detectLanguage = (text: string): "vi-VN" | "en-US" => {
  if (!text || text.trim().length === 0) {
    return "vi-VN"; // Default to Vietnamese
  }

  // Simple heuristic: count Vietnamese-specific characters
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/gi;
  const vietnameseMatches = text.match(vietnameseChars) || [];
  const vietnameseRatio = vietnameseMatches.length / text.length;

  // If more than 5% of characters are Vietnamese-specific, assume Vietnamese
  if (vietnameseRatio > 0.05) {
    return "vi-VN";
  }

  // Check for common English words/patterns
  const englishPattern = /\b(the|and|is|are|was|were|this|that|with|from|have|has|had|will|would|can|could|should|may|might)\b/gi;
  const englishMatches = text.match(englishPattern) || [];
  const englishRatio = englishMatches.length / (text.split(/\s+/).length || 1);

  // If significant English words found, assume English
  if (englishRatio > 0.1) {
    return "en-US";
  }

  // Otherwise, assume Vietnamese (default)
  return "vi-VN";
};

// Helper function to get browser language
const getBrowserLanguage = (): "vi-VN" | "en-US" => {
  const browserLang = navigator.language || (navigator as any).userLanguage || "vi-VN";
  
  // Check if browser language starts with 'vi' (Vietnamese)
  if (browserLang.toLowerCase().startsWith("vi")) {
    return "vi-VN";
  }
  
  // Check if browser language starts with 'en' (English)
  if (browserLang.toLowerCase().startsWith("en")) {
    return "en-US";
  }
  
  // Default to Vietnamese
  return "vi-VN";
};

export const useVoice = () => {
  const [language, setLanguageState] = useState<LanguageCode>("auto");
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isPlaying: false,
    transcript: "",
    error: null,
    audioLevel: 0,
    language: "auto",
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef<string>("");

  // Use react-speech-recognition hook with optimized settings for Vietnamese
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    finalTranscript,
    interimTranscript,
  } = useSpeechRecognition();

  // Initialize Speech Synthesis
  useEffect(() => {
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Update voice state when transcript changes
  useEffect(() => {
    // Use the full transcript from the hook, which combines final and interim properly
    // The transcript from useSpeechRecognition already handles this correctly
    let currentTranscript = transcript;

    // If transcript is empty but we have finalTranscript, use that
    if (!currentTranscript && finalTranscript) {
      currentTranscript = finalTranscript;
    }

    // Combine final and interim transcripts manually for better control
    // This ensures we don't lose any text
    const combinedTranscript = finalTranscript
      ? finalTranscript + (interimTranscript ? " " + interimTranscript : "")
      : interimTranscript || currentTranscript;

    // Clean up transcript: remove extra spaces but preserve the content
    const cleanedTranscript = combinedTranscript
      .trim()
      .replace(/\s+/g, " ");

    // Auto-detect language if in auto mode and we have transcript
    let detectedLanguage = language;
    if (language === "auto" && cleanedTranscript) {
      detectedLanguage = detectLanguage(cleanedTranscript);
    } else if (language !== "auto") {
      detectedLanguage = language;
    }

    setVoiceState((prev) => ({
      ...prev,
      transcript: cleanedTranscript || prev.transcript, // Keep previous if empty
      isRecording: listening,
      error: listening ? null : prev.error, // Clear error when recording starts
      language: detectedLanguage as LanguageCode,
    }));
  }, [transcript, finalTranscript, interimTranscript, listening, language]);

  // Update language state when language changes
  useEffect(() => {
    setVoiceState((prev) => ({ ...prev, language }));
  }, [language]);

  // Analyze audio level for visualization
  const analyzeAudio = useCallback(() => {
    // Check if we should continue
    if (!analyserRef.current) {
      return;
    }

    if (!isRecordingRef.current) {
      // Stop animation if not recording
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Check AudioContext state
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch((e) => {
        console.error("Error resuming AudioContext:", e);
      });
    }

    try {
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Use getByteTimeDomainData to get amplitude (time domain)
      analyser.getByteTimeDomainData(dataArray);

      // Calculate audio level (RMS - Root Mean Square)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Normalize from 0-1 to 0-100 with increased sensitivity
      // Increased multiplier for better visualization
      // The multiplier of 500 gives good sensitivity for voice
      const rawLevel = rms * 500;
      // Minimum 10 for visible animation, maximum 100
      const audioLevel = Math.min(100, Math.max(10, rawLevel));

      // Always update audio level to keep animation responsive
      // This will trigger re-render in SiriVoiceInterface and update waveform
      setVoiceState((prev) => ({
        ...prev,
        audioLevel, // Always update audioLevel when recording
      }));

      // Continue animation loop - this creates the continuous animation
      // Check conditions before scheduling next frame
      if (isRecordingRef.current && analyserRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      } else {
        // Clean up if conditions are no longer met
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error analyzing audio:", error);
      // Stop animation on error
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, []);

  // Sync isRecordingRef with listening state and manage audio analysis
  useEffect(() => {
    isRecordingRef.current = listening;
    
    // If listening stopped, stop audio analysis and reset audio level
    if (!listening) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setVoiceState((prev) => ({ ...prev, audioLevel: 0 }));
      return;
    }
    
    // If listening started and we have analyser, start/restart analysis
    if (listening && analyserRef.current && audioContextRef.current) {
      // Small delay to ensure everything is ready
      const startAnalysisTimeout = setTimeout(() => {
        // Ensure AudioContext is running
        if (audioContextRef.current) {
          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().then(() => {
              if (isRecordingRef.current && analyserRef.current && !animationFrameRef.current) {
                analyzeAudio();
              }
            }).catch((e) => {
              console.error("Error resuming AudioContext:", e);
            });
          } else if (!animationFrameRef.current && isRecordingRef.current && analyserRef.current) {
            // Start analysis if not already running
            analyzeAudio();
          }
        }
      }, 50);

      return () => {
        clearTimeout(startAnalysisTimeout);
      };
    }
  }, [listening, analyzeAudio]);

  const startRecording = useCallback(async () => {
    // Check browser support
    if (!browserSupportsSpeechRecognition) {
      setVoiceState((prev) => ({
        ...prev,
        error: "Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng sử dụng Chrome hoặc Edge.",
        isRecording: false,
      }));
      return;
    }

    try {
      // Improved audio constraints for better quality
      const audioConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true, // Reduce echo
          noiseSuppression: true, // Reduce background noise
          autoGainControl: true, // Normalize volume
          sampleRate: 16000, // Optimal sample rate for speech recognition
          channelCount: 1, // Mono channel
        },
      };

      // Get microphone stream with improved constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      } catch (constraintError: any) {
        // Fallback to basic constraints if advanced constraints are not supported
        if (
          constraintError.name === "OverconstrainedError" ||
          constraintError.name === "ConstraintNotSatisfiedError"
        ) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw constraintError;
        }
      }

      streamRef.current = stream;

      // Create AudioContext with optimal settings
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 16000, // Match the sample rate
      });
      audioContextRef.current = audioContext;

      // Resume AudioContext if it's suspended (required by some browsers)
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      // Optimized analyser settings for voice detection
      analyser.fftSize = 512; // Higher resolution for better audio analysis
      analyser.smoothingTimeConstant = 0.7; // Smoother audio level visualization
      analyserRef.current = analyser;

      source.connect(analyser);

      // Verify AudioContext is running
      if (audioContext.state !== "running") {
        await audioContext.resume();
      }

      // Reset transcript
      resetTranscript();
      finalTranscriptRef.current = "";

      // Set recording flag BEFORE starting recognition and setting up audio
      isRecordingRef.current = true;

      // Determine language to use
      // If auto, detect from browser language for better initial accuracy
      const recognitionLanguage = language === "auto" ? getBrowserLanguage() : language;

      // Reset state but keep audioLevel at a minimum for visualization
      setVoiceState({
        isRecording: false, // Will be set to true by listening state
        isPlaying: false,
        transcript: "",
        error: null,
        audioLevel: 10, // Base level for visible animation
        language: recognitionLanguage,
      });

      // Start recognition with optimized settings
      // Key improvements:
      // - continuous: true - Continue listening, don't stop after silence
      // - interimResults: true - Get real-time results as user speaks
      // - language: Dynamic based on user selection or auto-detect
      await SpeechRecognition.startListening({
        continuous: true, // CRITICAL: Keep listening continuously, don't stop after each sentence
        interimResults: true, // Get interim results in real-time
        language: recognitionLanguage, // Dynamic language (vi-VN or en-US)
        // react-speech-recognition will handle the recognition properly
        // and won't finalize until we explicitly stop
      });

      // Audio analysis will be started automatically by the useEffect
      // that watches the 'listening' state from react-speech-recognition
    } catch (error: any) {
      console.error("Error starting recording:", error);

      let errorMessage = "Không thể truy cập microphone";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Quyền truy cập microphone bị từ chối. Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "Không tìm thấy microphone. Vui lòng kiểm tra thiết bị của bạn.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage = "Microphone đang được sử dụng bởi ứng dụng khác.";
      }

      setVoiceState((prev) => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
      }));
    }
  }, [browserSupportsSpeechRecognition, resetTranscript, analyzeAudio]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;

    // Stop audio analysis first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop recognition - this will finalize any pending interim results
    SpeechRecognition.stopListening();

    // Small delay to ensure all final transcripts are processed
    // This is important because Web Speech API might need a moment to finalize
    setTimeout(() => {
      // Get the final transcript after stopping
      // The transcript hook should have all the final results by now
      const finalTranscriptValue = finalTranscript.trim();
      const interimTranscriptValue = interimTranscript.trim();
      const fullTranscriptValue = transcript.trim();

      // Combine all available transcripts with priority
      // Priority: full transcript > final + interim > final only > interim only
      let finalCombinedTranscript = fullTranscriptValue;
      
      if (!finalCombinedTranscript && finalTranscriptValue) {
        finalCombinedTranscript = (
          finalTranscriptValue +
          (interimTranscriptValue ? " " + interimTranscriptValue : "")
        ).trim();
      }

      // If still empty, use interim or the hook's transcript
      if (!finalCombinedTranscript) {
        finalCombinedTranscript = interimTranscriptValue || transcript.trim();
      }

      // Clean up: remove multiple spaces but preserve all words
      finalCombinedTranscript = finalCombinedTranscript.replace(/\s+/g, " ").trim();

      // Close audio stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => {
          console.error("Error closing audio context:", e);
        });
        audioContextRef.current = null;
      }

      analyserRef.current = null;

      // Update state with final transcript
      setVoiceState((prev) => ({
        ...prev,
        isRecording: false,
        audioLevel: 0,
        transcript: finalCombinedTranscript || prev.transcript, // Keep previous if no new one
      }));
    }, 500); // Wait 500ms for all final transcripts to be processed by Web Speech API
  }, [finalTranscript, interimTranscript, transcript]);

  const speak = useCallback((text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Determine language for speech synthesis
      // If auto, detect from text; otherwise use selected language
      let synthLanguage: string;
      if (language === "auto") {
        synthLanguage = detectLanguage(text);
      } else {
        synthLanguage = language;
      }
      
      utterance.lang = synthLanguage;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () =>
        setVoiceState((prev) => ({ ...prev, isPlaying: true }));
      utterance.onend = () =>
        setVoiceState((prev) => ({ ...prev, isPlaying: false }));
      utterance.onerror = () =>
        setVoiceState((prev) => ({ ...prev, isPlaying: false }));

      synthRef.current.speak(utterance);
    }
  }, [language]);

  // Function to change language
  const setLanguage = useCallback((newLanguage: LanguageCode) => {
    setLanguageState(newLanguage);
    // If currently recording, restart with new language
    if (isRecordingRef.current) {
      SpeechRecognition.stopListening();
      setTimeout(() => {
        const recognitionLanguage = newLanguage === "auto" ? "vi-VN" : newLanguage;
        SpeechRecognition.startListening({
          continuous: true,
          interimResults: true,
          language: recognitionLanguage,
        });
      }, 100);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setVoiceState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors on cleanup
        });
      }

      if (synthRef.current) {
        synthRef.current.cancel();
      }

      // Stop recognition if still listening
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [listening]);

  return { 
    voiceState, 
    startRecording, 
    stopRecording, 
    speak, 
    stopSpeaking,
    setLanguage,
    language,
  };
};

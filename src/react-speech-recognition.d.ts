declare module 'react-speech-recognition' {
  export interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    language?: string;
    maxAlternatives?: number;
  }

  export interface UseSpeechRecognitionReturn {
    transcript: string;
    finalTranscript: string;
    interimTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable?: boolean;
  }

  export function useSpeechRecognition(): UseSpeechRecognitionReturn;

  const SpeechRecognition: {
    startListening: (options?: SpeechRecognitionOptions) => Promise<void>;
    stopListening: () => void;
    abortListening: () => void;
    getRecognition: () => any;
    applyPolyfill: (SpeechRecognition: any) => void;
  };

  export default SpeechRecognition;
}


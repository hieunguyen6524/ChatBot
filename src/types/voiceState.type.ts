// ============= TYPES =============
export interface VoiceState {
  isRecording: boolean;
  isPlaying: boolean;
  transcript: string;
  error: string | null;
}

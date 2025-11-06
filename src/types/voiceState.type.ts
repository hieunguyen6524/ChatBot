// ============= TYPES =============
export interface VoiceState {
  isRecording: boolean;
  isPlaying: boolean;
  transcript: string;
  error: string | null;
  audioLevel: number; // 0-100, mức độ âm thanh
}

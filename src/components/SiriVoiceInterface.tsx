import type { VoiceState } from "@/types/voiceState.type";
import { motion } from "framer-motion";
import { Mic, Volume2, X } from "lucide-react";

type SiriVoiceInterfaceProps = {
  voiceState: VoiceState;
  onClose: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
};

function SiriVoiceInterface({
  voiceState,
  onClose,
  onStopRecording,
}: // onStopSpeaking,
SiriVoiceInterfaceProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-purple-900/95 via-blue-900/95 to-pink-900/95 backdrop-blur-xl"
      onClick={voiceState.isRecording ? onStopRecording : onClose}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Siri Orb Animation */}

        <div className="relative flex items-center justify-center">
          {/* Outer glow rings */}
          {voiceState.isRecording && (
            <>
              <motion.div
                className="absolute rounded-full bg-linear-to-r from-purple-500 to-pink-500 opacity-30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  width: "200px",
                  height: "200px",
                }}
              />
              <motion.div
                className="absolute rounded-full bg-linear-to-r from-blue-500 to-cyan-500 opacity-20"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.2, 0.05, 0.2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                style={{
                  width: "250px",
                  height: "250px",
                }}
              />
            </>
          )}

          {/* Main orb */}
          <motion.div
            className="relative w-32 h-32 rounded-full bg-linear-to-br from-purple-400 via-pink-400 to-blue-400 shadow-2xl flex items-center justify-center"
            animate={
              voiceState.isRecording
                ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 40px rgba(168, 85, 247, 0.6)",
                      "0 0 80px rgba(236, 72, 153, 0.8)",
                      "0 0 40px rgba(168, 85, 247, 0.6)",
                    ],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Waveform bars inside orb */}
            {voiceState.isRecording && (
              <div className="flex items-center justify-center gap-1">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white rounded-full"
                    animate={{
                      height: [10, 40, 10],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Mic icon when not recording */}
            {!voiceState.isRecording && !voiceState.isPlaying && (
              <Mic className="w-12 h-12 text-white" />
            )}

            {/* Volume icon when playing */}
            {voiceState.isPlaying && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Volume2 className="w-12 h-12 text-white" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Status text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-white text-2xl font-medium mb-2">
            {voiceState.isRecording && "Đang lắng nghe..."}
            {voiceState.isPlaying && "Đang trả lời..."}
            {!voiceState.isRecording && !voiceState.isPlaying && "Nhấn để nói"}
          </p>

          {/* Transcript */}
          {voiceState.transcript && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/80 text-lg max-w-md mx-auto px-4"
            >
              "{voiceState.transcript}"
            </motion.p>
          )}
        </motion.div>

        {/* Close button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm 
          flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Đóng"
        >
          {/* <span className="text-white text-2xl items-center">×</span> */}
          <X />
        </motion.button>

        {/* Hint text */}
        <p className="absolute bottom-12 text-white/60 text-sm">
          {voiceState.isRecording ? "Nhấn để dừng" : "Nhấn vào để bắt đầu"}
        </p>
      </div>
    </motion.div>
  );
}

export default SiriVoiceInterface;

import type { VoiceState, LanguageCode } from "@/types/voiceState.type";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, X, Globe, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type SiriVoiceInterfaceProps = {
  voiceState: VoiceState;
  onClose: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
};

function SiriVoiceInterface({
  voiceState,
  onClose,
  onStopRecording,
  language,
  onLanguageChange,
}: SiriVoiceInterfaceProps) {
  const [wavePhase, setWavePhase] = useState(0);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const languages: { code: LanguageCode; label: string; flag: string }[] = [
    { code: "auto", label: "Tự động", flag: "🌐" },
    { code: "vi-VN", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en-US", label: "English", flag: "🇺🇸" },
  ];

  const currentLanguage = languages.find((l) => l.code === language) || languages[0];

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageMenu]);

  useEffect(() => {
    if (!voiceState.isRecording) {
      setWavePhase(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Sử dụng requestAnimationFrame để animation mượt mà hơn
    const animate = () => {
      setWavePhase((prev) => prev + 0.15); // Tăng tốc độ để mượt hơn
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [voiceState.isRecording]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/90 via-gray-900/95 to-black/90 backdrop-blur-2xl"
      onClick={voiceState.isRecording ? onStopRecording : onClose}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Siri Orb Animation */}

        <div className="relative flex items-center justify-center">
          {/* Outer glow rings - giống Siri iPhone */}
          {voiceState.isRecording && (
            <>
              {/* Ring 1 - Inmost */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-r from-cyan-400/40 via-blue-400/40 to-cyan-400/40"
                animate={{
                  scale: 1 + (voiceState.audioLevel / 100) * 0.4,
                  opacity: 0.4 - (voiceState.audioLevel / 100) * 0.2,
                }}
                transition={{
                  duration: 0.08,
                  ease: "easeOut",
                }}
                style={{
                  width: "180px",
                  height: "180px",
                }}
              />
              {/* Ring 2 */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-blue-400/30"
                animate={{
                  scale: 1 + (voiceState.audioLevel / 100) * 0.6,
                  opacity: 0.3 - (voiceState.audioLevel / 100) * 0.15,
                }}
                transition={{
                  duration: 0.08,
                  ease: "easeOut",
                }}
                style={{
                  width: "220px",
                  height: "220px",
                }}
              />
              {/* Ring 3 - Outmost */}
              <motion.div
                className="absolute rounded-full bg-gradient-to-r from-cyan-300/20 via-blue-300/20 to-cyan-300/20"
                animate={{
                  scale: 1 + (voiceState.audioLevel / 100) * 0.8,
                  opacity: 0.2 - (voiceState.audioLevel / 100) * 0.1,
                }}
                transition={{
                  duration: 0.08,
                  ease: "easeOut",
                }}
                style={{
                  width: "280px",
                  height: "280px",
                }}
              />
            </>
          )}

          {/* Main orb - giống Siri iPhone */}
          <motion.div
            className="relative w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-500 shadow-2xl flex items-center justify-center overflow-hidden"
            animate={
              voiceState.isRecording
                ? {
                    scale: 1 + (voiceState.audioLevel / 100) * 0.15,
                    boxShadow: `0 0 ${60 + voiceState.audioLevel * 0.8}px rgba(59, 130, 246, ${0.5 + voiceState.audioLevel / 250}), 0 0 ${80 + voiceState.audioLevel * 1}px rgba(34, 211, 238, ${0.4 + voiceState.audioLevel / 300})`,
                  }
                : {
                    scale: 1,
                    boxShadow: "0 0 60px rgba(59, 130, 246, 0.5)",
                  }
            }
            transition={{
              duration: 0.08,
              ease: "easeOut",
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            {/* Waveform bars inside orb - animation sóng mượt mà */}
            {voiceState.isRecording && (
              <div className="flex items-center justify-center gap-1.5">
                {[...Array(12)].map((_, i) => {
                  // Tính toán chiều cao dựa trên audioLevel với wave animation mượt mà
                  // Sử dụng nhiều tần số để tạo sóng phức tạp hơn
                  const phase1 = wavePhase + (i * Math.PI) / 6; // Wave chính
                  const phase2 = wavePhase * 1.3 + (i * Math.PI) / 4; // Wave phụ (tần số khác)
                  const phase3 = wavePhase * 0.7 + (i * Math.PI) / 8; // Wave phụ 2
                  
                  // Kết hợp nhiều sóng để tạo hiệu ứng mượt mà hơn
                  const wave1 = Math.sin(phase1) * 0.35;
                  const wave2 = Math.sin(phase2) * 0.2;
                  const wave3 = Math.sin(phase3) * 0.15;
                  const combinedWave = wave1 + wave2 + wave3;
                  
                  // Base height từ audio level (tăng sensitivity và responsiveness)
                  // Minimum height 10px, maximum 52px based on audioLevel (0-100)
                  // Ensure there's always some visible animation
                  const audioLevel = Math.max(voiceState.audioLevel || 15, 15); // Minimum 15 for visible animation
                  const baseHeight = 10 + (audioLevel / 100) * 42;
                  
                  // Thêm variation từ wave và audio level
                  // Height variation should be more pronounced with higher audio levels
                  const heightVariation = combinedWave * Math.max(baseHeight * 0.5, 10);
                  const height = Math.max(10, Math.min(52, baseHeight + heightVariation));
                  
                  // Opacity cũng thay đổi theo wave để tạo hiệu ứng mượt mà
                  const opacityWave = (Math.sin(phase1) + 1) / 2; // 0-1
                  const baseOpacity = 0.8 + (audioLevel / 100) * 0.15;
                  const opacity = Math.max(0.7, Math.min(1, baseOpacity + opacityWave * 0.15));
                  
                  return (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-white rounded-full shadow-lg"
                      animate={{
                        height: height,
                        opacity: opacity,
                      }}
                      transition={{
                        duration: 0.1,
                        ease: "easeOut",
                      }}
                      style={{
                        minHeight: "10px",
                        maxHeight: "52px",
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Mic icon when not recording */}
            {!voiceState.isRecording && !voiceState.isPlaying && (
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mic className="w-14 h-14 text-white drop-shadow-lg" />
              </motion.div>
            )}

            {/* Volume icon when playing */}
            {voiceState.isPlaying && (
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Volume2 className="w-14 h-14 text-white drop-shadow-lg" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Status text - giống Siri iPhone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.p
            className="text-white text-3xl font-semibold mb-3 tracking-tight"
            animate={
              voiceState.isRecording
                ? {
                    opacity: [0.8, 1, 0.8],
                  }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: voiceState.isRecording ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            {voiceState.isRecording && "Đang lắng nghe..."}
            {voiceState.isPlaying && "Đang trả lời..."}
            {!voiceState.isRecording && !voiceState.isPlaying && "Nhấn để nói"}
          </motion.p>

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

        {/* Language selector */}
        <div className="absolute top-8 left-8" ref={languageMenuRef}>
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowLanguageMenu(!showLanguageMenu);
              }}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md 
              hover:bg-white/25 border border-white/20 hover:border-white/30 transition-all text-white text-sm font-semibold shadow-lg"
              aria-label="Chọn ngôn ngữ"
            >
              <Globe className="w-4 h-4" />
              <span className="text-lg">{currentLanguage.flag}</span>
              <span>{currentLanguage.label}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  showLanguageMenu ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-3 bg-white/15 backdrop-blur-xl rounded-xl 
                  overflow-hidden border border-white/30 shadow-2xl min-w-[200px] z-50"
                >
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLanguageChange(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      className={`w-full px-5 py-3 text-left text-white text-sm hover:bg-white/20 
                      transition-all flex items-center gap-3 ${
                        language === lang.code ? "bg-white/20 font-semibold" : "font-medium"
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="flex-1">{lang.label}</span>
                      {language === lang.code && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-blue-300 text-base"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Close button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-8 right-8 w-11 h-11 rounded-full bg-white/15 backdrop-blur-md 
          flex items-center justify-center hover:bg-white/25 border border-white/20 hover:border-white/30 transition-all shadow-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5 text-white" />
        </motion.button>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-12 text-white/70 text-sm font-medium backdrop-blur-sm bg-black/10 px-4 py-2 rounded-full border border-white/10"
        >
          {voiceState.isRecording ? "Nhấn để dừng" : "Nhấn vào để bắt đầu"}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default SiriVoiceInterface;

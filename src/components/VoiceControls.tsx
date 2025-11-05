import { motion } from "framer-motion";
import { Mic } from "lucide-react";

type VoiceControlsProps = {
  onOpenVoice: () => void;
};

function VoiceControls({ onOpenVoice }: VoiceControlsProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onOpenVoice}
      className="p-3 rounded-full bg-linear-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 
      hover:to-pink-600 transition-colors shadow-lg 
      "
      aria-label="Mở voice chat"
    >
      <Mic className="w-5 h-5" />
    </motion.button>
  );
}
export default VoiceControls;

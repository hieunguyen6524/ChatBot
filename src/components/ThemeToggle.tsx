import type { Theme } from "@/types/theme.type";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

// type Theme = "light" | "dark";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label="Chuyển đổi theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </motion.button>
  );
}

export default ThemeToggle;

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import MessageList from "@/components/MessageList";
import ThemeToggle from "@/components/ThemeToggle";
import Composer from "@/components/Composer";
import SiriVoiceInterface from "@/components/SiriVoiceInterface";
import { useTheme } from "@/hooks/useTheme";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import CustomAvatar from "@/components/CustomAvatar";

function ChatPage() {
  const [theme, toggleTheme] = useTheme();
  const { messages, sendMessage, sendMessageWithFiles } = useChat();
  const { voiceState, startRecording, stopRecording, speak, stopSpeaking, setLanguage, language } =
    useVoice();
  const [showSiriInterface, setShowSiriInterface] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  const handleOpenVoice = useCallback(() => {
    setShowSiriInterface(true);
    startRecording();
  }, [startRecording]);

  const handleCloseVoice = useCallback(() => {
    stopRecording();
    stopSpeaking();

    // Không gửi ngay, mà hiển thị transcript trong input để chỉnh sửa
    if (voiceState.transcript && voiceState.transcript.trim()) {
      setVoiceTranscript(voiceState.transcript.trim());
    }

    setShowSiriInterface(false);
  }, [stopRecording, stopSpeaking, voiceState.transcript]);

  const handleStopRecording = useCallback(() => {
    stopRecording();

    // Không gửi ngay, mà hiển thị transcript trong input để chỉnh sửa
    setTimeout(() => {
      if (voiceState.transcript && voiceState.transcript.trim()) {
        setVoiceTranscript(voiceState.transcript.trim());
      }
      setShowSiriInterface(false);
    }, 300);
  }, [stopRecording, voiceState.transcript]);

  const handleVoiceTranscriptProcessed = useCallback(() => {
    // Clear transcript sau khi đã xử lý
    setVoiceTranscript("");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200/80 dark:border-gray-800/80 px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <CustomAvatar role="assistant" size="lg" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
          </div>
          <div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              ChatBot AI
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Trợ lý thông minh
            </p>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <MessageList messages={messages} onSpeak={speak} />

      <Composer
        onSend={sendMessage}
        onSendMessageWithFiles={sendMessageWithFiles}
        onOpenVoice={handleOpenVoice}
        voiceTranscript={voiceTranscript}
        onVoiceTranscriptProcessed={handleVoiceTranscriptProcessed}
      />

        <AnimatePresence>
          {showSiriInterface && (
            <SiriVoiceInterface
              voiceState={voiceState}
              onClose={handleCloseVoice}
              onStopRecording={handleStopRecording}
              onStopSpeaking={stopSpeaking}
              language={language}
              onLanguageChange={setLanguage}
            />
          )}
        </AnimatePresence>
    </div>
  );
}

export default ChatPage;

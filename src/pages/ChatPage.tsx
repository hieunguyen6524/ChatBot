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
  const { messages, sendMessage, sendFile } = useChat();
  const { voiceState, startRecording, stopRecording, speak, stopSpeaking } =
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            AI
          </div> */}
          <CustomAvatar role="assistant" size="lg" />
          <div>
            <h1 className="font-semibold text-lg">ChatBot AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trợ lý thông minh
            </p>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <MessageList messages={messages} onSpeak={speak} />

      <Composer 
        onSend={sendMessage} 
        onSendFile={sendFile} 
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatPage;

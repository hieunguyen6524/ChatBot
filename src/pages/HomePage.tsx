import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChatBubble } from "@/components/ChatBubble";

const HomePage: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Your homepage content here */}
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Welcome to ChatBot AI
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300">
          Your intelligent assistant
        </p>
      </div>

      {/* Messenger-style Chat Bubble */}
      <ChatBubble
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        onMaximize={() => navigate("/chat")}
      />
    </div>
  );
};

export default HomePage;

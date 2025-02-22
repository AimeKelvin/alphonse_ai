"use client";

import React, { useRef, useState } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AlphonseResponse {
  question: string;
  answer: string;
  from_cache: boolean;
  web_data: string;
  error?: string;
}

type ChatPosition = "bottom-right" | "bottom-left";
type ChatSize = "sm" | "md" | "lg" | "xl" | "full";

const chatConfig = {
  dimensions: {
    sm: "max-w-sm max-h-[500px]",
    md: "max-w-md max-h-[600px]",
    lg: "max-w-lg max-h-[700px]",
    xl: "max-w-xl max-h-[800px]",
    full: "w-full h-full",
  },
  positions: {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  },
};

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const askAlphonse = async (question: string) => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }

      const data: AlphonseResponse = await res.json();
      return data.answer;
    } catch (error) {
      console.error("Error asking Alphonse:", error);
      return "Something went wrong with Alphonse!";
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const alphonseResponse = await askAlphonse(input);
    setMessages((prev) => [...prev, { text: alphonseResponse, isUser: false }]);
    
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={cn("fixed z-50", chatConfig.positions["bottom-right"])}>
        {/* Chat Container */}
        <div
          ref={chatRef}
          className={cn(
            "transition-all duration-300 ease-in-out",
            "bg-white rounded-xl shadow-2xl border border-gray-200",
            chatConfig.dimensions["lg"],
            "w-[95vw] h-[85vh] md:w-[480px] md:h-[600px]",
            isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none translate-y-4",
            "flex flex-col"
          )}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Ask Alphonse</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Start chatting with Alphonse!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg max-w-[80%]",
                      msg.isUser
                        ? "ml-auto bg-blue-500 text-white"
                        : "mr-auto bg-white border border-gray-200"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div className="mr-auto p-3 text-gray-500">
                    <span className="animate-pulse">Alphonse is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you want to know?"
                className="flex-1 border-gray-300 focus:ring-blue-500"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Toggle Button */}
        <Button
          onClick={toggleChat}
          className={cn(
            "w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700",
            "shadow-lg hover:shadow-xl transition-all duration-300",
            "flex items-center justify-center",
            isOpen && "rotate-90"
          )}
        >
          {isOpen ? (
            <X className="h-7 w-7 text-white" />
          ) : (
            <MessageCircle className="h-7 w-7 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
}
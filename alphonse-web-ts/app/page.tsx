'use client';

import { useState } from 'react';

interface AlphonseResponse {
  question: string;
  answer: string;
  from_cache: boolean;
  web_data: string;
  error?: string;
}

export default function Home() {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<AlphonseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const askAlphonse = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data: AlphonseResponse = await res.json();
      setResponse(data);
      if (!data.error && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.answer);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setResponse({ question, answer: '', from_cache: false, web_data: '', error: 'Something went wrong with Alphonse!' });
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') askAlphonse();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Ask Alphonse</h1>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What do you want to know?"
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={askAlphonse}
            disabled={loading}
            className={`px-4 py-2 text-white rounded ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>

        {response && (
          <div className="text-gray-700">
            <p className="mb-2"><strong>You:</strong> {response.question}</p>
            <p className="mb-2"><strong>Alphonse:</strong> {response.web_data}</p>
            <p className="text-sm text-gray-500 italic">
              Debug: {response.from_cache ? 'Cached' : 'Fetched'} - {response.web_data}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
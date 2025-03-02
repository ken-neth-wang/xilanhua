"use client"

import { useState } from 'react';
import { WordItem } from '@/types';

interface PronunciationPracticeProps {
  wordBanks: {
    beginner: WordItem[];
    intermediate: WordItem[];
  };
}

export function PronunciationPractice({ wordBanks }: PronunciationPracticeProps) {
  const [activeWord, setActiveWord] = useState<WordItem | null>(null);
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [recording, setRecording] = useState(false);
  const [audioResult, setAudioResult] = useState<{
    success: boolean;
    transcription: string;
    target: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePractice = (word: WordItem) => {
    setActiveWord(word);
    setAudioResult(null);
  };

  const startRecording = () => {
    setRecording(true);
    setAudioResult(null);
    
    // Simulating recording and processing
    // In a real app, connect to your API
    setTimeout(() => {
      setRecording(false);
      setLoading(true);
      
      setTimeout(() => {
        setLoading(false);
        // Simulate response (in production, fetch from backend)
        const matched = Math.random() > 0.5;
        setAudioResult({
          success: matched,
          transcription: matched ? activeWord!.word : "你的",
          target: activeWord!.word
        });
      }, 1500);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Practice Pronunciation</h2>
      <div className="grid grid-cols-2 gap-4">
        {wordBanks[currentLevel as keyof typeof wordBanks]?.map((item, index) => (
          <div 
            key={index} 
            className={`bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors
              ${activeWord && activeWord.word === item.word ? 'border-2 border-emerald-800' : ''}`}
            onClick={() => handlePractice(item)}
          >
            <div className="text-2xl mb-1">{item.word}</div>
            <div className="text-gray-600">{item.meaning}</div>
          </div>
        ))}
      </div>
      
      {activeWord && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl mb-2 font-medium">{activeWord.word}</h3>
          <p className="text-gray-600 mb-4">Meaning: {activeWord.meaning}</p>
          
          {!recording && !loading && !audioResult && (
            <button 
              className="bg-emerald-800 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-900 transition-colors"
              onClick={startRecording}
            >
              Start Recording
            </button>
          )}
          
          {recording && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full mx-auto animate-pulse mb-2"></div>
              <p>Recording... Speak now</p>
            </div>
          )}
          
          {loading && (
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2">Processing audio...</p>
            </div>
          )}
          
          {audioResult && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Results:</h4>
              <div className="flex flex-col space-y-2">
                <div>Target: <span className="font-medium">{audioResult.target}</span></div>
                <div>You said: <span className="font-medium">{audioResult.transcription}</span></div>
                
                {audioResult.success ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-2">
                    <span className="font-medium">Perfect pronunciation!</span>
                  </div>
                ) : (
                  <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mt-2">
                    <span className="font-medium">Try again!</span>
                  </div>
                )}
                
                <button 
                  className="bg-emerald-800 text-white px-6 py-3 rounded-md font-medium mt-4 hover:bg-emerald-900 transition-colors"
                  onClick={startRecording}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <div className="text-sm text-gray-600 mb-2">Difficulty Level:</div>
        <select 
          className="border border-gray-300 p-2 rounded-md w-full"
          value={currentLevel}
          onChange={(e) => setCurrentLevel(e.target.value)}
        >
          <option value="beginner">Beginner Words</option>
          <option value="intermediate">Intermediate Words</option>
        </select>
      </div>
    </div>
  );
}
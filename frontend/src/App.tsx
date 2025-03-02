"use client"

import { useState, useEffect } from 'react';
import { PronunciationPractice } from '@/components/pronunciation-practice';
import { WordBankManager } from '@/components/word-bank-manager';
import { HomePage } from '@/components/home-page';
import { WordBanks } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function App() {
  const [wordBanks, setWordBanks] = useState<WordBanks>({
    beginner: [],
    intermediate: []
  });
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWordBanks();
  }, []);

  const loadWordBanks = async () => {
    try {
      const response = await fetch('/api/words');
      const data = await response.json();
      setWordBanks(data);
    } catch (error) {
      console.error("Error loading word banks:", error);
      // Fallback to default words if API fails
      setWordBanks({
        beginner: [
          { word: "你好", meaning: "hello" },
          { word: "谢谢", meaning: "thank you" },
          { word: "再见", meaning: "goodbye" },
          { word: "早上好", meaning: "good morning" },
        ],
        intermediate: [
          { word: "经济", meaning: "economy" },
          { word: "环境", meaning: "environment" },
          { word: "文化", meaning: "culture" },
          { word: "科技", meaning: "technology" },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWordBanks = async (newBanks: WordBanks) => {
    try {
      // In a real app, POST to your API
      await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBanks),
      });
      setWordBanks(newBanks);
    } catch (error) {
      console.error("Error saving word banks:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage wordBanks={wordBanks} onStartPractice={() => setActiveTab('practice')} />;
      case 'practice':
        return <PronunciationPractice wordBanks={wordBanks} />;
      case 'manage':
        return <WordBankManager wordBanks={wordBanks} onSave={handleSaveWordBanks} />;
      default:
        return <HomePage wordBanks={wordBanks} onStartPractice={() => setActiveTab('practice')} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen font-['Inter',sans-serif]">
      <div className="p-4 pb-20">
        {activeTab !== 'practice' && activeTab !== 'manage' && (
          <header className="mb-6">
            <h1 className="text-2xl font-bold">Xilanhua</h1>
            <p className="text-sm text-gray-600">
              Chinese Pronunciation Practice
            </p>
          </header>
        )}

        {(activeTab === 'practice' || activeTab === 'manage') && (
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="practice" className="flex-1">
                  Practice Pronunciation
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex-1">
                  Manage Words
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-3">
        <button 
          className={`flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-800' : 'text-gray-400'}`}
          onClick={() => setActiveTab('home')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center ${activeTab === 'practice' ? 'text-emerald-800' : 'text-gray-400'}`}
          onClick={() => setActiveTab('practice')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-xs mt-1">Practice</span>
        </button>
        <button 
          className={`flex flex-col items-center ${activeTab === 'manage' ? 'text-emerald-800' : 'text-gray-400'}`}
          onClick={() => setActiveTab('manage')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-xs mt-1">Manage</span>
        </button>
      </div>
    </div>
  );
}
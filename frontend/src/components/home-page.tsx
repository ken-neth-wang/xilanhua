"use client"

import { WordBanks } from '@/types';

interface HomePageProps {
  wordBanks: WordBanks;
  onStartPractice: () => void;
}

export function HomePage({ wordBanks, onStartPractice }: HomePageProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-emerald-800 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Welcome to Xilanhua</h2>
          <p className="opacity-90">Your Chinese pronunciation coach</p>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">Choose words, practice pronunciation, and get instant feedback.</p>
          <button
            className="bg-emerald-800 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-900 transition-colors"
            onClick={onStartPractice}
          >
            Start Practicing
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-emerald-800 mb-1">
              {wordBanks.beginner.length + wordBanks.intermediate.length}
            </div>
            <div className="text-gray-600">Total Words</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-emerald-800 mb-1">
              2
            </div>
            <div className="text-gray-600">Difficulty Levels</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">How to Use</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Select a word from the practice section</li>
          <li>Listen to the correct pronunciation</li>
          <li>Record yourself saying the word</li>
          <li>Get instant feedback on your pronunciation</li>
          <li>Add your own words to practice in the Manage Words section</li>
        </ol>
      </div>
    </div>
  );
}
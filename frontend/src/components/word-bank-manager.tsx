"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WordBanks, WordData } from '@/types';

interface WordBankManagerProps {
  wordBanks: WordBanks;
  onSave: (banks: WordBanks) => void;
}

export function WordBankManager({ wordBanks, onSave }: WordBankManagerProps) {
  const [editBanks, setEditBanks] = useState<WordBanks>({...wordBanks});
  const [newWord, setNewWord] = useState<WordData>({ word: "", meaning: "" });
  const [currentLevelTab, setCurrentLevelTab] = useState<"beginner" | "intermediate">("beginner");
  
  const handleRemoveWord = (level: "beginner" | "intermediate", index: number) => {
    const updatedBanks = {...editBanks};
    updatedBanks[level] = [...updatedBanks[level]];
    updatedBanks[level].splice(index, 1);
    setEditBanks(updatedBanks);
    onSave(updatedBanks); // Auto-save when removing a word
  };
  
  const handleAddWord = () => {
    if (newWord.word && newWord.meaning) {
      const updatedBanks = {...editBanks};
      updatedBanks[currentLevelTab] = [...updatedBanks[currentLevelTab], {...newWord}];
      setEditBanks(updatedBanks);
      setNewWord({ word: "", meaning: "" });
      onSave(updatedBanks); // Auto-save when adding a word
    }
  };

  const autoPopulateWordBank = () => {
    const beginnerWords: WordData[] = [
      { word: "你好", meaning: "hello" },
      { word: "谢谢", meaning: "thank you" },
      { word: "再见", meaning: "goodbye" },
      { word: "是", meaning: "yes/to be" },
      { word: "不", meaning: "no/not" },
    ];
    
    const intermediateWords: WordData[] = [
      { word: "工作", meaning: "work/job" },
      { word: "学习", meaning: "study" },
      { word: "朋友", meaning: "friend" },
      { word: "时间", meaning: "time" },
      { word: "问题", meaning: "problem/question" },
    ];
    
    const wordsToAdd = currentLevelTab === "beginner" ? beginnerWords : intermediateWords;
    
    const updatedBanks = {...editBanks};
    updatedBanks[currentLevelTab] = [...updatedBanks[currentLevelTab], ...wordsToAdd];
    setEditBanks(updatedBanks);
    onSave(updatedBanks);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Manage Word Banks</h2>
      
      <Tabs value={currentLevelTab} onValueChange={(value) => setCurrentLevelTab(value as "beginner" | "intermediate")}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="beginner" className="flex-1">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate" className="flex-1">Intermediate</TabsTrigger>
        </TabsList>
        
        {(["beginner", "intermediate"] as const).map(level => (
          <TabsContent key={level} value={level}>
            <div className="space-y-3">

            <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">{level.charAt(0).toUpperCase() + level.slice(1)} Words</h3>
                <button 
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  onClick={autoPopulateWordBank}
                >
                  Auto-Populate
                </button>
              </div>
              
              {editBanks[level].map((item, index) => (
                <div key={index} className="flex items-center border border-gray-200 p-3 rounded-md">
                  <div className="flex-1">
                    <div className="font-medium">{item.word}</div>
                    <div className="text-gray-600 text-sm">{item.meaning}</div>
                  </div>
                  <button 
                    className="text-red-500 px-3 py-1 hover:bg-red-50 rounded-md"
                    onClick={() => handleRemoveWord(level, index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <div className="pt-4 bg-gray-50 p-4 rounded-md mt-4">
                <h3 className="font-medium mb-3">Add New Word</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Chinese Word</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newWord.word}
                      onChange={(e) => setNewWord({...newWord, word: e.target.value})}
                      placeholder="e.g. 你好"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">English Meaning</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={newWord.meaning}
                      onChange={(e) => setNewWord({...newWord, meaning: e.target.value})}
                      placeholder="e.g. hello"
                    />
                  </div>
                  <button
                    className="bg-emerald-800 text-white px-4 py-2 rounded-md hover:bg-emerald-900 transition-colors w-full"
                    onClick={handleAddWord}
                  >
                    Add Word
                  </button>
                </div>
              </div>
         
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
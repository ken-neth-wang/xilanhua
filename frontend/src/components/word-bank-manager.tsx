"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WordBanks, WordItem } from '@/types';

interface WordBankManagerProps {
  wordBanks: WordBanks;
  onSave: (banks: WordBanks) => void;
}

export function WordBankManager({ wordBanks, onSave }: WordBankManagerProps) {
  const [editBanks, setEditBanks] = useState<WordBanks>({...wordBanks});
  const [newWord, setNewWord] = useState<WordItem>({ word: "", meaning: "" });
  const [currentLevelTab, setCurrentLevelTab] = useState<"beginner" | "intermediate">("beginner");
  
  const handleSave = () => {
    onSave(editBanks);
  };
  
  const handleRemoveWord = (level: "beginner" | "intermediate", index: number) => {
    const updatedBanks = {...editBanks};
    updatedBanks[level] = [...updatedBanks[level]];
    updatedBanks[level].splice(index, 1);
    setEditBanks(updatedBanks);
  };
  
  const handleAddWord = () => {
    if (newWord.word && newWord.meaning) {
      const updatedBanks = {...editBanks};
      updatedBanks[currentLevelTab] = [...updatedBanks[currentLevelTab], {...newWord}];
      setEditBanks(updatedBanks);
      setNewWord({ word: "", meaning: "" });
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Manage Word Banks</h2>
      
      <Tabs value={currentLevelTab} onValueChange={(value: "beginner" | "intermediate") => setCurrentLevelTab(value)}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="beginner" className="flex-1">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate" className="flex-1">Intermediate</TabsTrigger>
        </TabsList>
        
        {(["beginner", "intermediate"] as const).map(level => (
          <TabsContent key={level} value={level}>
            <div className="space-y-3">
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
              
              <div className="mt-6">
                <button
                  className="bg-emerald-800 text-white px-6 py-3 rounded-md hover:bg-emerald-900 transition-colors w-full"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
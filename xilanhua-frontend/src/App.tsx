import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

const App = () => {
  const [wordBanks, setWordBanks] = useState({
    beginner: [
      { word: "你好", meaning: "hello" },
      { word: "谢谢", meaning: "thank you" },
      { word: "再见", meaning: "goodbye" },
      { word: "早上好", meaning: "good morning" },
      { word: "朋友", meaning: "friend" },
      { word: "学习", meaning: "study" },
      { word: "喜欢", meaning: "like" },
      { word: "吃饭", meaning: "eat" }
    ],
    intermediate: [
      { word: "经济", meaning: "economy" },
      { word: "环境", meaning: "environment" },
      { word: "文化", meaning: "culture" },
      { word: "科技", meaning: "technology" },
      { word: "教育", meaning: "education" },
      { word: "社会", meaning: "society" },
      { word: "政府", meaning: "government" },
      { word: "工作", meaning: "work" }
    ]
  });
  const [activeWord, setActiveWord] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [recording, setRecording] = useState(false);
  const [audioResult, setAudioResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load word banks from API
  useEffect(() => {
    const fetchWordBanks = async () => {
      try {
        const response = await fetch('/api/words');
        const data = await response.json();
        setWordBanks(data);
      } catch (error) {
        console.error("Error loading word banks:", error);
      }
    };

    fetchWordBanks();
  }, []);

  const handlePractice = (word) => {
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
          transcription: matched ? activeWord.word : "你的",
          target: activeWord.word
        });
      }, 1500);
    }, 3000);
  };

  const saveWordBanks = async (updatedWordBanks) => {
    try {
      // In a real app, POST to your API
      console.log("Saving word banks:", updatedWordBanks);
      setWordBanks(updatedWordBanks);
    } catch (error) {
      console.error("Error saving word banks:", error);
    }
  };

  const PronunciationPractice = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Practice Pronunciation</h2>
      <div className="grid grid-cols-2 gap-4">
        {wordBanks[currentLevel].map((item, index) => (
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

  const WordBankManager = () => {
    const [editBanks, setEditBanks] = useState({...wordBanks});
    const [newWord, setNewWord] = useState({ word: "", meaning: "" });
    const [currentLevelTab, setCurrentLevelTab] = useState("beginner");
    
    const handleSave = () => {
      saveWordBanks(editBanks);
    };
    
    const handleRemoveWord = (level, index) => {
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
        
        <Tabs value={currentLevelTab} onValueChange={setCurrentLevelTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="beginner" className="flex-1">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate" className="flex-1">Intermediate</TabsTrigger>
          </TabsList>
          
          {["beginner", "intermediate"].map(level => (
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
  };

  const HomePage = () => (
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
            onClick={() => setActiveTab('practice')}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'practice':
        return <PronunciationPractice />;
      case 'manage':
        return <WordBankManager />;
      default:
        return <HomePage />;
    }
  };

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
};

export default App;
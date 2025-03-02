"use client"

import { useState } from 'react';
import { WordData } from '@/types';

interface PronunciationPracticeProps {
  wordBanks: {
    beginner: WordData[];
    intermediate: WordData[];
  };
}
export function PronunciationPractice({ wordBanks }: PronunciationPracticeProps) {
  const [activeWord, setActiveWord] = useState<WordData | null>(null);
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [recording, setRecording] = useState(false);
  const [audioResult, setAudioResult] = useState<{
    success: boolean;
    transcription: string;
    target: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [practiceMode, setPracticeMode] = useState<"single" | "all">("single");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const handlePractice = (word: WordData) => {
    setPracticeMode("single");
    setActiveWord(word);
    setAudioResult(null);
  };


  const startPracticeAll = () => {
    setPracticeMode("all");
    setCurrentWordIndex(0);
    const firstWord = wordBanks[currentLevel as keyof typeof wordBanks][0];
    setActiveWord(firstWord);
    setAudioResult(null);
    
    // Automatically start recording after a short delay
    setTimeout(() => {
      startRecording();
    }, 1000); // 1 second delay to give user time to prepare
  };

  const moveToNextWord = () => {
    if (practiceMode === "all") {
      const currentWords = wordBanks[currentLevel as keyof typeof wordBanks];
      const nextIndex = currentWordIndex + 1;
      
      if (nextIndex < currentWords.length) {
        setCurrentWordIndex(nextIndex);
        setActiveWord(currentWords[nextIndex]);
        setAudioResult(null);
        
        // Automatically start recording for the next word after a short delay
        setTimeout(() => {
          startRecording();
        }, 1000); // 1 second delay to give user time to prepare
      } else {
        // End of practice session
        setPracticeMode("single");
        setActiveWord(null);
        alert("Congratulations! You've completed practicing all words in this level.");
      }
    }
  };

  const startRecording = async () => {
    try {
      setRecording(true);
      setAudioResult(null);
      setAudioChunks([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      // Create a new array to collect chunks for this recording session
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        setLoading(true);
        // Use the local chunks array instead of the state variable
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        
        // Check if the blob has content
        if (audioBlob.size > 0) {
          await sendAudioToBackend(audioBlob);
        } else {
          console.error("Empty audio blob created");
          setLoading(false);
          alert("No audio was recorded. Please try again.");
        }
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      
      // Stop recording after 3 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          stream.getTracks().forEach(track => track.stop());
          setRecording(false);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setRecording(false);
      alert("Could not access microphone. Please check permissions.");
    }
  };
  const sendAudioToBackend = async (audioBlob: Blob) => {
    try {
      // Debug log to check blob size
      console.log(`Sending audio blob of size: ${audioBlob.size} bytes`);
      
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received response from server:", data);
      
      // Check if data has the expected structure
      if (!data.hasOwnProperty('transcription')) {
        console.error("Response missing transcription field:", data);
        throw new Error("Invalid response format from server");
      }
      
      // Compare transcription with target word
      const transcription = data.transcription;
      const success = transcription.toLowerCase() === activeWord!.word.toLowerCase();
      console.log("hi there")

      setAudioResult({
        success,
        transcription,
        target: activeWord!.word
      });
      console.log("hi there2")

    } catch (error) {
      console.error("Error sending audio to backend:", error);
      alert("Failed to process audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Practice Pronunciation</h2>
      
      {!activeWord && (
        <div className="mb-6">
          <button 
            className="bg-emerald-800 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-900 transition-colors w-full"
            onClick={startPracticeAll}
          >
            Practice All Words
          </button>
        </div>
      )}
      
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
          
          {practiceMode === "all" && (
            <div className="mb-4 text-sm text-gray-600">
              Word {currentWordIndex + 1} of {wordBanks[currentLevel as keyof typeof wordBanks].length}
            </div>
          )}
          
          {!recording && !loading && !audioResult && practiceMode === "single" && (
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
                
                <div className="flex space-x-4 mt-4">
                <button 
                  className="bg-emerald-800 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-900 transition-colors"
                  onClick={startRecording}
                >
                  Try Again
                </button>
                
                {practiceMode === "all" && (
                  <button 
                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    onClick={moveToNextWord}
                  >
                    Next Word
                  </button>
                )}
              </div>
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
          onChange={(e) => {
            setCurrentLevel(e.target.value);
            setActiveWord(null);
            setPracticeMode("single");
          }}
        >
          <option value="beginner">Beginner Words</option>
          <option value="intermediate">Intermediate Words</option>
        </select>
      </div>
    </div>
  );
}
import axios from 'axios';
import { WordBanks, WordData } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; 

export const api = {
  loadWordBanks: async (): Promise<WordBanks> => {
    const response = await axios.get(`${API_BASE_URL}/words`);
    return response.data;
  },

  saveWordBanks: async (wordBanks: WordBanks): Promise<WordBanks> => {
    const response = await axios.post(`${API_BASE_URL}/words`, wordBanks);
    return response.data;
  },

  recordPronunciation: async (audioBlob: Blob): Promise<{
    transcription: string;
    raw_transcription: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      throw error;
    }
  },

  importAnkiDeck: async (ankiFile: File): Promise<{
    message: string;
    word_banks: WordBanks;
  }> => {
    const formData = new FormData();
    formData.append('anki_file', ankiFile);
    
    const response = await axios.post(`${API_BASE_URL}/import-anki`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  checkAnkiStatus: async (): Promise<{
    has_extracted_db: boolean;
    extract_dir_exists: boolean;
    pending_files: string[];
  }> => {
    const response = await axios.get(`${API_BASE_URL}/check-anki-status`);
    return response.data;
  },
  extractAnkiDeck: async (filename: string): Promise<{
    message: string;
    status: boolean;
  }> => {
    const response = await axios.post(`${API_BASE_URL}/extract-anki?filename=${encodeURIComponent(filename)}`);
    return response.data;
  },
  
  extractPdfVocab: async (pdfFile: File): Promise<{
    message: string;
    word_banks: WordBanks;
    new_words: {
      beginner: WordData[];
      intermediate: WordData[];
    };
    extracted_text_length: number;
  }> => {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    
    const response = await axios.post(`${API_BASE_URL}/extract-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  extractVocabFromText: async (text: string): Promise<{
    message: string;
    success: boolean;
    word_banks?: WordBanks;
    new_words?: {
      beginner: WordData[];
      intermediate: WordData[];
    };
  }> => {
    const response = await axios.post(`${API_BASE_URL}/extract-text`, { text });
    return response.data;
  },
  removeWord: async (level: string, word: string): Promise<{
    message: string;
    word_banks: WordBanks;
  }> => {
    const response = await axios.delete(`${API_BASE_URL}/words/${level}/${encodeURIComponent(word)}`);
    return response.data;
  },
};
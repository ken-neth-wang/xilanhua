import axios from 'axios';
import { WordBanks, WordData } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Note: FastAPI typically runs on 8000

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
  }
};
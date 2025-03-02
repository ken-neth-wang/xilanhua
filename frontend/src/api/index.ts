import axios from 'axios';
import { WordBanks, WordData } from '../types';

// You'll need to adjust the base URL to match your backend
const API_BASE_URL = 'http://localhost:3000';

export const api = {
  loadWordBanks: async (): Promise<WordBanks> => {
    const response = await axios.get(`${API_BASE_URL}/word-banks`);
    return response.data;
  },

  saveWordBanks: async (wordBanks: WordBanks): Promise<void> => {
    await axios.post(`${API_BASE_URL}/word-banks`, wordBanks);
  },

  recordPronunciation: async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const response = await axios.post(`${API_BASE_URL}/transcribe`, formData);
    return response.data.transcription;
  }
};
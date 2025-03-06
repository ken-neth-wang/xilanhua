export interface WordData {
  word: string;
  meaning: string;
}

export interface WordBanks {
  beginner: WordData[];
  intermediate: WordData[];
}

export interface TranscriptionResult {
  transcription: string;
  raw_transcription: string;
}

export interface AudioResult {
  success: boolean;
  transcription: string;
  target: string;
}

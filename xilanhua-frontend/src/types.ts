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

export interface WordItem {
  word: string;
  meaning: string;
}

export interface WordBanks {
  beginner: WordItem[];
  intermediate: WordItem[];
}

export interface AudioResult {
  success: boolean;
  transcription: string;
  target: string;
}

export interface AnkiStatus {
  has_extracted_db: boolean;
  extract_dir_exists: boolean;
  pending_files: string[];
}

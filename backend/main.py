from dotenv import load_dotenv
import os
from elevenlabs.client import ElevenLabs
import subprocess
import tempfile
import random
import time

import json

def load_word_banks(language="chinese"):
    """Load word banks from JSON files for the specified language"""
    word_banks = {
        'beginner': [],
        'intermediate': []
    }
    
    try:
        print(f"Current working directory when loading: {os.getcwd()}")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        words_dir = os.path.join(base_dir, 'words')
        
        print(f"Using base directory: {base_dir}")
        print(f"Words directory path: {words_dir}")
        
        if not os.path.exists(words_dir):
            print(f"Creating words directory at {words_dir}")
            os.makedirs(words_dir)
        
        language_dir = os.path.join(words_dir, language)
        if not os.path.exists(language_dir):
            print(f"Creating language directory at {language_dir}")
            os.makedirs(language_dir)
        
        beginner_path = os.path.join(language_dir, 'beginner.json')
        print(f"Looking for beginner words at: {beginner_path}")
        
        if os.path.exists(beginner_path):
            print(f"Found beginner words file")
            with open(beginner_path, 'r', encoding='utf-8') as f:
                word_banks['beginner'] = json.load(f)
                print(f"Loaded {len(word_banks['beginner'])} beginner words")
        else:
            print(f"Beginner words file not found")
                
        intermediate_path = os.path.join(language_dir, 'intermediate.json')
        print(f"Looking for intermediate words at: {intermediate_path}")
        
        if os.path.exists(intermediate_path):
            print(f"Found intermediate words file")
            with open(intermediate_path, 'r', encoding='utf-8') as f:
                word_banks['intermediate'] = json.load(f)
                print(f"Loaded {len(word_banks['intermediate'])} intermediate words")
        else:
            print(f"Intermediate words file not found")
                
    except Exception as e:
        print(f"Error loading word banks: {e}")
        import traceback
        traceback.print_exc()
        print(f"Using default words for {language}")
        word_banks['beginner'] = DEFAULT_WORDS[language]['beginner']
        word_banks['intermediate'] = DEFAULT_WORDS[language]['intermediate']
    
    return word_banks

def save_word_banks(word_banks, language="chinese"):
    """Save word banks to JSON files for the specified language"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        words_dir = os.path.join(base_dir, 'words')
        
        print(f"Using base directory: {base_dir}")
        print(f"Words directory path: {words_dir}")
        
        if not os.path.exists(words_dir):
            print(f"Creating words directory at {words_dir}")
            os.makedirs(words_dir)
            
        language_dir = os.path.join(words_dir, language)
        if not os.path.exists(language_dir):
            print(f"Creating language directory at {language_dir}")
            os.makedirs(language_dir)
            
        beginner_path = os.path.join(language_dir, 'beginner.json')
        print(f"Saving beginner words to: {beginner_path}")
        
        with open(beginner_path, 'w', encoding='utf-8') as f:
            json.dump(word_banks['beginner'], f, ensure_ascii=False, indent=2)
            
        intermediate_path = os.path.join(language_dir, 'intermediate.json')
        print(f"Saving intermediate words to: {intermediate_path}")
        
        with open(intermediate_path, 'w', encoding='utf-8') as f:
            json.dump(word_banks['intermediate'], f, ensure_ascii=False, indent=2)
            
        print("Word banks saved successfully!")
    except Exception as e:
        print(f"Error saving word banks: {e}")
        import traceback
        traceback.print_exc()

def manage_words(language):
    """Menu for managing word banks"""
    word_banks = load_word_banks(language)
    
    while True:
        print(f"\n{language.capitalize()} Word Bank Management")
        print("-------------------")
        print("1. View all words")
        print("2. Add new word")
        print("3. Remove word")
        print("4. Save and exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == "1":
            print("\nBeginner Words:")
            for word in word_banks['beginner']:
                print(f"- {word}")
            print("\nIntermediate Words:")
            for word in word_banks['intermediate']:
                print(f"- {word}")
                
        elif choice == "2":
            level = input("Enter level (beginner/intermediate): ").lower()
            if level not in word_banks:
                print("Invalid level!")
                continue
                
            word = input(f"Enter the {language} word: ")
            meaning = input("Enter the English meaning: ")
            word_banks[level].append({"word": word, "meaning": meaning})
            print("Word added successfully!")
            
        elif choice == "3":
            level = input("Enter level (beginner/intermediate): ").lower()
            if level not in word_banks:
                print("Invalid level!")
                continue
                
            print(f"\nCurrent {level} words:")
            for i, word_data in enumerate(word_banks[level]):
                print(f"{i+1}. {word_data['word']} ({word_data['meaning']})")
                
            idx = int(input("Enter number to remove: ")) - 1
            if 0 <= idx < len(word_banks[level]):
                removed = word_banks[level].pop(idx)
                print(f"Removed: {removed['word']}")
            else:
                print("Invalid number!")
                
        elif choice == "4":
            save_word_banks(word_banks, language)
            break

DEFAULT_WORDS = {
    "chinese": {
        "beginner": [
            {"word": "你好", "meaning": "hello"},
            {"word": "谢谢", "meaning": "thank you"},
            {"word": "再见", "meaning": "goodbye"},
            {"word": "朋友", "meaning": "friend"},
            {"word": "学习", "meaning": "study"},
            {"word": "喜欢", "meaning": "like"},
            {"word": "吃饭", "meaning": "eat"},
            {"word": "水", "meaning": "water"},
            {"word": "猫", "meaning": "cat"},
            {"word": "狗", "meaning": "dog"}
        ],
        "intermediate": [
            {"word": "经济", "meaning": "economy"},
            {"word": "环境", "meaning": "environment"},
            {"word": "发展", "meaning": "development"},
            {"word": "技术", "meaning": "technology"},
            {"word": "教育", "meaning": "education"},
            {"word": "文化", "meaning": "culture"},
            {"word": "社会", "meaning": "society"},
            {"word": "政府", "meaning": "government"},
            {"word": "工作", "meaning": "work"},
            {"word": "生活", "meaning": "life"}
        ]
    },
    "spanish": {
        "beginner": [
            {"word": "hola", "meaning": "hello"},
            {"word": "gracias", "meaning": "thank you"},
            {"word": "adiós", "meaning": "goodbye"},
            {"word": "amigo", "meaning": "friend"},
            {"word": "estudiar", "meaning": "to study"},
            {"word": "gustar", "meaning": "to like"},
            {"word": "comer", "meaning": "to eat"},
            {"word": "agua", "meaning": "water"},
            {"word": "gato", "meaning": "cat"},
            {"word": "perro", "meaning": "dog"}
        ],
        "intermediate": [
            {"word": "economía", "meaning": "economy"},
            {"word": "ambiente", "meaning": "environment"},
            {"word": "desarrollo", "meaning": "development"},
            {"word": "tecnología", "meaning": "technology"},
            {"word": "educación", "meaning": "education"},
            {"word": "cultura", "meaning": "culture"},
            {"word": "sociedad", "meaning": "society"},
            {"word": "gobierno", "meaning": "government"},
            {"word": "trabajo", "meaning": "work"},
            {"word": "vida", "meaning": "life"}
        ]
    }
}

LANGUAGE_CODES = {
    "chinese": "zho",
    "spanish": "spa",
    "french": "fra",
    "german": "deu",
    "japanese": "jpn",
    "korean": "kor",
    "russian": "rus"
}

def record_audio(duration=5):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    print(f"Recording for {duration} seconds... Speak now!")
    
    subprocess.run(['rec', '-q', temp_file.name, 'trim', '0', str(duration)])
    
    print("Recording finished!")
    return temp_file.name

def clean_text(text):
    while '(' in text and ')' in text:
        start = text.find('(')
        end = text.find(')') + 1
        text = text[:start] + text[end:]
    
    punctuation = '。，！？,.!?¡¿'
    for p in punctuation:
        text = text.replace(p, '')
    
    return text.strip()

def transcribe_audio(file_path, language="chinese"):
    load_dotenv()
    
    client = ElevenLabs(
        api_key=os.getenv("ELEVENLABS_API_KEY")
    )
    
    language_code = LANGUAGE_CODES.get(language, "eng")
    
    with open(file_path, 'rb') as audio_file:
        try:
            transcription = client.speech_to_text.convert(
                file=audio_file,
                model_id="scribe_v1",
                tag_audio_events=True,
                language_code=language_code,
                diarize=True
            )
            
            if not transcription or not transcription.text:
                return "No speech detected"
                
            return transcription.text
        except Exception as e:
            print(f"Error in transcribe_audio: {str(e)}")
            raise e 
def main():
    while True:
        print("\nLanguage Pronunciation Practice")
        print("-----------------------------")
        print("1. Select language")
        print("2. Practice pronunciation")
        print("3. Manage word banks")
        print("4. Exit")
        
        choice = input("\nEnter your choice (1-4): ")
        
        if choice == "1":
            print("\nAvailable languages:")
            for i, lang in enumerate(DEFAULT_WORDS.keys(), 1):
                print(f"{i}. {lang.capitalize()}")
            
            print(f"{len(DEFAULT_WORDS) + 1}. Other")
            
            lang_choice = input(f"\nSelect language (1-{len(DEFAULT_WORDS) + 1}): ")
            
            try:
                lang_idx = int(lang_choice) - 1
                if 0 <= lang_idx < len(DEFAULT_WORDS):
                    selected_language = list(DEFAULT_WORDS.keys())[lang_idx]
                else:
                    selected_language = input("Enter language name: ").lower()
                    if selected_language not in DEFAULT_WORDS:
                        DEFAULT_WORDS[selected_language] = {
                            "beginner": [],
                            "intermediate": []
                        }
                    if selected_language not in LANGUAGE_CODES:
                        code = input(f"Enter language code for {selected_language} (e.g., eng, fra, deu): ")
                        LANGUAGE_CODES[selected_language] = code
            except ValueError:
                print("Invalid choice. Using Chinese as default.")
                selected_language = "chinese"
                
            print(f"\nSelected language: {selected_language.capitalize()}")
            
        elif choice == "2":
            if 'selected_language' not in locals():
                selected_language = "chinese"
                print(f"Using default language: {selected_language.capitalize()}")
                
            word_banks = load_word_banks(selected_language)
            print("\nChoose difficulty level:")
            print("1. Beginner")
            print("2. Intermediate")
            level_choice = input("Enter 1 or 2: ")
            
            word_bank = word_banks['beginner'] if level_choice == "1" else word_banks['intermediate']
            
            if not word_bank:
                print(f"No words available for {selected_language} at this level. Please add some words first.")
                continue
                
            word_data = random.choice(word_bank)
            target_word = word_data['word']
            
            print(f"\nPlease say this word in {selected_language.capitalize()}:")
            print(f"➡️  {target_word} ({word_data['meaning']})")
            
            print("\nRecording will start in 3 seconds...")
            for i in range(3, 0, -1):
                print(i)
                time.sleep(1)
                
            temp_file_path = record_audio(5)
            transcribed_text = transcribe_audio(temp_file_path, selected_language)
            
            os.remove(temp_file_path)
            
            cleaned_text = clean_text(transcribed_text)
            
            print("\nResults:")
            print("--------------")
            print(f"Target word: {target_word}")
            print(f"You said: {transcribed_text}")
            print(f"Cleaned text: {cleaned_text}")
            
            if cleaned_text == target_word:
                print("\n👍 Perfect pronunciation!")
            else:
                print("\nTry again!")
            
        elif choice == "3":
            if 'selected_language' not in locals():
                selected_language = "chinese"
                print(f"Using default language: {selected_language.capitalize()}")
            manage_words(selected_language)
            
        elif choice == "4":
            print("Goodbye!")
            break

if __name__ == "__main__":
    main()
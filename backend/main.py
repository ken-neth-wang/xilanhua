from dotenv import load_dotenv
import os
from elevenlabs.client import ElevenLabs
import subprocess
import tempfile
import random
import time

import json

def load_word_banks():
    """Load word banks from JSON files"""
    word_banks = {
        'beginner': [],
        'intermediate': []
    }
    
    try:
        # Create words directory if it doesn't exist
        if not os.path.exists('words'):
            os.makedirs('words')
        
        # Load beginner words
        if os.path.exists('words/beginner.json'):
            with open('words/beginner.json', 'r', encoding='utf-8') as f:
                word_banks['beginner'] = json.load(f)
                
        # Load intermediate words
        if os.path.exists('words/intermediate.json'):
            with open('words/intermediate.json', 'r', encoding='utf-8') as f:
                word_banks['intermediate'] = json.load(f)
                
    except Exception as e:
        print(f"Error loading word banks: {e}")
        # Use default words if files can't be loaded
        word_banks['beginner'] = CHINESE_WORDS_BEGINNER
        word_banks['intermediate'] = CHINESE_WORDS_INTERMEDIATE
    
    return word_banks

def save_word_banks(word_banks):
    """Save word banks to JSON files"""
    try:
        if not os.path.exists('words'):
            os.makedirs('words')
            
        with open('words/beginner.json', 'w', encoding='utf-8') as f:
            json.dump(word_banks['beginner'], f, ensure_ascii=False, indent=2)
            
        with open('words/intermediate.json', 'w', encoding='utf-8') as f:
            json.dump(word_banks['intermediate'], f, ensure_ascii=False, indent=2)
            
        print("Word banks saved successfully!")
    except Exception as e:
        print(f"Error saving word banks: {e}")

def manage_words():
    """Menu for managing word banks"""
    word_banks = load_word_banks()
    
    while True:
        print("\nWord Bank Management")
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
                
            word = input("Enter the Chinese word: ")
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
            save_word_banks(word_banks)
            break

CHINESE_WORDS_BEGINNER = [
    "你好",    # hello
    "谢谢",    # thank you
    "再见",    # goodbye
    "朋友",    # friend
    "学习",    # study
    "喜欢",    # like
    "吃饭",    # eat
    "水",      # water
    "猫",      # cat
    "狗",      # dog
]

CHINESE_WORDS_INTERMEDIATE = [
    "经济",    # economy
    "环境",    # environment
    "发展",    # development
    "技术",    # technology
    "教育",    # education
    "文化",    # culture
    "社会",    # society
    "政府",    # government
    "工作",    # work
    "生活",    # life
]
def record_audio(duration=5):
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    print(f"Recording for {duration} seconds... Speak now!")
    
    # Use sox's rec command
    subprocess.run(['rec', '-q', temp_file.name, 'trim', '0', str(duration)])
    
    print("Recording finished!")
    return temp_file.name

def clean_text(text):
    # Remove parenthetical content
    while '(' in text and ')' in text:
        start = text.find('(')
        end = text.find(')') + 1
        text = text[:start] + text[end:]
    
    # Remove punctuation (。，！？etc.)
    punctuation = '。，！？,.!?'
    for p in punctuation:
        text = text.replace(p, '')
    
    return text.strip()

def transcribe_audio(file_path):
    # Load environment variables
    load_dotenv()
    
    # Initialize ElevenLabs client
    client = ElevenLabs(
        api_key=os.getenv("ELEVENLABS_API_KEY")
    )
    
    # Open and read the audio file
    with open(file_path, 'rb') as audio_file:
        # Convert speech to text
        transcription = client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v1",  # Correct model ID
            tag_audio_events=True,
            language_code="zho",  # Chinese Mandarin language code
            diarize=True
        )
        
        return transcription.text
def main():
    while True:
        print("\nChinese Pronunciation Practice")
        print("-----------------------------")
        print("1. Practice pronunciation")
        print("2. Manage word banks")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ")
        
        if choice == "1":
            word_banks = load_word_banks()
            print("\nChoose difficulty level:")
            print("1. Beginner")
            print("2. Intermediate")
            level_choice = input("Enter 1 or 2: ")
            
            word_bank = word_banks['beginner'] if level_choice == "1" else word_banks['intermediate']
            word_data = random.choice(word_bank)
            target_word = word_data['word']
            
            print(f"\nPlease say this word in Chinese:")
            print(f"➡️  {target_word} ({word_data['meaning']})")
            
            # Recording countdown
            print("\nRecording will start in 3 seconds...")
            for i in range(3, 0, -1):
                print(i)
                time.sleep(1)
                
            # Record and process audio
            temp_file_path = record_audio(5)
            transcribed_text = transcribe_audio(temp_file_path)
            
            # Clean up temporary file
            os.remove(temp_file_path)
            
            # Clean the transcribed text
            cleaned_text = clean_text(transcribed_text)
            
            # Print results and compare
            print("\nResults:")
            print("--------------")
            print(f"Target word: {target_word}")
            print(f"You said: {transcribed_text}")
            print(f"Cleaned text: {cleaned_text}")
            
            if cleaned_text == target_word:
                print("\n👍 Perfect pronunciation!")
            else:
                print("\nTMD! Try again!")
            
        elif choice == "2":
            manage_words()
            
        elif choice == "3":
            print("Goodbye!")
            break
if __name__ == "__main__":
    main()
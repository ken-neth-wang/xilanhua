from dotenv import load_dotenv
import os
from elevenlabs.client import ElevenLabs
import subprocess
import tempfile

def record_audio(duration=5):
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    
    print(f"Recording for {duration} seconds... Speak now!")
    
    # Use sox's rec command
    subprocess.run(['rec', '-q', temp_file.name, 'trim', '0', str(duration)])
    
    print("Recording finished!")
    return temp_file.name

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
    try:
        # Ask user for recording duration
        duration = float(input("How many seconds would you like to record for? "))
        
        # Record audio
        temp_file_path = record_audio(duration)
        
        # Get transcription
        transcribed_text = transcribe_audio(temp_file_path)
        
        # Clean up temporary file
        os.remove(temp_file_path)
        
        # Print results
        print("\nTranscription:")
        print("--------------")
        print(transcribed_text)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()
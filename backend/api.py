# api.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from main import transcribe_audio, clean_text

app = FastAPI()

# Add CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        # Reset file position to beginning to ensure we can read the content
        await audio.seek(0)
        
        # Write the file content
        content = await audio.read()
        print(f"Content length: {len(content) if content else 0} bytes")
        if not content:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="The uploaded file is empty or corrupted")
            
        temp_file.write(content)
        temp_file.close()
        print(f"Temp file written to: {temp_file.name}")
        print(f"Temp file size: {os.path.getsize(temp_file.name)} bytes")
        
        # Add error handling and logging
        try:
            # Use your existing function to transcribe
            print("Starting transcription...")
            transcribed_text = transcribe_audio(temp_file.name)
            print(f"Raw transcribed text: {transcribed_text}")
            
            cleaned_text = clean_text(transcribed_text)
            print(f"Cleaned text: {cleaned_text}")
            
            return {"transcription": cleaned_text, "raw_transcription": transcribed_text}
        except Exception as e:
            # Log the specific error
            print(f"Transcription error: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            # Return a proper FastAPI response, not a tuple
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file.name):
            print(f"Cleaning up temp file: {temp_file.name}")
            os.remove(temp_file.name)
# Add error handling and logging
@app.get("/api/words")
async def get_words():
    try:
        # Import the function from main.py
        from main import load_word_banks
        
        # Load word banks
        word_banks = load_word_banks()
        
        # Return the word banks as JSON
        return word_banks
    except Exception as e:
        print(f"Error loading words: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/words")
async def add_word(word_data: dict):
    try:
        # Import the functions from main.py
        from main import save_word_banks
        
        print(f"Received word data: {word_data}")  # Debug
        
        # Check if we're receiving the entire word banks structure
        if "beginner" in word_data and "intermediate" in word_data:
            # We're receiving the entire word banks structure
            word_banks = word_data
            language = "chinese"  # Default to Chinese
            
            # Save the word banks directly
            save_word_banks(word_banks, language)
            
            return word_banks
        else:
            # We're receiving a single word to add
            # Import load_word_banks for this case
            from main import load_word_banks
            
            # Get the word data from the request
            level = word_data.get("level")
            word = word_data.get("word")
            meaning = word_data.get("meaning")
            language = word_data.get("language", "chinese")
            
            # Validate input
            if not level or not word or not meaning:
                return {"error": "Missing required fields: level, word, or meaning"}
            
            if level not in ["beginner", "intermediate"]:
                return {"error": "Level must be 'beginner' or 'intermediate'"}
            
            # Load current word banks
            word_banks = load_word_banks(language)
            
            # Add the new word
            word_banks[level].append({"word": word, "meaning": meaning})
            
            # Save the updated word banks
            save_word_banks(word_banks, language)
            
            return word_banks
    except Exception as e:
        print(f"Error adding word: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
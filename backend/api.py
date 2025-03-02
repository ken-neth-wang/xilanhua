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
        # Write the file content
        temp_file.write(await audio.read())
        temp_file.close()
        
        # Add error handling and logging
        try:
            # Use your existing function to transcribe
            transcribed_text = transcribe_audio(temp_file.name)
            cleaned_text = clean_text(transcribed_text)
            
            return {"transcription": cleaned_text, "raw_transcription": transcribed_text}
        except Exception as e:
            # Log the specific error
            print(f"Transcription error: {str(e)}")
            return {"error": str(e)}, 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file.name):
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
        return {"error": str(e)}, 500
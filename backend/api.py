from fastapi import FastAPI, UploadFile, File, Query, HTTPException, Request  # Add Request here
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import PyPDF2
from typing import List, Dict
import anthropic
from dotenv import load_dotenv
import fitz  # PyMuPDF
import easyocr
import numpy as np

app = FastAPI()

# Add CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:5173",  # Add Vite's default port
        "http://127.0.0.1:5173"   # Also add this variant
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def extract_text_from_pdf(file_path: str) -> str:
    """Try multiple methods to extract text from PDF, return empty string if all fail."""
    extracted_text = ""
    
    # Method 1: Try PyMuPDF (fitz)
    try:
        doc = fitz.open(file_path)
        for page in doc:
            extracted_text += page.get_text()
        doc.close()
        if extracted_text.strip():
            print("Successfully extracted text using PyMuPDF")
            return extracted_text
    except Exception as e:
        print(f"PyMuPDF failed: {str(e)}")

    # Method 2: Try PyPDF2
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
            if text.strip():
                print("Successfully extracted text using PyPDF2")
                return text
    except Exception as e:
        print(f"PyPDF2 failed: {str(e)}")

    return ""  # Return empty string if all methods fail

async def extract_text_with_ocr(pdf_path: str) -> str:
    """Extract text using EasyOCR."""
    try:
        # Initialize EasyOCR reader for Chinese and English
        print("Initializing EasyOCR...")
        reader = easyocr.Reader(['ch_sim', 'en'])
        
        # Open PDF and convert pages to images
        doc = fitz.open(pdf_path)
        extracted_text = []
        
        print(f"Processing {len(doc)} pages with OCR...")
        for page_num in range(len(doc)):
            print(f"Processing page {page_num + 1}/{len(doc)}")
            # Get page
            page = doc[page_num]
            # Convert page to image
            pix = page.get_pixmap()
            # Convert to numpy array for EasyOCR
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            )
            
            # Perform OCR
            results = reader.readtext(img)
            # Extract text from results
            page_text = ' '.join([text[1] for text in results])
            extracted_text.append(page_text)
        
        doc.close()
        final_text = '\n'.join(extracted_text)
        print("OCR completed successfully")
        return final_text
        
    except Exception as e:
        print(f"OCR failed: {str(e)}")
        return ""
async def extract_vocab_from_text(text: str) -> Dict[str, List[Dict[str, str]]]:
    """
    Use Anthropic's Claude to extract vocabulary words from text and categorize them.
    Returns a dictionary with beginner and intermediate word lists.
    """
    prompt = f"""
    Extract Chinese vocabulary words from the following text and categorize them into beginner and intermediate levels.
    Only extract actual Chinese words that appear in the text - do not generate or invent words that aren't there.
    Return your response in valid JSON format with two lists: beginner and intermediate.
    Each word should have both the Chinese characters and English meaning.
    
    Rules for categorization:
    - Beginner: Common everyday words, basic verbs, simple nouns, numbers, basic adjectives
    - Intermediate: More complex vocabulary, abstract concepts, professional terms, compound words
    
    Text to analyze:
    {text}
    
    Format your response exactly like this example, with no additional text:
    {{
        "beginner": [
            {{"word": "你好", "meaning": "hello"}},
            {{"word": "吃饭", "meaning": "eat"}}
        ],
        "intermediate": [
            {{"word": "经济", "meaning": "economy"}},
            {{"word": "环境", "meaning": "environment"}}
        ]
    }}
    """
    
    try:
        response = anthropic_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=2000,
            temperature=0,
            system="You are a Chinese/Korean language expert helping to extract and categorize vocabulary from text. Only respond with the requested JSON format.",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        # Extract the JSON part from Claude's response
        response_text = response.content[0].text
        
        # Find JSON-like structure in the response
        import re
        import json
        
        # Try to find a JSON object in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            print("No valid JSON found in Claude's response")
            print("Full response:", response_text)
            return {"beginner": [], "intermediate": []}
            
        result = json.loads(json_match.group())
        
        # Validate the structure
        if not isinstance(result, dict) or 'beginner' not in result or 'intermediate' not in result:
            print("Invalid response structure from Claude")
            return {"beginner": [], "intermediate": []}
            
        return result
        
    except Exception as e:
        print(f"Error in Claude processing: {str(e)}")
        print("Full response text:", response_text if 'response_text' in locals() else "No response")
        return {"beginner": [], "intermediate": []}

@app.post("/api/extract-pdf")
async def extract_pdf_vocab(pdf_file: UploadFile = File(...)):
    """Extract vocabulary from a PDF file and return categorized word lists."""
    if not pdf_file.filename.endswith('.pdf'):
        return {
            "message": "File must be a PDF",
            "success": False,
            "word_banks": None
        }
    
    # Create a temporary file to store the PDF
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    try:
        # Write the uploaded file to temporary storage
        content = await pdf_file.read()
        temp_pdf.write(content)
        temp_pdf.close()
        
        # Try normal text extraction first
        extracted_text = await extract_text_from_pdf(temp_pdf.name)
        
        # If no text found, try OCR
        if not extracted_text.strip():
            print("No text found through normal extraction, attempting OCR...")
            extracted_text = await extract_text_with_ocr(temp_pdf.name)
            
        if not extracted_text.strip():
            return {
                "message": "Could not extract any text from the PDF, even with OCR",
                "success": False,
                "word_banks": None
            }
            
        print(f"Extracted text length: {len(extracted_text)}")
        print("First 500 characters of extracted text:", extracted_text[:500])
        
        # Process the extracted text with Claude
        try:
            vocab_lists = await extract_vocab_from_text(extracted_text)
            
            # Load and merge with existing word banks
            from main import load_word_banks, save_word_banks
            
            existing_banks = load_word_banks()
            
            # Merge new words with existing ones (avoiding duplicates)
            for level in ['beginner', 'intermediate']:
                existing_words = {item['word'] for item in existing_banks[level]}
                new_words = [word for word in vocab_lists[level] 
                            if word['word'] not in existing_words]
                existing_banks[level].extend(new_words)
            
            # Save the updated word banks
            save_word_banks(existing_banks, "chinese")
            
            return {
                "message": "Successfully extracted vocabulary from PDF",
                "success": True,
                "extracted_text_length": len(extracted_text),
                "word_banks": existing_banks,
                "new_words": vocab_lists
            }
            
        except Exception as e:
            print(f"Error processing extracted text: {str(e)}")
            return {
                "message": f"Error processing extracted text: {str(e)}",
                "success": False,
                "word_banks": None
            }
            
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        return {
            "message": f"Error processing PDF: {str(e)}",
            "success": False,
            "word_banks": None
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_pdf.name):
            os.remove(temp_pdf.name)
@app.post("/api/extract-anki")
async def extract_anki_deck(filename: str = Query(..., description="Name of the Anki deck file to extract")):
    try:
        from ank import extract_apkg
        
        # Check if file exists
        if not os.path.exists(filename):
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
            
        extract_dir = "extracted_anki"
        os.makedirs(extract_dir, exist_ok=True)
        
        # Extract the deck
        extract_apkg(filename, extract_dir)
        
        return {
            "message": f"Successfully extracted {filename}",
            "status": True
        }
    except Exception as e:
        print(f"Error extracting Anki deck: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/check-anki-status")
async def check_anki_status():
    """Check if there are any unextracted Anki files."""
    try:
        extract_dir = "extracted_anki"
        db_path = os.path.join(extract_dir, "collection.anki2")
        
        status = {
            "has_extracted_db": os.path.exists(db_path),
            "extract_dir_exists": os.path.exists(extract_dir),
            "pending_files": []
        }
        
        # Check for any .apkg files in the current directory
        for file in os.listdir():
            if file.endswith('.apkg'):
                status["pending_files"].append(file)
        
        return status
    except Exception as e:
        print(f"Error checking Anki status: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

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
@app.post("/api/extract-text")
async def extract_text_vocab(request: Request):
    """Extract vocabulary from provided text."""
    try:
        data = await request.json()
        text = data.get('text', '')
        
        if not text.strip():
            return {
                "message": "No text provided",
                "success": False,
                "word_banks": None
            }
        
        # Clean the text to ensure we only process Chinese characters
        import re  # Make sure this is imported
        chinese_pattern = r'[\u4e00-\u9fff]+'
        chinese_text = ' '.join(re.findall(chinese_pattern, text))
        
        if not chinese_text:
            return {
                "message": "No Chinese characters found in the text",
                "success": False,
                "word_banks": None
            }
            
        # Process with Claude
        try:
            vocab_lists = await extract_vocab_from_text(chinese_text)
            
            # Load and merge with existing word banks
            from main import load_word_banks, save_word_banks
            existing_banks = load_word_banks()
            
            # Merge new words with existing ones (avoiding duplicates)
            for level in ['beginner', 'intermediate']:
                existing_words = {item['word'] for item in existing_banks[level]}
                new_words = [word for word in vocab_lists[level] 
                            if word['word'] not in existing_words]
                existing_banks[level].extend(new_words)
            
            # Save the updated word banks
            save_word_banks(existing_banks, "chinese")
            
            return {
                "message": "Successfully extracted vocabulary from text",
                "success": True,
                "word_banks": existing_banks,
                "new_words": vocab_lists
            }
            
        except Exception as e:
            print(f"Error processing text: {str(e)}")
            return {
                "message": f"Error processing text: {str(e)}",
                "success": False,
                "word_banks": None
            }
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            "message": f"Error processing request: {str(e)}",
            "success": False,
            "word_banks": None
        }
@app.get("/api/words")
async def get_words():
    try:
        # Use the Anki import functionality instead of loading from JSON
        from ank import import_anki_to_wordbank
        
        # Path to your Anki file in the extracted_anki folder
        # You might want to make this configurable or find the most recent file
        anki_db_path = os.path.join("extracted_anki", "collection.anki2")
        
        if not os.path.exists(anki_db_path):
            # Fall back to the original method if Anki file doesn't exist
            from main import load_word_banks
            word_banks = load_word_banks()
            print("Using JSON word banks (Anki file not found)")
        else:
            # Use the Anki database directly
            from ank import read_anki_database, convert_anki_to_wordbank
            cards = read_anki_database(anki_db_path)
            word_banks = convert_anki_to_wordbank(cards)
            print(f"Loaded {len(cards)} cards from Anki database")
        
        # Return the word banks as JSON
        return word_banks
    except Exception as e:
        print(f"Error loading words: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/import-anki")
async def import_anki(anki_file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.apkg')
    try:
        # Reset file position to beginning to ensure we can read the content
        await anki_file.seek(0)
        
        # Write the file content
        content = await anki_file.read()
        if not content:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="The uploaded file is empty or corrupted")
            
        temp_file.write(content)
        temp_file.close()
        
        # Import the Anki deck
        from ank import import_anki_to_wordbank
        word_banks = import_anki_to_wordbank(temp_file.name)
        
        # Optionally save the word banks to your JSON files
        from main import save_word_banks
        save_word_banks(word_banks, "chinese")  # Assuming Chinese is the default
        
        # Return the imported word banks
        return {
            "message": f"Successfully imported Anki deck with {len(word_banks['beginner'])} beginner and {len(word_banks['intermediate'])} intermediate words",
            "word_banks": word_banks
        }
    except Exception as e:
        print(f"Error importing Anki file: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)
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
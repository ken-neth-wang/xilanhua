from fastapi import FastAPI, UploadFile, File, Query, HTTPException, Request  
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
import re
import json
from main import load_word_banks, save_word_banks, transcribe_audio, clean_text
from ank import read_anki_database, convert_anki_to_wordbank, extract_apkg, import_anki_to_wordbank
import traceback
from mistralai import Mistral


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:5173",  
        "http://127.0.0.1:5173"  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
load_dotenv()
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def extract_text_with_mistral(pdf_path: str) -> str:
    """Extract text using Mistral AI's OCR API."""
    try:
        print("Initializing Mistral AI OCR...")
        client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
        
        print("Uploading PDF file...")
        with open(pdf_path, "rb") as file:
            uploaded_pdf = client.files.upload(
                file={
                    "file_name": os.path.basename(pdf_path),
                    "content": file
                },
                purpose="ocr"
            )
        
        print(f"File uploaded with ID: {uploaded_pdf.id}")
        
        print("Getting signed URL...")
        signed_url = client.files.get_signed_url(file_id=uploaded_pdf.id)
        
        print("Processing with OCR...")
        ocr_response = client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": signed_url.url
            }
        )

        extracted_text = []
        if hasattr(ocr_response, 'pages'):
            for page in ocr_response.pages:
                if hasattr(page, 'markdown'): 
                    extracted_text.append(page.markdown)

        final_text = '\n'.join(extracted_text) if extracted_text else ""
        if final_text:
            print("Mistral AI OCR completed successfully")
            print(f"First 200 characters of extracted text: {final_text[:200]}...")
        else:
            print("No text extracted from Mistral AI OCR")
        return final_text

    except Exception as e:
        print(f"Mistral AI OCR failed: {str(e)}")
        traceback.print_exc()
        return ""
    
    
    
    
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

    return "" 

async def extract_text_with_ocr(pdf_path: str) -> str:
    """Extract text using EasyOCR."""
    try:
        # Initialize EasyOCR reader for Chinese and English
        print("Initializing EasyOCR...")
        reader = easyocr.Reader(['ch_sim', 'en'])
        
        doc = fitz.open(pdf_path)
        extracted_text = []
        
        print(f"Processing {len(doc)} pages with OCR...")
        for page_num in range(len(doc)):
            print(f"Processing page {page_num + 1}/{len(doc)}")
            page = doc[page_num]
            pix = page.get_pixmap()
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                pix.height, pix.width, pix.n
            )
            
            results = reader.readtext(img)
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
        
        response_text = response.content[0].text
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        
        if json_match:
            result = json.loads(json_match.group())
            
            if isinstance(result, dict) and 'beginner' in result and 'intermediate' in result:
                print("\nExtracted Vocabulary:")
                print("\nBeginner Words:")
                print("-" * 40)
                for word in result['beginner']:
                    print(f"Word: {word['word']} | Meaning: {word['meaning']}")
                
                print("\nIntermediate Words:")
                print("-" * 40)
                for word in result['intermediate']:
                    print(f"Word: {word['word']} | Meaning: {word['meaning']}")
                print("-" * 40)
                
                return result
            else:
                print("Invalid response structure from Claude")
                return {"beginner": [], "intermediate": []}
        else:
            print("No valid JSON found in Claude's response")
            print("Full response:", response_text)
            return {"beginner": [], "intermediate": []}
            
    except Exception as e:
        print(f"Error in Claude processing: {str(e)}")
        print("Full response text:", response_text if 'response_text' in locals() else "No response")
        return {"beginner": [], "intermediate": []}

@app.post("/api/extract-pdf")
async def extract_pdf_vocab(
    pdf_file: UploadFile = File(...),
    ocr_method: str = Query("mistral", description="OCR method to use: 'easy' or 'mistral'") 
):
    """Extract vocabulary from a PDF file and return categorized word lists."""
    if not pdf_file.filename.endswith('.pdf'):
        return {
            "message": "File must be a PDF",
            "success": False,
            "word_banks": None
        }
    
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    try:
        content = await pdf_file.read()
        temp_pdf.write(content)
        temp_pdf.close()
        
        extracted_text = await extract_text_from_pdf(temp_pdf.name)
        
        if not extracted_text.strip():
            print(f"No text found through normal extraction, attempting {ocr_method} OCR...")
            if ocr_method == "mistral":
                extracted_text = await extract_text_with_mistral(temp_pdf.name)
            else:
                extracted_text = await extract_text_with_ocr(temp_pdf.name)
            
        if not extracted_text.strip():
            return {
                "message": f"Could not extract any text from the PDF, even with {ocr_method} OCR",
                "success": False,
                "word_banks": None
            }
            
        print(f"Extracted text length: {len(extracted_text)}")
        print("First 500 characters of extracted text:", extracted_text[:500])
        
        try:
            vocab_lists = await extract_vocab_from_text(extracted_text)
            
            
            existing_banks = load_word_banks()
            
            for level in ['beginner', 'intermediate']:
                existing_words = {item['word'] for item in existing_banks[level]}
                new_words = [word for word in vocab_lists[level] 
                            if word['word'] not in existing_words]
                existing_banks[level].extend(new_words)
            
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
        if os.path.exists(temp_pdf.name):
            os.remove(temp_pdf.name)
@app.post("/api/extract-anki")
async def extract_anki_deck(filename: str = Query(..., description="Name of the Anki deck file to extract")):
    try:
        
        if not os.path.exists(filename):
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
            
        extract_dir = "extracted_anki"
        os.makedirs(extract_dir, exist_ok=True)
        
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
        
        for file in os.listdir():
            if file.endswith('.apkg'):
                status["pending_files"].append(file)
        
        return status
    except Exception as e:
        print(f"Error checking Anki status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        await audio.seek(0)
        
        content = await audio.read()
        print(f"Content length: {len(content) if content else 0} bytes")
        if not content:
            raise HTTPException(status_code=400, detail="The uploaded file is empty or corrupted")
            
        temp_file.write(content)
        temp_file.close()
        print(f"Temp file written to: {temp_file.name}")
        print(f"Temp file size: {os.path.getsize(temp_file.name)} bytes")
        
        try:
            print("Starting transcription...")
            transcribed_text = transcribe_audio(temp_file.name)
            print(f"Raw transcribed text: {transcribed_text}")
            
            cleaned_text = clean_text(transcribed_text)
            print(f"Cleaned text: {cleaned_text}")
            
            return {"transcription": cleaned_text, "raw_transcription": transcribed_text}
        except Exception as e:
            print(f"Transcription error: {str(e)}")
            print(f"Error type: {type(e)}")
            print(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=str(e))
    finally:
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
        

        chinese_pattern = r'[\u4e00-\u9fff]+'
        chinese_text = ' '.join(re.findall(chinese_pattern, text))
        
        if not chinese_text:
            return {
                "message": "No Chinese characters found in the text",
                "success": False,
                "word_banks": None
            }
            
        try:
            vocab_lists = await extract_vocab_from_text(chinese_text)
            
            existing_banks = load_word_banks()
            
            for level in ['beginner', 'intermediate']:
                existing_words = {item['word'] for item in existing_banks[level]}
                new_words = [word for word in vocab_lists[level] 
                            if word['word'] not in existing_words]
                existing_banks[level].extend(new_words)
            
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

@app.delete("/api/words/{level}/{word}")
async def remove_word(level: str, word: str):
    try:
        if level not in ["beginner", "intermediate"]:
            raise HTTPException(status_code=400, detail="Level must be 'beginner' or 'intermediate'")
        
        word_banks = load_word_banks()
        
        word_banks[level] = [w for w in word_banks[level] if w["word"] != word]
        
        save_word_banks(word_banks, "chinese")
        
        return {
            "message": f"Successfully removed word '{word}' from {level} level",
            "word_banks": word_banks
        }
    except Exception as e:
        print(f"Error removing word: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/api/words")
async def get_words():
    try:        
        anki_db_path = os.path.join("extracted_anki", "collection.anki2")
        
        if not os.path.exists(anki_db_path):
            word_banks = load_word_banks()
            print("Using JSON word banks (Anki file not found)")
        else:
            cards = read_anki_database(anki_db_path)
            word_banks = convert_anki_to_wordbank(cards)
            print(f"Loaded {len(cards)} cards from Anki database")
        
        return word_banks
    except Exception as e:
        print(f"Error loading words: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/import-anki")
async def import_anki(anki_file: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.apkg')
    try:
        await anki_file.seek(0)
        
        content = await anki_file.read()
        if not content:
            raise HTTPException(status_code=400, detail="The uploaded file is empty or corrupted")
            
        temp_file.write(content)
        temp_file.close()
        
        word_banks = import_anki_to_wordbank(temp_file.name)
        
        save_word_banks(word_banks, "chinese") 
        
        return {
            "message": f"Successfully imported Anki deck with {len(word_banks['beginner'])} beginner and {len(word_banks['intermediate'])} intermediate words",
            "word_banks": word_banks
        }
    except Exception as e:
        print(f"Error importing Anki file: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)
            
@app.post("/api/words")
async def add_word(word_data: dict):
    try:
        print(f"Received word data: {word_data}") 
        if "beginner" in word_data and "intermediate" in word_data:
            word_banks = word_data
            language = "chinese"  
            save_word_banks(word_banks, language)
            return word_banks
        else:
            
            level = word_data.get("level")
            word = word_data.get("word")
            meaning = word_data.get("meaning")
            language = word_data.get("language", "chinese")
            if not level or not word or not meaning:
                return {"error": "Missing required fields: level, word, or meaning"}
            
            if level not in ["beginner", "intermediate"]:
                return {"error": "Level must be 'beginner' or 'intermediate'"}
            
            word_banks = load_word_banks(language)
            
            word_banks[level].append({"word": word, "meaning": meaning})
            
            save_word_banks(word_banks, language)
            
            return word_banks
    except Exception as e:
        print(f"Error adding word: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}
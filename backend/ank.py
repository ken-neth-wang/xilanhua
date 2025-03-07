import zipfile
import sqlite3
import os

def extract_apkg(apkg_path, extract_dir):
    """Extract the .apkg file to a directory."""
    with zipfile.ZipFile(apkg_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

def read_anki_database(db_path):
    """Read the Anki SQLite database and extract card data."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id, flds FROM notes")
    notes = cursor.fetchall()

    cards = []
    for note in notes:
        note_id, flds = note
        fields = flds.split("\x1f")  # Anki uses \x1f (ASCII unit separator) to split fields
        
        if len(cards) < 3:  
            print(f"Card {len(cards)+1} fields:")
            for i, field in enumerate(fields):
                print(f"  Field {i+1}: {field}")
        
        cards.append({
            "id": note_id,
            "fields": fields  
        })

    conn.close()
    return cards

def import_anki_deck(apkg_path):
    """Import an Anki deck from a .apkg file."""
    extract_dir = "extracted_anki"
    os.makedirs(extract_dir, exist_ok=True)

    extract_apkg(apkg_path, extract_dir)

    db_path = os.path.join(extract_dir, "collection.anki2")
    if not os.path.exists(db_path):
        raise FileNotFoundError("Anki database not found in the extracted files.")

    cards = read_anki_database(db_path)
    return cards
def convert_anki_to_wordbank(cards, default_level="beginner"):
    """
    Convert Anki cards to the word bank format used by the API.
    
    Args:
        cards: List of card dictionaries from import_anki_deck
        default_level: Default level to assign cards if not specified in the card
    
    Returns:
        Dictionary with 'beginner' and 'intermediate' lists of word entries
    """
    word_bank = {
        "beginner": [],
        "intermediate": []
    }
    
    for card in cards:
        fields = card["fields"]
        
        if len(fields) >= 5:
           
            word = fields[1].strip()
            meaning = fields[4].strip()
            
           
            pinyin = fields[3].strip() if len(fields) > 3 else ""
            if pinyin:
                meaning = f"{meaning} ({pinyin})"
            
            
            card_number = int(fields[0]) if fields[0].isdigit() else 0
            level = "beginner" if card_number <= 100 else "intermediate"
            
            word_entry = {
                "word": word,
                "meaning": meaning
            }
            
            word_bank[level].append(word_entry)
    
    return word_bank

def import_anki_to_wordbank(apkg_path, default_level="beginner"):
    """
    Import an Anki deck and convert it to the word bank format.
    
    Args:
        apkg_path: Path to the .apkg file
        default_level: Default level to assign cards if not specified
        
    Returns:
        Word bank dictionary ready for the API
    """
    cards = import_anki_deck(apkg_path)
    return convert_anki_to_wordbank(cards, default_level)

if __name__ == "__main__":
    apkg_path = input("Enter path to .apkg file: ")
    cards = import_anki_deck(apkg_path)
    for card in cards:
        print(card)
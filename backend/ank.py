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

    # Query the notes table to get card content
    cursor.execute("SELECT id, flds FROM notes")
    notes = cursor.fetchall()

    # Process notes into a list of dictionaries
    cards = []
    for note in notes:
        note_id, flds = note
        fields = flds.split("\x1f")  # Anki uses \x1f (ASCII unit separator) to split fields
        cards.append({
            "id": note_id,
            "fields": fields  # fields[0] is the front, fields[1] is the back, etc.
        })

    conn.close()
    return cards

def import_anki_deck(apkg_path):
    """Import an Anki deck from a .apkg file."""
    extract_dir = "extracted_anki"
    os.makedirs(extract_dir, exist_ok=True)

    # Step 1: Extract the .apkg file
    extract_apkg(apkg_path, extract_dir)

    # Step 2: Read the Anki database
    db_path = os.path.join(extract_dir, "collection.anki2")
    if not os.path.exists(db_path):
        raise FileNotFoundError("Anki database not found in the extracted files.")

    cards = read_anki_database(db_path)
    return cards

# Example usage
if __name__ == "__main__":
    apkg_path = input("Enter path to .apkg file: ")
    cards = import_anki_deck(apkg_path)
    for card in cards:
        print(card)
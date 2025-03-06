# xilanhua

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# install requirements 
pip install -r requirements.txt

# Run server 
# Basic run command
uvicorn api:app --reload

# With specific host and port
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
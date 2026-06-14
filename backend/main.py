import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from audio_processor import analyze_audio
from midi_processor import analyze_midi_notes
from pydantic import BaseModel
from typing import List, Optional

class MidiRequest(BaseModel):
    notes: List[int]

app = FastAPI(title="Raga AI API")

# Setup CORS – allow both local dev and production frontend
allowed_origins = ["http://localhost:3000"]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_endpoint(
    audio: UploadFile = File(...),
    tonic: Optional[str] = Form(None)
):
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = audio.filename.split(".")[-1].lower()
    if file_extension not in ["wav", "mp3", "m4a", "ogg", "flac"]:
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    
    temp_file_path = os.path.join(TEMP_DIR, audio.filename)
    
    # Save the uploaded file temporarily
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        # Run DSP analysis
        result = analyze_audio(temp_file_path, manual_tonic_name=tonic)
        
        # Cleanup
        os.remove(temp_file_path)
        
        return result.dict()
    except Exception as e:
        # Cleanup on error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")

@app.post("/analyze_midi")
async def process_midi(request: MidiRequest):
    try:
        result = analyze_midi_notes(request.notes)
        return result.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing MIDI: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Raga AI Backend!"}

@app.get("/ragas")
def get_ragas():
    import json
    # Try multiple paths: ../data (local dev) and ./data (Docker)
    base_dir = os.path.dirname(__file__)
    candidates = [
        os.path.join(base_dir, "../data/ragas.json"),
        os.path.join(base_dir, "data/ragas.json"),
    ]
    for ragas_path in candidates:
        if os.path.exists(ragas_path):
            try:
                with open(ragas_path, "r") as f:
                    return json.load(f)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error loading ragas: {str(e)}")
    raise HTTPException(status_code=500, detail="ragas.json not found")

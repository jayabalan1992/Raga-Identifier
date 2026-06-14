# Raga AI

Raga AI is a local full-stack web application designed to identify possible Indian classical ragas from uploaded audio or microphone input.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Axios, Lucide React
- **Backend**: Python FastAPI, Librosa, NumPy, SciPy

## Project Structure
- `/frontend`: Next.js web application.
- `/backend`: FastAPI server and audio processing logic.
- `/data`: JSON database of Carnatic ragas and their swaras.

## Setup Instructions (macOS)

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd raga-ai/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd raga-ai/frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

## Features
- **File Upload**: Drag-and-drop or select WAV/MP3 files.
- **Microphone Recording**: Directly sing into your browser.
- **DSP Analysis**: Uses `librosa.pyin` for robust fundamental frequency extraction and tonic (Sa) detection.
- **Swara Mapping**: Maps extracted frequencies to Carnatic swaras (S, R1, R2, G2, G3, M1, M2, P, D1, D2, N2, N3).
- **Raga Matching**: Compares detected swaras against a database and scores matches based on overlap percentage.

## Future Improvements
- **Gamaka Detection**: Implement analysis of pitch contours to detect microtonal oscillations (gamakas), which are crucial for accurate raga identification in Carnatic music.
- **ML Models & CREPE**: Replace `librosa.pyin` with neural pitch trackers like CREPE for higher accuracy in noisy environments.
- **Transformer-based Raga Recognition**: Train an end-to-end deep learning model (e.g., using Audio Spectrogram Transformers) to classify ragas directly from audio rather than relying solely on intermediate swara transcription.
- **Real-time Inference**: Stream audio chunks via WebSockets to the backend for real-time live swara and raga detection.

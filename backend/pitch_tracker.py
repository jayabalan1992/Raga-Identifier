import numpy as np
from basic_pitch.inference import predict

# Vocal range: roughly C2 (65 Hz) to C6 (1047 Hz)
VOCAL_MIN_FREQ = 65.0
VOCAL_MAX_FREQ = 1100.0

# MIDI note boundaries corresponding to vocal range
VOCAL_MIN_MIDI = 36   # C2
VOCAL_MAX_MIDI = 84   # C6

def extract_notes_basic_pitch(
    audio_path: str,
    onset_thresh: float = 0.5,
    frame_thresh: float = 0.3,
    min_note_len_ms: float = 80,
    min_amplitude: float = 0.15,
):
    """
    Extracts discrete MIDI notes from audio using Spotify's Basic-Pitch AMT,
    with tuned thresholds for solo vocal (monophonic) recordings.
    
    Key tuning parameters:
        onset_thresh:    Higher = stricter onset detection, fewer phantom notes (default 0.5)
        frame_thresh:    Higher = requires stronger sustained activation (default 0.3)
        min_note_len_ms: Minimum note duration in ms to keep (default 80ms)
        min_amplitude:   Post-filter: discard notes below this amplitude (default 0.15)
    
    Returns:
        note_events: list of tuples (start_time_s, end_time_s, pitch_midi, amplitude, pitch_bends)
    """
    try:
        # Run the model to get raw activations
        model_output, midi_data, note_events = predict(
            audio_path,
            onset_threshold=onset_thresh,
            frame_threshold=frame_thresh,
            minimum_note_length=min_note_len_ms,
            minimum_frequency=VOCAL_MIN_FREQ,
            maximum_frequency=VOCAL_MAX_FREQ,
        )
        
        if not note_events:
            return []
        
        # Post-filter: remove notes with very low amplitude (likely harmonics/noise)
        filtered = []
        for event in note_events:
            start_time, end_time, pitch_midi, amplitude, pitch_bends = event
            
            # Skip notes outside the vocal MIDI range
            if pitch_midi < VOCAL_MIN_MIDI or pitch_midi > VOCAL_MAX_MIDI:
                continue
            
            # Skip notes with low amplitude (phantom detections)
            if amplitude < min_amplitude:
                continue
            
            filtered.append(event)
        
        return filtered
        
    except Exception as e:
        print(f"Error in basic-pitch extraction: {e}")
        return []

import numpy as np
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from pitch_tracker import extract_notes_basic_pitch
from tonic_detector import detect_tonic_from_midi_notes, get_tonic_from_name
from swara_mapper import map_midi_notes_to_swaras, get_unique_swaras
from raga_matcher import match_ragas, RagaMatch, SwaraInfo

class DebugData(BaseModel):
    # For basic-pitch, we will render a Piano Roll instead of a continuous line
    note_events: List[Dict[str, Any]]
    swara_regions: List[Dict[str, Any]]
    total_notes: int

class AnalysisResult(BaseModel):
    tonic: str
    swaras: List[SwaraInfo]
    arohana_swaras: List[SwaraInfo]
    avarohana_swaras: List[SwaraInfo]
    ragas: List[RagaMatch]
    debug_data: Optional[DebugData] = None

def process_audio_pipeline(file_path: str, manual_tonic_name: Optional[str] = None) -> AnalysisResult:
    """
    Main orchestration function for the vocal pitch tracking pipeline using Spotify's basic-pitch.
    
    1. Extract discrete MIDI notes from audio using basic-pitch
    2. Detect Tonic (if not provided manually) from the most prominent MIDI note
    3. Map MIDI notes to Carnatic Swaras based on exact semitone offset
    4. Match detected swaras against the Raga database
    """
    # 1. Pitch Extraction (AMT) — pitch_tracker now handles amplitude/range filtering
    raw_note_events = extract_notes_basic_pitch(file_path)
    
    if not raw_note_events:
        return AnalysisResult(tonic="Unknown", swaras=[], arohana_swaras=[], avarohana_swaras=[], ragas=[])

    # Filter out very short transient notes (< 0.08s) — likely attack artifacts
    duration_filtered = [e for e in raw_note_events if (e[1] - e[0]) >= 0.08]
    
    if not duration_filtered:
        return AnalysisResult(tonic="Unknown", swaras=[], arohana_swaras=[], avarohana_swaras=[], ragas=[])
    
    # Remove pitch classes with negligible total presence.
    # If a pitch class accounts for < 3% of total sounding time, it's likely
    # a misdetection (harmonic, noise) rather than an intentionally sung note.
    pc_total_duration = np.zeros(12)
    for e in duration_filtered:
        pc = int(e[2]) % 12
        pc_total_duration[pc] += (e[1] - e[0])
    
    total_sounding = pc_total_duration.sum()
    min_pc_fraction = 0.03  # 3% of total sounding time
    
    significant_pcs = set()
    for pc in range(12):
        if total_sounding > 0 and (pc_total_duration[pc] / total_sounding) >= min_pc_fraction:
            significant_pcs.add(pc)
    
    filtered_note_events = [
        e for e in duration_filtered
        if (int(e[2]) % 12) in significant_pcs
    ]
    
    if not filtered_note_events:
        return AnalysisResult(tonic="Unknown", swaras=[], arohana_swaras=[], avarohana_swaras=[], ragas=[])

    # 2. Tonic Detection
    if manual_tonic_name:
        tonic_name = manual_tonic_name
        tonic_pc = get_tonic_from_name(tonic_name)
    else:
        tonic_name, tonic_pc = detect_tonic_from_midi_notes(filtered_note_events)

    # 3. Swara Mapping
    swara_regions = map_midi_notes_to_swaras(filtered_note_events, tonic_pc)
    
    # Get unique swaras for database matching
    unique_swaras_info = get_unique_swaras(swara_regions, tonic_pc)
    detected_swara_names = [s["swara"] for s in unique_swaras_info]
    
    # 4. Raga Matching
    top_ragas = match_ragas(detected_swara_names, tonic_pc)

    # Prepare debug data for frontend Piano Roll
    serialized_notes = [
        {
            "start_time": round(e[0], 3),
            "end_time": round(e[1], 3),
            "duration": round(e[1] - e[0], 3),
            "midi_pitch": int(e[2])
        }
        for e in filtered_note_events
    ]

    debug_data = DebugData(
        note_events=serialized_notes,
        swara_regions=swara_regions,
        total_notes=len(filtered_note_events)
    )

    return AnalysisResult(
        tonic=tonic_name,
        swaras=unique_swaras_info,
        arohana_swaras=unique_swaras_info,  # Flat list for audio
        avarohana_swaras=unique_swaras_info,
        ragas=top_ragas,
        debug_data=debug_data
    )

# Alias for backwards compatibility with main.py
def analyze_audio(file_path: str, manual_tonic_name: Optional[str] = None) -> AnalysisResult:
    return process_audio_pipeline(file_path, manual_tonic_name)

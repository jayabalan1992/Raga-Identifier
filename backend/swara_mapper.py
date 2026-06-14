import numpy as np

# Ideal semitone offsets from Tonic for each Swara
SWARA_IDEAL_SEMITONES = {
    'S': 0, 'R1': 1, 'R2': 2, 'R3': 3,
    'G1': 2, 'G2': 3, 'G3': 4,
    'M1': 5, 'M2': 6,
    'P': 7,
    'D1': 8, 'D2': 9, 'D3': 10,
    'N1': 9, 'N2': 10, 'N3': 11,
}

# The 12 standard positions. We prioritize primary Carnatic names.
PRIMARY_SWARAS = {
    0: 'S', 1: 'R1', 2: 'R2', 3: 'G2', 4: 'G3', 5: 'M1',
    6: 'M2', 7: 'P', 8: 'D1', 9: 'D2', 10: 'N2', 11: 'N3'
}

PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def map_midi_notes_to_swaras(note_events, tonic_pc):
    """
    Maps a list of MIDI note events from basic-pitch to Carnatic Swaras.
    
    Args:
        note_events: list of (start_time, end_time, pitch_midi, amplitude, pitch_bends)
        tonic_pc: integer (0-11) representing the Pitch Class of the Tonic
        
    Returns:
        swara_regions: list of dicts with swara and timing info
    """
    swara_regions = []
    
    for event in note_events:
        start_time, end_time, pitch_midi, amplitude, pitch_bends = event
        duration = end_time - start_time
        
        # Calculate semitone offset from the tonic
        note_pc = pitch_midi % 12
        semitone_offset = (note_pc - tonic_pc) % 12
        
        swara = PRIMARY_SWARAS.get(semitone_offset)
        if swara:
            swara_regions.append({
                "swara": swara,
                "start_time": round(start_time, 3),
                "end_time": round(end_time, 3),
                "duration": round(duration, 3),
                "midi_pitch": int(pitch_midi)
            })
            
    # Optional: Merge adjacent notes of the same Swara if the gap is tiny (<0.05s)
    # basic-pitch is usually good about segmentation, but sometimes breaks up long notes.
    merged = []
    for region in sorted(swara_regions, key=lambda x: x["start_time"]):
        if merged and merged[-1]["swara"] == region["swara"]:
            gap = region["start_time"] - merged[-1]["end_time"]
            if gap < 0.1:  # Less than 100ms gap
                merged[-1]["end_time"] = region["end_time"]
                merged[-1]["duration"] = round(merged[-1]["end_time"] - merged[-1]["start_time"], 3)
                continue
        merged.append(region)
        
    return merged

def get_unique_swaras(swara_regions, tonic_pc):
    """
    Extracts a unique set of swaras detected in the audio and attaches Western notes to them.
    Used for raga matching and frontend display.
    """
    unique_swara_names = set(r["swara"] for r in swara_regions)
    
    # We always include Sa
    unique_swara_names.add('S')
    
    results = []
    for swara in sorted(unique_swara_names, key=lambda x: SWARA_IDEAL_SEMITONES.get(x, 0)):
        semitone = SWARA_IDEAL_SEMITONES.get(swara, 0)
        western_note = PITCH_CLASS_NAMES[(tonic_pc + semitone) % 12]
        results.append({
            "swara": swara,
            "western_note": western_note
        })
        
    return results

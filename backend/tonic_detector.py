import numpy as np

PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def detect_tonic_from_midi_notes(note_events):
    """
    Detects the tonic (Sa) from a list of basic-pitch note events using a
    multi-factor heuristic combining:
    
      1. Duration weight:   How long each pitch class is sustained in total.
      2. Frequency weight:  How many separate note events land on each pitch class.
      3. Phrase-boundary:   Bonus for notes that start/end phrases (singers tend
                            to begin and resolve on Sa).
      4. Lowest-octave:     Slight bonus if the pitch class appears as one of the
                            lowest notes (Sa is often the base).
    
    Args:
        note_events: list of (start_time, end_time, pitch_midi, amplitude, pitch_bends)
        
    Returns:
        tonic_name: string (e.g. 'C', 'D#')
        tonic_pc: int (0-11)
    """
    if not note_events:
        return "C", 0
    
    # Sort by start time for phrase analysis
    sorted_events = sorted(note_events, key=lambda e: e[0])
    
    # --- Factor 1: Duration-weighted histogram ---
    pc_duration = np.zeros(12)
    for event in sorted_events:
        start_time, end_time, pitch_midi, amplitude, pitch_bends = event
        duration = end_time - start_time
        pc = int(pitch_midi) % 12
        pc_duration[pc] += duration
    
    # --- Factor 2: Occurrence count ---
    pc_count = np.zeros(12)
    for event in sorted_events:
        pc = int(event[2]) % 12
        pc_count[pc] += 1
    
    # --- Factor 3: Phrase boundary bonus ---
    # The first note and last note of the recording are strong tonic candidates
    pc_boundary = np.zeros(12)
    if sorted_events:
        first_pc = int(sorted_events[0][2]) % 12
        last_pc = int(sorted_events[-1][2]) % 12
        pc_boundary[first_pc] += 2.0
        pc_boundary[last_pc] += 1.5
        
        # Also check the first few and last few notes for consistency
        head = sorted_events[:min(3, len(sorted_events))]
        tail = sorted_events[-min(3, len(sorted_events)):]
        for e in head:
            pc_boundary[int(e[2]) % 12] += 0.5
        for e in tail:
            pc_boundary[int(e[2]) % 12] += 0.3
    
    # --- Factor 4: Lowest-pitch bonus ---
    # Sa is typically one of the lower notes sung
    pc_lowest = np.zeros(12)
    if sorted_events:
        all_pitches = [int(e[2]) for e in sorted_events]
        min_pitch = min(all_pitches)
        # Give bonus to pitch classes near the lowest note
        for e in sorted_events:
            midi = int(e[2])
            if midi <= min_pitch + 2:  # Within 2 semitones of the lowest
                pc_lowest[midi % 12] += 1.0
    
    # --- Combine factors ---
    # Normalize each factor to [0, 1] range
    def normalize(arr):
        mx = arr.max()
        if mx > 0:
            return arr / mx
        return arr
    
    combined = (
        0.35 * normalize(pc_duration) +
        0.20 * normalize(pc_count) +
        0.30 * normalize(pc_boundary) +
        0.15 * normalize(pc_lowest)
    )
    
    tonic_pc = int(np.argmax(combined))
    tonic_name = PITCH_CLASS_NAMES[tonic_pc]
    
    return tonic_name, tonic_pc

def get_tonic_from_name(tonic_name: str):
    """
    Returns the pitch class (0-11) for a given note name.
    """
    try:
        return PITCH_CLASS_NAMES.index(tonic_name)
    except ValueError:
        return 0 # Default to C

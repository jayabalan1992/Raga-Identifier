import os
import json
import numpy as np
from pydantic import BaseModel
from typing import List, Optional

class SwaraInfo(BaseModel):
    swara: str
    western_note: str

class RagaMatch(BaseModel):
    name: str
    confidence: float
    id: Optional[int] = None
    chakra: Optional[str] = None
    raga_type: Optional[str] = None
    parent_name: Optional[str] = None
    arohana_swaras: List[SwaraInfo] = []
    avarohana_swaras: List[SwaraInfo] = []

class AnalysisResult(BaseModel):
    tonic: str
    swaras: List[SwaraInfo]
    arohana_swaras: List[SwaraInfo]
    avarohana_swaras: List[SwaraInfo]
    ragas: List[RagaMatch]

# Maps semitone offset from tonic to a default swara name
SEMITONE_TO_SWARA = {
    0: 'S', 1: 'R1', 2: 'R2', 3: 'G2', 4: 'G3', 5: 'M1',
    6: 'M2', 7: 'P', 8: 'D1', 9: 'D2', 10: 'N2', 11: 'N3'
}

# Maps ALL Carnatic swara names to their semitone offset
SWARA_TO_SEMITONE = {
    'S': 0,
    'R1': 1, 'R2': 2, 'R3': 3,
    'G1': 2, 'G2': 3, 'G3': 4,
    'M1': 5, 'M2': 6,
    'P': 7,
    'D1': 8, 'D2': 9, 'D3': 10,
    'N1': 9, 'N2': 10, 'N3': 11,
}

PITCH_CLASS_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

def load_ragas(file_path: str = None):
    if file_path is None:
        base_dir = os.path.dirname(__file__)
        candidates = [
            os.path.join(base_dir, "../data/ragas.json"),
            os.path.join(base_dir, "data/ragas.json"),
        ]
        for path in candidates:
            if os.path.exists(path):
                file_path = path
                break
        if not file_path:
            file_path = os.path.join(base_dir, "../data/ragas.json") # Fallback to error naturally

    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading ragas: {e}")
        return []

def swara_list_to_semitones(swaras):
    """Convert a list of swara names to a set of semitone offsets (deduped, ignoring order)."""
    return set(SWARA_TO_SEMITONE.get(s, -1) for s in swaras if s in SWARA_TO_SEMITONE) - {-1}

def swara_to_western(swara_name, tonic_pc):
    """Convert a Carnatic swara to its Western note name given a tonic pitch class."""
    semitone = SWARA_TO_SEMITONE.get(swara_name, 0)
    note_pc = (tonic_pc + semitone) % 12
    return PITCH_CLASS_NAMES[note_pc]

def split_ascending_descending(notes):
    """
    Split a sequence of MIDI notes into ascending phrases and descending phrases.
    Returns (ascending_notes, descending_notes) as lists.
    """
    if len(notes) < 2:
        return notes, notes

    ascending = []
    descending = []

    for i in range(len(notes)):
        if i == 0:
            # First note goes to both
            ascending.append(notes[i])
            descending.append(notes[i])
        else:
            if notes[i] >= notes[i-1]:
                ascending.append(notes[i])
            else:
                descending.append(notes[i])

    return ascending, descending

def analyze_midi_notes(notes: List[int]) -> AnalysisResult:
    if not notes:
        return AnalysisResult(tonic="Unknown", swaras=[], arohana_swaras=[], avarohana_swaras=[], ragas=[])

    # Use the first note played as the Tonic (Sa)
    tonic_pc = notes[0] % 12
    tonic_name = PITCH_CLASS_NAMES[tonic_pc]

    # Split into ascending and descending phrases
    asc_notes, desc_notes = split_ascending_descending(notes)

    # Convert to semitone offsets from tonic
    all_semitones = set((n - notes[0]) % 12 for n in notes)
    asc_semitones = set((n - notes[0]) % 12 for n in asc_notes) if asc_notes else set()
    desc_semitones = set((n - notes[0]) % 12 for n in desc_notes) if desc_notes else set()

    # Ensure Sa is always present
    all_semitones.add(0)
    asc_semitones.add(0)
    desc_semitones.add(0)

    # Map semitones to default swara names for display
    detected_swaras = sorted(all_semitones)
    detected_asc = sorted(asc_semitones)
    detected_desc = sorted(desc_semitones)

    def semitones_to_swara_info(semitone_list):
        result = []
        for st in semitone_list:
            swara = SEMITONE_TO_SWARA.get(st, '?')
            western = PITCH_CLASS_NAMES[(tonic_pc + st) % 12]
            result.append(SwaraInfo(swara=swara, western_note=western))
        return result

    swara_info_all = semitones_to_swara_info(detected_swaras)
    swara_info_asc = semitones_to_swara_info(detected_asc)
    swara_info_desc = semitones_to_swara_info(detected_desc)

    # Raga Matching
    ragas_db = load_ragas()

    # Build parent name lookup
    parent_names = {}
    for r in ragas_db:
        if r.get("id") is not None:
            parent_names[r["id"]] = r["name"]

    raga_scores = []

    for raga in ragas_db:
        arohana = raga.get("arohana", [])
        avarohana = raga.get("avarohana", [])

        raga_aro_semitones = swara_list_to_semitones(arohana)
        raga_ava_semitones = swara_list_to_semitones(avarohana)
        raga_all_semitones = raga_aro_semitones | raga_ava_semitones

        # Score arohana match
        if raga_aro_semitones:
            aro_common = raga_aro_semitones & asc_semitones
            aro_extra = asc_semitones - raga_aro_semitones
            aro_score = len(aro_common) / len(raga_aro_semitones)
            aro_penalty = len(aro_extra) * 0.1
        else:
            aro_score = 0.0
            aro_penalty = 0.0

        # Score avarohana match
        if raga_ava_semitones:
            ava_common = raga_ava_semitones & desc_semitones
            ava_extra = desc_semitones - raga_ava_semitones
            ava_score = len(ava_common) / len(raga_ava_semitones)
            ava_penalty = len(ava_extra) * 0.1
        else:
            ava_score = 0.0
            ava_penalty = 0.0

        # Combined confidence: weighted average of arohana and avarohana scores
        combined_score = (aro_score + ava_score) / 2.0
        combined_penalty = (aro_penalty + ava_penalty) / 2.0
        confidence = max(0.0, combined_score - combined_penalty) * 100

        # Build swara info for this raga's arohana and avarohana
        aro_swara_infos = [SwaraInfo(swara=s, western_note=swara_to_western(s, tonic_pc)) for s in arohana if s in SWARA_TO_SEMITONE]
        ava_swara_infos = [SwaraInfo(swara=s, western_note=swara_to_western(s, tonic_pc)) for s in avarohana if s in SWARA_TO_SEMITONE]

        parent_id = raga.get("parent_id")
        raga_scores.append({
            "name": raga.get("name", "Unknown"),
            "confidence": round(confidence, 2),
            "id": raga.get("id"),
            "chakra": raga.get("chakra"),
            "raga_type": raga.get("type"),
            "parent_name": parent_names.get(parent_id) if parent_id else None,
            "arohana_swaras": aro_swara_infos,
            "avarohana_swaras": ava_swara_infos,
        })

    raga_scores.sort(key=lambda x: x["confidence"], reverse=True)
    top_ragas = [RagaMatch(**r) for r in raga_scores[:5]]

    return AnalysisResult(
        tonic=tonic_name,
        swaras=swara_info_all,
        arohana_swaras=swara_info_asc,
        avarohana_swaras=swara_info_desc,
        ragas=top_ragas,
    )

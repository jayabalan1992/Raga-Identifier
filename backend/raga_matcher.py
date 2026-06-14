import os
import json
from pydantic import BaseModel
from typing import List, Optional
from swara_mapper import SWARA_IDEAL_SEMITONES, PITCH_CLASS_NAMES

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

def load_ragas(file_path: str = "../data/ragas.json"):
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading ragas: {e}")
        return []

def swara_list_to_semitones(swaras):
    """Convert a list of swara names to a set of semitone offsets."""
    return set(SWARA_IDEAL_SEMITONES.get(s, -1) for s in swaras if s in SWARA_IDEAL_SEMITONES) - {-1}

def get_western_note(swara_name, tonic_pc):
    """Convert a Carnatic swara to its Western note name given a tonic pitch class."""
    semitone = SWARA_IDEAL_SEMITONES.get(swara_name, 0)
    note_pc = (tonic_pc + semitone) % 12
    return PITCH_CLASS_NAMES[note_pc]

def match_ragas(detected_swara_names, tonic_pc, top_n=5):
    """
    Matches detected swaras against the raga database using F1-score.
    
    Scoring uses:
      - Recall:    What fraction of the raga's notes did we detect?
      - Precision: What fraction of detected notes belong to this raga?
      - F1 Score:  Harmonic mean of precision and recall.
    
    This ensures:
      - An exact match (same notes) scores ~100%
      - A raga that is a subset of detected notes scores lower (low precision)
      - A raga that is a superset of detected notes scores lower (low recall)
      - Completely unrelated ragas score near 0%
    """
    ragas_db = load_ragas(os.path.join(os.path.dirname(__file__), "../data/ragas.json"))
    
    parent_names = {}
    for r in ragas_db:
        if r.get("id") is not None:
            parent_names[r["id"]] = r["name"]

    raga_scores = []
    detected_semitones = swara_list_to_semitones(detected_swara_names)
    
    # Always remove Sa (0) from the comparison since every raga has it
    # and it would artificially inflate scores for small ragas
    detected_for_match = detected_semitones - {0}

    for raga in ragas_db:
        arohana = raga.get("arohana", [])
        avarohana = raga.get("avarohana", [])
        raga_all_semitones = swara_list_to_semitones(arohana) | swara_list_to_semitones(avarohana)
        raga_for_match = raga_all_semitones - {0}

        if raga_for_match and detected_for_match:
            common = raga_for_match & detected_for_match
            
            # Recall: how many of the raga's notes did we find?
            recall = len(common) / len(raga_for_match)
            
            # Precision: how many of our detected notes are in this raga?
            precision = len(common) / len(detected_for_match)
            
            # F1 Score: harmonic mean of precision and recall
            if precision + recall > 0:
                f1 = 2 * (precision * recall) / (precision + recall)
            else:
                f1 = 0.0
            
            # Bonus: if it's an exact match (same note set), boost slightly
            if raga_for_match == detected_for_match:
                f1 = min(1.0, f1 * 1.05)
            
            confidence = round(f1 * 100, 2)
        else:
            confidence = 0.0

        aro_swara_infos = [SwaraInfo(swara=s, western_note=get_western_note(s, tonic_pc)) for s in arohana if s in SWARA_IDEAL_SEMITONES]
        ava_swara_infos = [SwaraInfo(swara=s, western_note=get_western_note(s, tonic_pc)) for s in avarohana if s in SWARA_IDEAL_SEMITONES]

        parent_id = raga.get("parent_id")
        raga_scores.append({
            "name": raga.get("name", "Unknown"),
            "confidence": confidence,
            "id": raga.get("id"),
            "chakra": raga.get("chakra"),
            "raga_type": raga.get("type"),
            "parent_name": parent_names.get(parent_id) if parent_id else None,
            "arohana_swaras": aro_swara_infos,
            "avarohana_swaras": ava_swara_infos,
        })

    raga_scores.sort(key=lambda x: x["confidence"], reverse=True)
    return [RagaMatch(**r) for r in raga_scores[:top_n]]

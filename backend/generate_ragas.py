#!/usr/bin/env python3
"""Generate comprehensive ragas.json with arohana/avarohana format."""
import json

# --- 72 Melakarta Ragas (read from existing data and convert) ---
MELAKARTA_DATA = [
    (1, "Indu", "Kanakangi", ["S","R1","G1","M1","P","D1","N1"]),
    (2, "Indu", "Ratnangi", ["S","R1","G1","M1","P","D1","N2"]),
    (3, "Indu", "Ganamurti", ["S","R1","G1","M1","P","D1","N3"]),
    (4, "Indu", "Vanaspati", ["S","R1","G1","M1","P","D2","N2"]),
    (5, "Indu", "Manavati", ["S","R1","G1","M1","P","D2","N3"]),
    (6, "Indu", "Tanarupi", ["S","R1","G1","M1","P","D3","N3"]),
    (7, "Netra", "Senavati", ["S","R1","G2","M1","P","D1","N1"]),
    (8, "Netra", "Hanumatodi", ["S","R1","G2","M1","P","D1","N2"]),
    (9, "Netra", "Dhenuka", ["S","R1","G2","M1","P","D1","N3"]),
    (10, "Netra", "Natakapriya", ["S","R1","G2","M1","P","D2","N2"]),
    (11, "Netra", "Kokilapriya", ["S","R1","G2","M1","P","D2","N3"]),
    (12, "Netra", "Rupavati", ["S","R1","G2","M1","P","D3","N3"]),
    (13, "Agni", "Gayakapriya", ["S","R1","G3","M1","P","D1","N1"]),
    (14, "Agni", "Vakulabharanam", ["S","R1","G3","M1","P","D1","N2"]),
    (15, "Agni", "Mayamalavagowla", ["S","R1","G3","M1","P","D1","N3"]),
    (16, "Agni", "Chakravakam", ["S","R1","G3","M1","P","D2","N2"]),
    (17, "Agni", "Suryakantam", ["S","R1","G3","M1","P","D2","N3"]),
    (18, "Agni", "Hatakambari", ["S","R1","G3","M1","P","D3","N3"]),
    (19, "Veda", "Jhankaradhvani", ["S","R2","G2","M1","P","D1","N1"]),
    (20, "Veda", "Natabhairavi", ["S","R2","G2","M1","P","D1","N2"]),
    (21, "Veda", "Keeravani", ["S","R2","G2","M1","P","D1","N3"]),
    (22, "Veda", "Kharaharapriya", ["S","R2","G2","M1","P","D2","N2"]),
    (23, "Veda", "Gaurimanohari", ["S","R2","G2","M1","P","D2","N3"]),
    (24, "Veda", "Varunapriya", ["S","R2","G2","M1","P","D3","N3"]),
    (25, "Bana", "Mararanjani", ["S","R2","G3","M1","P","D1","N1"]),
    (26, "Bana", "Charukesi", ["S","R2","G3","M1","P","D1","N2"]),
    (27, "Bana", "Sarasangi", ["S","R2","G3","M1","P","D1","N3"]),
    (28, "Bana", "Harikambhoji", ["S","R2","G3","M1","P","D2","N2"]),
    (29, "Bana", "Dheerasankarabharanam", ["S","R2","G3","M1","P","D2","N3"]),
    (30, "Bana", "Naganandini", ["S","R2","G3","M1","P","D3","N3"]),
    (31, "Ritu", "Yagapriya", ["S","R3","G3","M1","P","D1","N1"]),
    (32, "Ritu", "Ragavardhani", ["S","R3","G3","M1","P","D1","N2"]),
    (33, "Ritu", "Gangeyabhushani", ["S","R3","G3","M1","P","D1","N3"]),
    (34, "Ritu", "Vagadheeswari", ["S","R3","G3","M1","P","D2","N2"]),
    (35, "Ritu", "Shulini", ["S","R3","G3","M1","P","D2","N3"]),
    (36, "Ritu", "Chalanata", ["S","R3","G3","M1","P","D3","N3"]),
    (37, "Rishi", "Salagam", ["S","R1","G1","M2","P","D1","N1"]),
    (38, "Rishi", "Jalarnavam", ["S","R1","G1","M2","P","D1","N2"]),
    (39, "Rishi", "Jhalavarali", ["S","R1","G1","M2","P","D1","N3"]),
    (40, "Rishi", "Navaneetam", ["S","R1","G1","M2","P","D2","N2"]),
    (41, "Rishi", "Pavani", ["S","R1","G1","M2","P","D2","N3"]),
    (42, "Rishi", "Raghupriya", ["S","R1","G1","M2","P","D3","N3"]),
    (43, "Vasu", "Gavambhodi", ["S","R1","G2","M2","P","D1","N1"]),
    (44, "Vasu", "Bhavapriya", ["S","R1","G2","M2","P","D1","N2"]),
    (45, "Vasu", "Shubhapantuvarali", ["S","R1","G2","M2","P","D1","N3"]),
    (46, "Vasu", "Shadvidamargini", ["S","R1","G2","M2","P","D2","N2"]),
    (47, "Vasu", "Suvarnangi", ["S","R1","G2","M2","P","D2","N3"]),
    (48, "Vasu", "Divyamani", ["S","R1","G2","M2","P","D3","N3"]),
    (49, "Brahma", "Dhavalambari", ["S","R1","G3","M2","P","D1","N1"]),
    (50, "Brahma", "Namanarayani", ["S","R1","G3","M2","P","D1","N2"]),
    (51, "Brahma", "Kamavardhini", ["S","R1","G3","M2","P","D1","N3"]),
    (52, "Brahma", "Ramapriya", ["S","R1","G3","M2","P","D2","N2"]),
    (53, "Brahma", "Gamanashrama", ["S","R1","G3","M2","P","D2","N3"]),
    (54, "Brahma", "Vishwambhari", ["S","R1","G3","M2","P","D3","N3"]),
    (55, "Disi", "Shyamalangi", ["S","R2","G2","M2","P","D1","N1"]),
    (56, "Disi", "Shanmukhapriya", ["S","R2","G2","M2","P","D1","N2"]),
    (57, "Disi", "Simhendramadhyamam", ["S","R2","G2","M2","P","D1","N3"]),
    (58, "Disi", "Hemavati", ["S","R2","G2","M2","P","D2","N2"]),
    (59, "Disi", "Dharmavati", ["S","R2","G2","M2","P","D2","N3"]),
    (60, "Disi", "Neetimati", ["S","R2","G2","M2","P","D3","N3"]),
    (61, "Rudra", "Kantamani", ["S","R2","G3","M2","P","D1","N1"]),
    (62, "Rudra", "Rishabhapriya", ["S","R2","G3","M2","P","D1","N2"]),
    (63, "Rudra", "Latangi", ["S","R2","G3","M2","P","D1","N3"]),
    (64, "Rudra", "Vachaspati", ["S","R2","G3","M2","P","D2","N2"]),
    (65, "Rudra", "Mechakalyani", ["S","R2","G3","M2","P","D2","N3"]),
    (66, "Rudra", "Chitrambari", ["S","R2","G3","M2","P","D3","N3"]),
    (67, "Aditya", "Sucharitra", ["S","R3","G3","M2","P","D1","N1"]),
    (68, "Aditya", "Jyotiswarupini", ["S","R3","G3","M2","P","D1","N2"]),
    (69, "Aditya", "Dhatuvardhani", ["S","R3","G3","M2","P","D1","N3"]),
    (70, "Aditya", "Nasikabhushani", ["S","R3","G3","M2","P","D2","N2"]),
    (71, "Aditya", "Kosalam", ["S","R3","G3","M2","P","D2","N3"]),
    (72, "Aditya", "Rasikapriya", ["S","R3","G3","M2","P","D3","N3"]),
]

# --- Popular Janya Ragas ---
# Format: (name, parent_id, arohana, avarohana)
JANYA_DATA = [
    # --- From Melakarta 8: Hanumatodi ---
    ("Todi", 8, ["S","R1","G2","M1","P","D1","N2","S"], ["S","N2","D1","P","M1","G2","R1","S"]),
    ("Darbari Kanada", 8, ["S","R1","G2","M1","P","D1","N2","S"], ["S","N2","D1","P","M1","G2","R1","S"]),

    # --- From Melakarta 15: Mayamalavagowla ---
    ("Malahari", 15, ["S","R1","M1","P","D1","S"], ["S","D1","P","M1","G3","R1","S"]),
    ("Saveri", 15, ["S","R1","M1","P","D1","S"], ["S","N3","D1","P","M1","G3","R1","S"]),
    ("Bowli", 15, ["S","R1","G3","P","S"], ["S","P","G3","R1","S"]),
    ("Revagupti", 15, ["S","R1","M1","P","N3","S"], ["S","N3","P","M1","R1","S"]),
    ("Lalitha", 15, ["S","R1","G3","M1","D1","N3","S"], ["S","N3","D1","M1","G3","R1","S"]),
    ("Gowla", 15, ["S","R1","G3","M1","P","S"], ["S","P","M1","G3","R1","S"]),

    # --- From Melakarta 17: Suryakantam ---
    ("Vasanta", 17, ["S","G3","M1","D2","N3","S"], ["S","N3","D2","M1","G3","R1","S"]),

    # --- From Melakarta 20: Natabhairavi ---
    ("Hindolam", 20, ["S","G2","M1","D1","N2","S"], ["S","N2","D1","M1","G2","S"]),
    ("Shuddha Dhanyasi", 20, ["S","G2","M1","P","N2","S"], ["S","N2","P","M1","G2","S"]),
    ("Bhairavi", 20, ["S","R2","G2","M1","P","D1","N2","S"], ["S","N2","D1","P","M1","G2","R2","S"]),
    ("Jonpuri", 20, ["S","R2","G2","M1","P","D1","N2","S"], ["S","N2","D1","P","M1","G2","R2","S"]),

    # --- From Melakarta 21: Keeravani ---
    ("Kiravani", 21, ["S","R2","G2","M1","P","D1","N3","S"], ["S","N3","D1","P","M1","G2","R2","S"]),

    # --- From Melakarta 22: Kharaharapriya ---
    ("Abhogi", 22, ["S","R2","G2","M1","D2","S"], ["S","D2","M1","G2","R2","S"]),
    ("Sri Ranjani", 22, ["S","R2","G2","M1","N2","S"], ["S","N2","M1","G2","R2","S"]),
    ("Madhyamavati", 22, ["S","R2","M1","P","N2","S"], ["S","N2","P","M1","R2","S"]),
    ("Kapi", 22, ["S","R2","G2","M1","P","D2","N2","S"], ["S","N2","D2","P","M1","G2","R2","S"]),
    ("Sree", 22, ["S","R2","M1","P","N2","S"], ["S","N2","P","D2","M1","G2","R2","S"]),
    ("Reethi Gowla", 22, ["S","G2","R2","G2","M1","N2","S"], ["S","N2","D2","M1","G2","R2","S"]),

    # --- From Melakarta 28: Harikambhoji ---
    ("Mohanam", 28, ["S","R2","G3","P","D2","S"], ["S","D2","P","G3","R2","S"]),
    ("Kambhoji", 28, ["S","R2","G3","M1","P","D2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Yadukula Kambhoji", 28, ["S","R2","M1","P","D2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Surutti", 28, ["S","R2","M1","P","D2","N2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Khamas", 28, ["S","G3","M1","P","D2","N2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Sahana", 28, ["S","R2","G3","M1","P","D2","N2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Nattai Kurinji", 28, ["S","R2","G3","M1","P","D2","N2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Kedaram", 28, ["S","R2","G3","M1","P","D2","S"], ["S","D2","P","M1","G3","R2","S"]),
    ("Nalinakanthi", 28, ["S","G3","M1","P","N2","S"], ["S","N2","D2","P","M1","G3","R2","S"]),
    ("Shuddha Saveri", 28, ["S","R2","M1","P","D2","S"], ["S","D2","P","M1","R2","S"]),

    # --- From Melakarta 29: Dheerasankarabharanam (Shankarabharanam) ---
    ("Hamsadhwani", 29, ["S","R2","G3","P","N3","S"], ["S","N3","P","G3","R2","S"]),
    ("Bilahari", 29, ["S","R2","G3","P","D2","S"], ["S","N3","D2","P","M1","G3","R2","S"]),
    ("Arabhi", 29, ["S","R2","M1","P","D2","S"], ["S","N3","D2","P","M1","G3","R2","S"]),
    ("Devagandhari", 29, ["S","R2","M1","P","D2","N3","S"], ["S","N3","D2","P","M1","G3","R2","S"]),
    ("Hamsanandi", 29, ["S","R2","M1","P","N3","S"], ["S","N3","P","M1","R2","S"]),
    ("Shankarabharanam", 29, ["S","R2","G3","M1","P","D2","N3","S"], ["S","N3","D2","P","M1","G3","R2","S"]),
    ("Kaanada", 29, ["S","R2","M1","P","N3","D2","S"], ["S","N3","P","M1","G3","R2","S"]),
    ("Neelambari", 29, ["S","G3","M1","P","D2","N3","S"], ["S","N3","D2","P","M1","G3","R2","S"]),
    ("Valaji", 29, ["S","G3","P","D2","N3","S"], ["S","N3","D2","P","G3","S"]),

    # --- From Melakarta 36: Chalanata ---
    ("Gambhiranata", 36, ["S","R3","G3","P","D3","S"], ["S","D3","P","G3","R3","S"]),

    # --- From Melakarta 45: Shubhapantuvarali ---
    ("Shubhapantuvarali", 45, ["S","R1","G2","M2","P","D1","N3","S"], ["S","N3","D1","P","M2","G2","R1","S"]),

    # --- From Melakarta 51: Kamavardhini (Pantuvarali) ---
    ("Pantuvarali", 51, ["S","R1","G3","M2","P","D1","N3","S"], ["S","N3","D1","P","M2","G3","R1","S"]),

    # --- From Melakarta 56: Shanmukhapriya ---
    ("Chinthamani", 56, ["S","R2","G2","M2","D1","N2","S"], ["S","N2","D1","M2","G2","R2","S"]),

    # --- From Melakarta 57: Simhendramadhyamam ---
    ("Madhuvanti", 57, ["S","R2","G2","M2","P","D1","N3","S"], ["S","N3","D1","P","M2","G2","R2","S"]),

    # --- From Melakarta 65: Mechakalyani (Kalyani) ---
    ("Kalyani", 65, ["S","R2","G3","M2","P","D2","N3","S"], ["S","N3","D2","P","M2","G3","R2","S"]),
    ("Mohana Kalyani", 65, ["S","R2","G3","P","D2","N3","S"], ["S","N3","D2","P","G3","R2","S"]),
    ("Saranga", 65, ["S","R2","M2","P","N3","S"], ["S","N3","P","M2","R2","S"]),
    ("Amritavarshini", 65, ["S","G3","M2","P","N3","S"], ["S","N3","P","M2","G3","S"]),
    ("Hameer Kalyani", 65, ["S","R2","G3","M2","P","D2","N3","S"], ["S","N3","D2","P","M2","G3","R2","S"]),
    ("Saraswati", 65, ["S","R2","M2","P","D2","N3","S"], ["S","N3","D2","P","M2","R2","S"]),
    ("Sunadavinodini", 65, ["S","R2","G3","M2","D2","N3","S"], ["S","N3","D2","M2","G3","R2","S"]),

    # --- From Melakarta 64: Vachaspati ---
    ("Reetigowla", 64, ["S","G3","R2","G3","M2","N2","S"], ["S","N2","M2","G3","R2","S"]),

    # --- From Melakarta 63: Latangi ---
    ("Latangi", 63, ["S","R2","G3","M2","P","D1","N3","S"], ["S","N3","D1","P","M2","G3","R2","S"]),
]


def build_ragas():
    ragas = []

    # Add all 72 Melakartas
    for mid, chakra, name, swaras in MELAKARTA_DATA:
        arohana = swaras + ["S"]
        avarohana = ["S"] + list(reversed(swaras[1:])) + ["S"]
        ragas.append({
            "id": mid,
            "name": name,
            "type": "melakarta",
            "chakra": chakra,
            "parent_id": None,
            "arohana": arohana,
            "avarohana": avarohana,
        })

    # Add Janya Ragas
    for name, parent_id, arohana, avarohana in JANYA_DATA:
        ragas.append({
            "id": None,
            "name": name,
            "type": "janya",
            "chakra": None,
            "parent_id": parent_id,
            "arohana": arohana,
            "avarohana": avarohana,
        })

    return ragas


if __name__ == "__main__":
    ragas = build_ragas()
    output_path = "../data/ragas.json"
    with open(output_path, "w") as f:
        json.dump(ragas, f, indent=2, ensure_ascii=False)
    print(f"Generated {len(ragas)} ragas ({sum(1 for r in ragas if r['type']=='melakarta')} melakarta + {sum(1 for r in ragas if r['type']=='janya')} janya)")

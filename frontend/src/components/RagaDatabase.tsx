import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Music, ArrowUp, ArrowDown } from 'lucide-react';
import PianoKeyboard from './PianoKeyboard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Raga {
  id: number | null;
  name: string;
  type: string;
  chakra: string | null;
  parent_id: number | null;
  arohana: string[];
  avarohana: string[];
}

const SWARA_TO_SEMITONE: Record<string, number> = {
  'S': 0, 'R1': 1, 'R2': 2, 'R3': 3,
  'G1': 2, 'G2': 3, 'G3': 4,
  'M1': 5, 'M2': 6, 'P': 7,
  'D1': 8, 'D2': 9, 'D3': 10,
  'N1': 9, 'N2': 10, 'N3': 11,
};

export default function RagaDatabase() {
  const [ragas, setRagas] = useState<Raga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaga, setSelectedRaga] = useState<Raga | null>(null);
  
  // For reverse search by clicking keyboard
  const [selectedNotes, setSelectedNotes] = useState<number[]>([0]); // Default to Sa selected
  const [reverseMatches, setReverseMatches] = useState<Raga[]>([]);
  const [isReverseSearch, setIsReverseSearch] = useState(false);

  useEffect(() => {
    const fetchRagas = async () => {
      try {
        const response = await axios.get(`${API_URL}/ragas`);
        setRagas(response.data);
      } catch (err) {
        console.error('Error fetching ragas', err);
      }
    };
    fetchRagas();
  }, []);

  const filteredRagas = useMemo(() => {
    if (!searchQuery) return ragas;
    const lowerQ = searchQuery.toLowerCase();
    return ragas.filter(r => r.name.toLowerCase().includes(lowerQ));
  }, [ragas, searchQuery]);

  const handleRagaSelect = (raga: Raga) => {
    setSelectedRaga(raga);
    setIsReverseSearch(false);
  };

  const toggleNote = (pc: number) => {
    if (pc === 0) return; // Cannot toggle Sa
    setIsReverseSearch(true);
    setSelectedRaga(null);
    
    setSelectedNotes(prev => {
      if (prev.includes(pc)) {
        return prev.filter(n => n !== pc);
      } else {
        return [...prev, pc].sort((a, b) => a - b);
      }
    });
  };

  useEffect(() => {
    if (!isReverseSearch) return;
    
    // Find ragas whose combined arohana/avarohana exactly matches the selected notes
    const matches = ragas.filter(raga => {
      const ragaSemitones = new Set([
        ...raga.arohana.map(s => SWARA_TO_SEMITONE[s]),
        ...raga.avarohana.map(s => SWARA_TO_SEMITONE[s])
      ].filter(s => s !== undefined));
      
      const selectedSet = new Set(selectedNotes);
      
      if (ragaSemitones.size !== selectedSet.size) return false;
      for (let s of selectedSet) {
        if (!ragaSemitones.has(s)) return false;
      }
      return true;
    });
    
    setReverseMatches(matches);
  }, [selectedNotes, ragas, isReverseSearch]);

  const getRagaNotes = (raga: Raga | null) => {
    if (!raga) return [];
    const allSwaras = new Set([...raga.arohana, ...raga.avarohana]);
    return Array.from(allSwaras).map(s => SWARA_TO_SEMITONE[s]).filter(s => s !== undefined);
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return null;
    const parent = ragas.find(r => r.id === parentId);
    return parent ? parent.name : null;
  };

  return (
    <div className="w-full max-w-5xl mt-12 flex flex-col md:flex-row gap-8">
      {/* Left Column: Search & List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search ragas..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsReverseSearch(false);
            }}
          />
        </div>

        <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl p-2 overflow-y-auto max-h-[600px]">
          {isReverseSearch ? (
            <div className="p-4">
              <p className="text-emerald-400 font-semibold mb-4 text-sm">
                Reverse Search Results ({reverseMatches.length})
              </p>
              {reverseMatches.length > 0 ? (
                reverseMatches.map(raga => (
                  <button
                    key={raga.name}
                    onClick={() => handleRagaSelect(raga)}
                    className="w-full text-left p-3 mb-2 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div className="text-white font-medium">{raga.name}</div>
                    <div className="text-xs text-slate-500 mt-1 capitalize">{raga.type}</div>
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No exact matches found for these notes.</p>
              )}
            </div>
          ) : (
            filteredRagas.map(raga => (
              <button
                key={raga.name}
                onClick={() => handleRagaSelect(raga)}
                className={`w-full text-left p-3 mb-1 rounded-lg transition-colors border ${
                  selectedRaga?.name === raga.name 
                    ? 'bg-emerald-500/20 border-emerald-500/50' 
                    : 'hover:bg-slate-800 border-transparent hover:border-slate-700'
                }`}
              >
                <div className={`font-medium ${selectedRaga?.name === raga.name ? 'text-emerald-400' : 'text-white'}`}>
                  {raga.name}
                </div>
                <div className="text-xs text-slate-500 mt-1 capitalize">
                  {raga.type} {raga.chakra ? `• ${raga.chakra} Chakra` : ''}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Keyboard & Details */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            {isReverseSearch ? 'Reverse Search by Notes' : 'Keyboard Layout'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {isReverseSearch 
              ? 'Click notes on the keyboard to find matching ragas. Sa (C) is fixed.' 
              : 'The highlighted keys show the swaras for the selected raga, assuming C as Tonic (Sa).'
            }
          </p>

          <div className="overflow-x-auto pb-4">
             {/* Note: In a real app we might render this dynamically, but our CSS handles standard flex width well enough */}
             <PianoKeyboard 
                highlightedNotes={isReverseSearch ? [] : getRagaNotes(selectedRaga)}
                selectedNotes={isReverseSearch ? selectedNotes : []}
                onNoteClick={toggleNote}
                tonicPc={0} // Default to C for display purposes
                interactive={true}
             />
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => {
                setIsReverseSearch(true);
                setSelectedRaga(null);
                setSelectedNotes([0]); // Reset to just Sa
              }}
              className="text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Clear & Search by Notes
            </button>
          </div>
        </div>

        {selectedRaga && !isReverseSearch && (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Music className="text-emerald-400" size={28} />
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedRaga.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 capitalize">
                    {selectedRaga.type}
                  </span>
                  {selectedRaga.id && (
                    <span className="px-2 py-1 bg-cyan-900/50 rounded text-xs text-cyan-300">
                      Melakarta #{selectedRaga.id}
                    </span>
                  )}
                  {selectedRaga.parent_id && (
                    <span className="px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-300">
                      Janya of {getParentName(selectedRaga.parent_id)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUp size={12} className="text-emerald-400" /> Arohana (Ascending)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRaga.arohana.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDown size={12} className="text-cyan-400" /> Avarohana (Descending)
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRaga.avarohana.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

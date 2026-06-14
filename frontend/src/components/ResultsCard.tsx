import React, { useState } from 'react';
import { ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SwaraInfo {
  swara: string;
  western_note: string;
}

interface RagaMatch {
  name: string;
  confidence: number;
  id?: number;
  chakra?: string;
  raga_type?: string;
  parent_name?: string;
  arohana_swaras?: SwaraInfo[];
  avarohana_swaras?: SwaraInfo[];
}

interface ResultsCardProps {
  tonic: string;
  swaras: SwaraInfo[];
  arohana_swaras?: SwaraInfo[];
  avarohana_swaras?: SwaraInfo[];
  ragas: RagaMatch[];
}

export default function ResultsCard({ tonic, swaras, arohana_swaras, avarohana_swaras, ragas }: ResultsCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!tonic || !ragas) return null;

  const detectedSemitones = new Set(swaras.map(s => s.swara));
  const hasAscDesc = arohana_swaras && avarohana_swaras && arohana_swaras.length > 0;

  return (
    <div className="w-full max-w-3xl mt-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Analysis Results</h2>
      
      {/* Tonic */}
      <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-6">
        <p className="text-gray-400 text-sm font-medium mb-1">Detected Tonic (Sa)</p>
        <p className="text-3xl font-bold text-emerald-400">{tonic}</p>
      </div>

      {/* Detected Swaras */}
      {hasAscDesc ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-black/30 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
              <ArrowUp size={14} className="text-emerald-400" /> Ascending Notes (Arohana)
            </p>
            <div className="flex flex-wrap gap-2">
              {arohana_swaras!.map((info, idx) => (
                <span key={idx} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  {info.swara}
                  <span className="text-[11px] text-emerald-200/60 font-medium">({info.western_note})</span>
                </span>
              ))}
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-1.5">
              <ArrowDown size={14} className="text-cyan-400" /> Descending Notes (Avarohana)
            </p>
            <div className="flex flex-wrap gap-2">
              {avarohana_swaras!.map((info, idx) => (
                <span key={idx} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-bold border border-cyan-500/30 flex items-center gap-1.5">
                  {info.swara}
                  <span className="text-[11px] text-cyan-200/60 font-medium">({info.western_note})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-8">
          <p className="text-gray-400 text-sm font-medium mb-2">Detected Swaras</p>
          <div className="flex flex-wrap gap-2">
            {swaras.map((info, idx) => (
              <span key={idx} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-500/30 flex items-center gap-1.5">
                {info.swara}
                <span className="text-[11px] text-emerald-200/60 font-medium">({info.western_note})</span>
              </span>
            ))}
            {swaras.length === 0 && <span className="text-gray-500 text-sm">None detected</span>}
          </div>
        </div>
      )}

      {/* Raga Matches */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Top Raga Matches</h3>
        <div className="space-y-3">
          {ragas.map((raga, idx) => {
            const isExpanded = expandedIdx === idx;

            return (
              <div key={idx} className="bg-black/20 rounded-xl overflow-hidden border border-white/5 transition-all">
                {/* Clickable Header */}
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium text-lg">{raga.name}</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {raga.id && raga.chakra && (
                        <span className="text-cyan-400 text-xs">
                          Melakarta #{raga.id} • {raga.chakra} Chakra
                        </span>
                      )}
                      {raga.raga_type === 'janya' && raga.parent_name && (
                        <span className="text-purple-400 text-xs">
                          Janya of {raga.parent_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">{raga.confidence.toFixed(1)}%</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Confidence bar */}
                <div className="px-4 pb-2">
                  <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${raga.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Expandable Arohana/Avarohana Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                        Matched
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        Not in your input
                      </span>
                    </div>

                    {/* Arohana */}
                    {raga.arohana_swaras && raga.arohana_swaras.length > 0 && (
                      <div className="mb-4">
                        <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowUp size={12} className="text-emerald-400" /> Arohana (Ascending)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {raga.arohana_swaras.map((s, i) => {
                            const isMatched = detectedSemitones.has(s.swara);
                            return (
                              <span
                                key={i}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border ${
                                  isMatched
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {s.swara}
                                <span className={`text-[11px] font-medium ${isMatched ? 'text-emerald-200/60' : 'text-amber-200/60'}`}>
                                  ({s.western_note})
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Avarohana */}
                    {raga.avarohana_swaras && raga.avarohana_swaras.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowDown size={12} className="text-cyan-400" /> Avarohana (Descending)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {raga.avarohana_swaras.map((s, i) => {
                            const isMatched = detectedSemitones.has(s.swara);
                            return (
                              <span
                                key={i}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 border ${
                                  isMatched
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {s.swara}
                                <span className={`text-[11px] font-medium ${isMatched ? 'text-emerald-200/60' : 'text-amber-200/60'}`}>
                                  ({s.western_note})
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {ragas.length === 0 && <p className="text-gray-400 text-center py-4">No ragas matched.</p>}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

interface DebugStatsProps {
  debugData: {
    note_events: {
      start_time: number;
      end_time: number;
      duration: number;
      midi_pitch: number;
    }[];
    swara_regions: any[];
    total_notes: number;
  };
}

export default function DebugStats({ debugData }: DebugStatsProps) {
  if (!debugData) return null;

  const { note_events, swara_regions, total_notes } = debugData;

  // Prepare data for Recharts Piano Roll (Gantt-style chart)
  // Recharts doesn't have a native Gantt chart, so we use a BarChart with a custom shape
  // or a scatter chart. A simple approach for a Piano Roll is a Scatter chart or
  // just rendering custom divs! But since we already have recharts, let's build a custom block renderer.
  
  // Actually, a ScatterChart with thick lines is best for Piano Roll.
  
  const chartData = note_events.map((n, i) => ({
    id: i,
    pitch: n.midi_pitch,
    start: n.start_time,
    end: n.end_time,
    duration: n.duration,
  }));
  
  const CustomNoteShape = (props: any) => {
    const { cx, cy, payload, xAxis, yAxis } = props;
    const startX = xAxis.scale(payload.start);
    const endX = xAxis.scale(payload.end);
    const width = endX - startX;
    // cy is the center of the pitch. Let's make the height 10px.
    const height = 10;
    
    return (
      <rect 
        x={startX} 
        y={cy - height/2} 
        width={Math.max(width, 2)} 
        height={height} 
        fill="#10b981" 
        rx={2}
      />
    );
  };

  return (
    <div className="w-full max-w-3xl mt-8 bg-slate-900/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center justify-between">
        <span>Audio Analysis Debug (Basic-Pitch)</span>
        <span className="text-xs font-normal text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          Detected {total_notes} notes
        </span>
      </h3>
      
      <p className="text-sm text-slate-400 mb-6">
        The piano roll below shows the discrete musical notes extracted by Spotify's Basic-Pitch neural network.
      </p>

      <div className="w-full h-64 bg-slate-950 rounded-xl p-4 border border-slate-800">
        <div className="relative w-full h-full bg-slate-900 border-l border-b border-slate-700">
          {chartData.length > 0 && (() => {
            const maxTime = Math.max(...chartData.map(d => d.end), 1);
            const minPitch = Math.min(...chartData.map(d => d.pitch)) - 2;
            const maxPitch = Math.max(...chartData.map(d => d.pitch)) + 2;
            const pitchRange = Math.max(maxPitch - minPitch, 1);

            return chartData.map((note) => {
              const left = (note.start / maxTime) * 100;
              const width = Math.max(((note.end - note.start) / maxTime) * 100, 0.5); // Min 0.5% width
              // Note: Piano rolls have higher pitches at the top, so we invert the Y axis
              const top = ((maxPitch - note.pitch) / pitchRange) * 100;

              return (
                <div 
                  key={note.id}
                  className="absolute h-4 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)] cursor-pointer hover:bg-emerald-400 transition-colors"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `calc(${top}% - 8px)`, // Center the 16px height block
                  }}
                  title={`MIDI Pitch: ${note.pitch} | ${note.start.toFixed(2)}s - ${note.end.toFixed(2)}s`}
                />
              );
            });
          })()}
          {/* Subtle horizontal grid lines for piano roll rows */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '100% 10%' }} />
        </div>
      </div>
      
      {swara_regions && swara_regions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Detected Swara Sequence</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 pb-2">
             {swara_regions.map((r, i) => (
               <div key={i} className="flex flex-col bg-slate-800 border border-slate-700 px-2 py-1 rounded text-xs">
                 <span className="text-emerald-400 font-bold text-center text-sm">{r.swara}</span>
                 <span className="text-slate-400 text-[10px] text-center">{r.duration.toFixed(2)}s</span>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

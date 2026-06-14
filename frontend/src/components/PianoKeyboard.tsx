import React from 'react';

interface PianoKeyboardProps {
  highlightedNotes?: number[]; // Array of pitch classes (0-11, where 0 is C)
  selectedNotes?: number[];    // Array of pitch classes clicked by user
  onNoteClick?: (note: number) => void;
  tonicPc?: number;            // To show where Sa is (0-11)
  interactive?: boolean;
}

const PITCH_CLASSES = [
  { note: 0, name: 'C', type: 'white' },
  { note: 1, name: 'C#', type: 'black' },
  { note: 2, name: 'D', type: 'white' },
  { note: 3, name: 'D#', type: 'black' },
  { note: 4, name: 'E', type: 'white' },
  { note: 5, name: 'F', type: 'white' },
  { note: 6, name: 'F#', type: 'black' },
  { note: 7, name: 'G', type: 'white' },
  { note: 8, name: 'G#', type: 'black' },
  { note: 9, name: 'A', type: 'white' },
  { note: 10, name: 'A#', type: 'black' },
  { note: 11, name: 'B', type: 'white' },
  // Second octave for visual completeness
  { note: 12, name: 'C', type: 'white' },
  { note: 13, name: 'C#', type: 'black' },
  { note: 14, name: 'D', type: 'white' },
  { note: 15, name: 'D#', type: 'black' },
  { note: 16, name: 'E', type: 'white' },
  { note: 17, name: 'F', type: 'white' },
  { note: 18, name: 'F#', type: 'black' },
  { note: 19, name: 'G', type: 'white' },
  { note: 20, name: 'G#', type: 'black' },
  { note: 21, name: 'A', type: 'white' },
  { note: 22, name: 'A#', type: 'black' },
  { note: 23, name: 'B', type: 'white' },
  { note: 24, name: 'C', type: 'white' },
];

export default function PianoKeyboard({
  highlightedNotes = [],
  selectedNotes = [],
  onNoteClick,
  tonicPc,
  interactive = false
}: PianoKeyboardProps) {
  
  const handleNoteClick = (pc: number) => {
    if (interactive && onNoteClick) {
      onNoteClick(pc);
    }
  };

  return (
    <div className="relative flex select-none touch-none bg-slate-900 p-2 rounded-xl border border-slate-700 overflow-x-auto">
      {PITCH_CLASSES.map((key) => {
        const pc = key.note % 12;
        const isHighlighted = highlightedNotes.includes(pc);
        const isSelected = selectedNotes.includes(pc);
        const isTonic = tonicPc === pc;
        
        let bgColor = '';
        if (key.type === 'white') {
            bgColor = 'bg-white';
            if (isTonic) bgColor = 'bg-emerald-300';
            else if (isSelected) bgColor = 'bg-cyan-300';
            else if (isHighlighted) bgColor = 'bg-emerald-100';
        } else {
            bgColor = 'bg-slate-900';
            if (isTonic) bgColor = 'bg-emerald-700';
            else if (isSelected) bgColor = 'bg-cyan-700';
            else if (isHighlighted) bgColor = 'bg-emerald-800';
        }

        if (key.type === 'white') {
          return (
            <div
              key={key.note}
              onClick={() => handleNoteClick(pc)}
              className={`relative flex-shrink-0 w-10 sm:w-12 h-32 sm:h-40 border border-slate-300 rounded-b-md mx-[1px] ${bgColor} ${interactive ? 'cursor-pointer hover:bg-slate-200' : ''} transition-colors flex flex-col justify-end pb-2`}
            >
              {isTonic && (
                 <div className="absolute top-2 w-full text-center text-xs font-bold text-emerald-700">Sa</div>
              )}
              <div className={`w-full text-center text-xs font-semibold ${isTonic || isSelected || isHighlighted ? 'text-slate-800' : 'text-slate-400'}`}>
                {key.name}
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={key.note}
              onClick={() => handleNoteClick(pc)}
              className={`absolute flex-shrink-0 w-7 sm:w-8 h-20 sm:h-24 border border-slate-700 rounded-b-sm z-10 ${bgColor} ${interactive ? 'cursor-pointer hover:bg-slate-700' : ''} transition-colors flex flex-col justify-end pb-2`}
              style={{
                 left: `calc(${PITCH_CLASSES.filter(k => k.type === 'white' && k.note < key.note).length} * (3rem + 2px) - (1.75rem / 2) + 0.5rem)`
              }}
            >
               {isTonic && (
                 <div className="absolute top-2 w-full text-center text-[10px] font-bold text-emerald-300">Sa</div>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}

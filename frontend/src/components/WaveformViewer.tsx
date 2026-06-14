import React, { useEffect, useRef } from 'react';

interface WaveformViewerProps {
  audioBlob: Blob | null;
}

export default function WaveformViewer({ audioBlob }: WaveformViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBlob || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We use a safe approach by reading the file and extracting limited data
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const step = Math.ceil(channelData.length / canvas.width);
        const amp = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f172a'; // matches background slightly
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.moveTo(0, amp);
        
        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = channelData[(i * step) + j]; 
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.lineTo(i, (1 + min) * amp);
          ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.strokeStyle = '#10b981'; // emerald-500
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } catch (err) {
        console.error("Error generating waveform", err);
      }
    };
    
    reader.readAsArrayBuffer(audioBlob);
  }, [audioBlob]);

  if (!audioBlob) return null;

  return (
    <div className="w-full max-w-2xl mt-8">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Waveform</h3>
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-md">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={100} 
          className="w-full h-24 object-fill"
        />
      </div>
    </div>
  );
}

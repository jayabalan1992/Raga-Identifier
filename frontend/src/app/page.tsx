'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Mic, Square, Play, Loader2, Music, Search as SearchIcon, Activity } from 'lucide-react';
import ResultsCard from '@/components/ResultsCard';
import WaveformViewer from '@/components/WaveformViewer';
import RagaDatabase from '@/components/RagaDatabase';
import DebugStats from '@/components/DebugStats';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type TabType = 'analyze' | 'database';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('analyze');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualTonic, setManualTonic] = useState<string>('');

  // MIDI State
  const [midiStatus, setMidiStatus] = useState<string>('Not Connected');
  const [isMidiRecording, setIsMidiRecording] = useState(false);
  const [midiNotes, setMidiNotes] = useState<number[]>([]);
  const isMidiRecordingRef = useRef(false);
  const midiAccessRef = useRef<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setMidiNotes([]);
      setResults(null);
      setError(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMidiNotes([]);
      setResults(null);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const analyzeAudio = async () => {
    if (!audioBlob) return;
    
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    if (manualTonic) {
      formData.append('tonic', manualTonic);
    }

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error analyzing audio. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectMidi = async () => {
    if (navigator.requestMIDIAccess) {
      try {
        const midiAccess = await navigator.requestMIDIAccess();
        midiAccessRef.current = midiAccess;
        setMidiStatus('Connected');
        
        const inputs = midiAccess.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          input.value.onmidimessage = onMidiMessage;
        }
      } catch (err) {
        setMidiStatus('Connection Failed');
        console.error(err);
      }
    } else {
      setMidiStatus('Web MIDI Not Supported');
    }
  };

  const onMidiMessage = (message: any) => {
    const [command, note, velocity] = message.data;
    // 0x90 to 0x9F is Note On for channels 1-16
    if ((command & 0xf0) === 0x90 && velocity > 0) {
      if (isMidiRecordingRef.current) {
        setMidiNotes(prev => [...prev, note]);
      }
    }
  };

  const toggleMidiRecording = () => {
    if (isMidiRecording) {
      setIsMidiRecording(false);
      isMidiRecordingRef.current = false;
    } else {
      setAudioBlob(null);
      setAudioUrl(null);
      setResults(null);
      setError(null);
      setMidiNotes([]);
      setIsMidiRecording(true);
      isMidiRecordingRef.current = true;
    }
  };

  const analyzeMidi = async () => {
    if (midiNotes.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/analyze_midi`, { notes: midiNotes });
      setResults(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error analyzing MIDI. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center mt-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Music size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Raga AI
          </h1>
        </div>
        <p className="text-lg text-slate-400 mb-8 text-center max-w-xl">
          Upload an audio file or record your voice to instantly identify the Indian classical raga and underlying swaras.
        </p>

        {/* Tabs */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700 mb-12">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'analyze' 
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Activity size={18} />
            Analyze
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'database' 
                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <SearchIcon size={18} />
            Database
          </button>
        </div>

        {activeTab === 'database' ? (
          <RagaDatabase />
        ) : (
          <>
            {/* Action Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          {/* Upload Card */}
          <div className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-900/50 hover:bg-slate-800/50 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden backdrop-blur-sm">
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
            <UploadCloud size={48} className="text-slate-400 group-hover:text-emerald-400 transition-colors mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">Upload Audio</h3>
            <p className="text-sm text-slate-500 text-center">Drag and drop or click to select WAV/MP3</p>
          </div>

          {/* Record Card */}
          <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-3xl bg-slate-900/50 backdrop-blur-sm relative overflow-hidden">
            {isRecording ? (
              <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>
            ) : null}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-6 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              } mb-4 z-10`}
            >
              {isRecording ? <Square size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
            </button>
            <h3 className="text-lg font-semibold text-white mb-1 z-10">
              {isRecording ? 'Recording...' : 'Record Voice'}
            </h3>
            <p className="text-sm text-slate-500 z-10">Use your microphone to sing</p>
          </div>

          {/* MIDI Card */}
          <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-3xl bg-slate-900/50 backdrop-blur-sm relative overflow-hidden transition-all hover:border-purple-500/50">
            <button
              onClick={midiStatus === 'Connected' ? toggleMidiRecording : connectMidi}
              className={`p-6 rounded-full flex items-center justify-center transition-all shadow-xl ${
                midiStatus === 'Connected'
                ? isMidiRecording 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20 animate-pulse' 
                  : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20'
                : 'bg-slate-700 hover:bg-slate-600'
              } mb-4 z-10`}
            >
              <Music size={32} className="text-white" />
            </button>
            <h3 className="text-lg font-semibold text-white mb-1 z-10">
              {midiStatus === 'Connected' ? (isMidiRecording ? 'Recording MIDI...' : 'Record MIDI') : 'Connect MIDI'}
            </h3>
            <p className="text-sm text-slate-500 z-10">
              {midiStatus === 'Connected' ? (midiNotes.length > 0 ? `${midiNotes.length} notes recorded` : 'Ready to play') : midiStatus}
            </p>
          </div>
        </div>

        {/* Preview Area */}
        {(audioUrl || midiNotes.length > 0) && (
          <div className="w-full max-w-2xl mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {audioUrl && (
              <>
                <audio controls src={audioUrl} className="w-full mb-6 rounded-full custom-audio" />
                <WaveformViewer audioBlob={audioBlob} />
              </>
            )}
            
            {midiNotes.length > 0 && !isMidiRecording && (
              <div className="w-full mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-center">
                <p className="text-slate-300 font-medium mb-2">Captured {midiNotes.length} MIDI Notes</p>
                <div className="flex flex-wrap gap-1 justify-center max-h-32 overflow-y-auto p-2">
                  {midiNotes.map((note, i) => (
                    <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={audioUrl ? analyzeAudio : analyzeMidi}
              disabled={isLoading || isMidiRecording}
              className="mt-8 group relative px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-cyan-100 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Play size={24} className="fill-slate-900" />
                    {audioUrl ? 'Analyze Audio Raga' : 'Analyze MIDI Raga'}
                  </>
                )}
              </span>
            </button>

            {audioUrl && (
              <div className="mt-6 flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                <label className="text-sm font-medium text-slate-300">Manual Tonic (Optional):</label>
                <select 
                  value={manualTonic}
                  onChange={(e) => setManualTonic(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Auto-detect</option>
                  {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                    <option key={note} value={note}>{note}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 w-full text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        {results && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
            <ResultsCard 
              tonic={results.tonic} 
              swaras={results.swaras}
              arohana_swaras={results.arohana_swaras}
              avarohana_swaras={results.avarohana_swaras}
              ragas={results.ragas} 
            />
            {results.debug_data && <DebugStats debugData={results.debug_data} />}
          </div>
        )}
          </>
        )}
      </div>
    </main>
  );
}

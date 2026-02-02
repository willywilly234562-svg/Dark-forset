import React, { useState } from 'react';
import { Key, X, ExternalLink, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [inputKey, setInputKey] = useState(currentKey);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border-2 border-amber-500 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Key size={32} className="text-amber-500" />
            </div>
            <h2 className="text-2xl cinzel font-bold text-white text-center">Enter API Key</h2>
            <p className="text-slate-400 text-sm text-center mt-2">
                To consult the spirits and forge legends, you must provide a Gemini API Key.
            </p>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Google Gemini API Key</label>
                <input 
                    type="password" 
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
                />
            </div>

            <button 
                onClick={() => onSave(inputKey)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <Check size={18} /> Save Key
            </button>

            <div className="text-center pt-2">
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                >
                    Get a key from Google AI Studio <ExternalLink size={10} />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;

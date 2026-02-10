import React, { useState, useEffect } from 'react';
import { Lock, Delete, Check, X } from 'lucide-react';
import { playKeypress, playDelete, playSuccess, playError } from '../../utils/soundEffects';

interface KeypadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => void;
    rfidCode: string; // To verify against
}

export const KeypadModal: React.FC<KeypadModalProps> = ({ isOpen, onClose, onSuccess, rfidCode }) => {
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState<'idle' | 'verifying' | 'error' | 'success'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setStatus('idle');
            setErrorMsg('');
        }
    }, [isOpen]);

    // Sound Effects for Validation State
    useEffect(() => {
        if (status === 'success') playSuccess();
        if (status === 'error') playError();
    }, [status]);

    const handleNumberParams = (num: number) => {
        playKeypress();
        if (pin.length < 6) {
            setPin(prev => prev + num);
        }
    };

    const handleClear = () => {
        playDelete();
        setPin('');
        setStatus('idle');
    };

    const handleBackspace = () => {
        playDelete();
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (pin.length < 4) {
            setStatus('error');
            setErrorMsg('PIN too short');
            return;
        }

        // Pass PIN to parent for verification
        onSuccess(pin);
        setStatus('verifying');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className={`w-80 p-6 rounded-2xl border ${status === 'error' ? 'bg-red-950/50 border-red-500/50' :
                status === 'success' ? 'bg-emerald-950/50 border-emerald-500/50' :
                    'bg-slate-900/90 border-cyan-500/30'
                } shadow-2xl transition-all duration-300 transform scale-100`}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Lock className={`w-5 h-5 ${status === 'error' ? 'text-red-400' : 'text-cyan-400'}`} />
                        <h2 className="text-lg font-bold text-white tracking-widest">SECURE ACCESS</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Display */}
                <div className="mb-6">
                    <div className={`h-12 rounded-lg border flex items-center justify-center text-2xl font-mono tracking-[0.5em] bg-black/50 ${status === 'error' ? 'border-red-500 text-red-500' :
                        status === 'success' ? 'border-emerald-500 text-emerald-500' :
                            'border-cyan-500/30 text-cyan-400'
                        }`}>
                        {pin.split('').map(() => '•').join('')}
                        {pin.length === 0 && <span className="text-slate-700 text-sm tracking-normal animate-pulse">ENTER PIN</span>}
                    </div>
                    {status === 'error' && <p className="text-red-400 text-xs text-center mt-2 font-mono">{errorMsg}</p>}
                    {status === 'verifying' && <p className="text-cyan-400 text-xs text-center mt-2 font-mono animate-pulse">VERIFYING...</p>}
                    {status === 'success' && <p className="text-emerald-400 text-xs text-center mt-2 font-mono">ACCESS GRANTED</p>}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberParams(num)}
                            className="h-14 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500/50 active:scale-95 transition-all text-white font-mono text-xl"
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={handleBackspace} className="h-14 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-rose-500/20 hover:border-rose-500/50 active:scale-95 transition-all flex items-center justify-center text-rose-400">
                        <Delete size={20} />
                    </button>
                    <button onClick={() => handleNumberParams(0)} className="h-14 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-cyan-500/20 hover:border-cyan-500/50 active:scale-95 transition-all text-white font-mono text-xl">
                        0
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={pin.length < 4 || status === 'verifying'}
                        className="h-14 rounded-lg bg-cyan-600/20 border border-cyan-500/50 hover:bg-cyan-500/40 active:scale-95 transition-all flex items-center justify-center text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={24} />
                    </button>
                </div>

                <div className="text-center">
                    <button onClick={handleClear} className="text-xs text-slate-500 hover:text-white uppercase tracking-wider">Clear Entry</button>
                </div>
            </div>
        </div>
    );
};

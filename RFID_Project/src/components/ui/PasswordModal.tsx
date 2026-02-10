import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Check } from 'lucide-react';
import { playKeypress, playError, playSuccess } from '../../utils/soundEffects';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (password: string) => void;
    targetName: string;
    identity?: string | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess, targetName, identity }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
            // Focus input after animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError('Password required');
            playError();
            return;
        }
        playSuccess();
        onSuccess(password);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-96 p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-2xl transition-all duration-300">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                            AUTHENTICATE
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-slate-400 text-sm mb-4">
                    Enter password for <span className="text-indigo-400 font-semibold">{targetName}</span>
                </p>

                {identity && (
                    <div className="mb-4 bg-slate-800/50 p-2 rounded border border-slate-700 text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Identity Detected</span>
                        <div className="text-indigo-300 font-bold">{identity}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="relative mb-6">
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className={`w-full bg-black/50 border rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all
                                ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'}
                            `}
                            placeholder="Enter Password..."
                        />
                        {error && <p className="text-red-400 text-xs mt-2 absolute -bottom-5 left-1">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                        >
                            <Check size={16} />
                            Verify
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

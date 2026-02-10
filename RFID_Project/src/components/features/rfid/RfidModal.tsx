
import React, { useState, useEffect, useRef } from 'react';
import { SignalIcon } from '@/components/icons/SignalIcon';

import { useRfid } from '@/contexts/RfidContext';

interface RfidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  targetName: string;
  isRegistration?: boolean;
}

export const RfidModal: React.FC<RfidModalProps> = ({ isOpen, onClose, onScan, targetName, isRegistration = false }) => {
  const { isConnected, simulateScan } = useRfid();
  const [rfidCode, setRfidCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setRfidCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfidCode.trim()) {
      simulateScan(rfidCode.trim());
    }
  };



  const title = isRegistration ? "Registration Required" : "RFID Scan Required";
  const prompt = isRegistration
    ? "Register your RFID to gain access to the facility."
    : `Present RFID for access to ${targetName}.`;
  const buttonText = isRegistration ? "Register" : "Authenticate";


  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md m-4 p-6 text-center transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative mx-auto w-fit mb-4">
          <div className="text-sky-500 p-3 bg-sky-500/10 rounded-full ring-1 ring-sky-500/30">
            <SignalIcon className="w-8 h-8" />
          </div>
          {/* Connection Indicator */}
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} title={isConnected ? "Reader Connected" : "Reader Disconnected"}></div>
        </div>

        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
        <p className="text-slate-400 text-sm mt-2 mb-6">
          {prompt.split(targetName)[0]}
          <span className="font-semibold text-sky-400">{targetName}</span>
          {prompt.split(targetName)[1]}
        </p>

        {/* File Upload Section */}
        <div className="w-full group relative overflow-hidden bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 mb-6 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-sky-500/5 animate-pulse"></div>
          <SignalIcon className="w-10 h-10 text-sky-500 mb-3" />
          <span className="text-lg font-semibold text-sky-400">Tap RFID Card</span>
          <span className="text-sm text-slate-500 mt-2">Place card near the reader</span>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink-0 mx-4 text-slate-600 text-[10px] uppercase tracking-widest font-bold">Or Enter Manually</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="rfid-input" className="sr-only">RFID Code</label>
          <div className="relative">
            <input
              ref={inputRef}
              id="rfid-input"
              type="text"
              value={rfidCode}
              onChange={(e) => setRfidCode(e.target.value)}
              placeholder={isConnected ? "Waiting for scan..." : "• • • • • •"}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-lg text-slate-200 font-mono tracking-widest focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition placeholder:text-slate-700"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!rfidCode.trim()}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};

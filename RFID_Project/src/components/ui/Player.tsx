import React from 'react';
import type { Character } from '@/types';

interface PlayerProps {
  character: Character;
  position: { x: number; y: number };
}

export const Player: React.FC<PlayerProps> = ({ character, position }) => {
  return (
    <div
      className="absolute transition-transform duration-100 ease-linear"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '4%', // Corresponds to PLAYER_SIZE
        height: '6%', // Corresponds to PLAYER_SIZE
      }}
      aria-label={`Player character ${character.name}`}
    >
      <div className="relative group flex flex-col items-center justify-center w-full h-full">
        {/* Radar Pulse Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-sky-400/30 animate-[ping_3s_ease-out_infinite] opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-sky-500/10 animate-[ping_4s_ease-out_infinite_1s] opacity-30"></div>

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-sky-100 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-500/30 whitespace-nowrap z-10 backdrop-blur-sm shadow-neon">
          {character.name}
        </div>
        <img
          src={character.avatar}
          alt={character.name}
          className="w-10 h-10 rounded-full border-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)] z-10"
        />
      </div>
    </div>
  );
};
import React from 'react';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onSelect }) => {
  const baseClasses = "flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out shadow-md";
  const selectedClasses = "bg-sky-500/20 border-sky-500 ring-2 ring-sky-500";
  const unselectedClasses = "bg-slate-800/50 border-transparent hover:bg-slate-700/50";

  const handleSelect = () => onSelect(character);

  return (
    <div
      onClick={handleSelect}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
    >
      <img src={character.avatar} alt={character.name} className="w-12 h-12 rounded-full mr-4 border-2 border-slate-600" />
      <div>
        <p className={`font-bold ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>{character.name}</p>
        <p className={`text-sm ${isSelected ? 'text-sky-400' : 'text-slate-400'}`}>{character.role}</p>
      </div>
    </div>
  );
};
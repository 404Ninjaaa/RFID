import React from 'react';
import type { Door } from '@/types';
import { LockClosedIcon } from '@/components/icons/LockClosedIcon';
import { LockOpenIcon } from '@/components/icons/LockOpenIcon';
import { NoSymbolIcon } from '@/components/icons/NoSymbolIcon';

interface DoorCardProps {
  door: Door;
  status: { isOpen: boolean; feedback: 'idle' | 'granted' | 'denied' };
  isNearby: boolean;
}

const feedbackStyles = {
  idle: 'bg-slate-700',
  granted: 'bg-emerald-500',
  denied: 'bg-rose-500',
};

export const DoorCard: React.FC<DoorCardProps> = ({ door, status, isNearby }) => {
  const { isOpen, feedback } = status;
  
  const isHorizontal = door.orientation === 'horizontal';

  // Base styles for the door area
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    left: `${door.position.x}%`,
    top: `${door.position.y}%`,
    width: isHorizontal ? `${door.size}%` : `2%`,
    height: isHorizontal ? `2%` : `${door.size}%`,
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
  };

  const doorPanelStyle: React.CSSProperties = {
    ...baseStyle,
    backgroundColor: isOpen ? 'transparent' : undefined, // Open doors are invisible
  };

  const feedbackClass = feedbackStyles[feedback];
  const nearbyClasses = isNearby && !isOpen ? 'ring-2 ring-sky-400' : '';

  const Icon = () => {
    if (isOpen) return <LockOpenIcon className="w-4 h-4" />;
    switch (feedback) {
      case 'granted': return <LockOpenIcon className="w-4 h-4" />;
      case 'denied': return <NoSymbolIcon className="w-4 h-4" />;
      default: return <LockClosedIcon className="w-4 h-4" />;
    }
  };

  return (
    <div style={doorPanelStyle} className={`flex items-center justify-center ${!isOpen ? `${feedbackClass} ${nearbyClasses}` : ''}`}>
      {!isOpen && (
        <div className="text-white">
          <Icon />
        </div>
      )}
       {isNearby && !isOpen && (
         <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-2 py-1 rounded-md border border-slate-600 shadow-lg whitespace-nowrap">
           Press <span className="font-bold text-sky-400">[E]</span> to Scan
         </div>
       )}
    </div>
  );
};
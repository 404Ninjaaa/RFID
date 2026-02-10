import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './services/api';
import { CHARACTERS, WALLS, ROOMS } from './constants';
import { Character, Door, LogMessage, Wall } from './types';
import { RfidProvider, useRfid } from './contexts/RfidContext';

import { DoorCard } from './components/ui/cards/DoorCard';
import { CharacterCard } from './components/ui/cards/CharacterCard';

import { Player } from './components/ui/Player';
import { ControlPanel } from './components/features/control/ControlPanel';
import { RfidModal } from './components/features/rfid/RfidModal';
import { KeypadModal } from './components/ui/KeypadModal';
import { FireAlarmModal } from './components/ui/FireAlarmModal';
import { PasswordModal } from './components/ui/PasswordModal';
import { AdminDashboard } from './components/features/admin/AdminDashboard';
import { NotificationContainer, NotificationProps } from './components/ui/Notification';
import { useGameLoop } from './hooks/useGameLoop';
import { useAccessControl } from './hooks/useAccessControl';

type Feedback = 'idle' | 'granted' | 'denied';
interface DoorState {
  isOpen: boolean;
  feedback: Feedback;
}
type DoorStatusMap = Record<number, DoorState>;


interface CharacterState {
  position: { x: number; y: number };
  isRegistered: boolean;
}
type CharacterStatesMap = Record<number, CharacterState>;

const PLAYER_SPEED = 1.5;
const INTERACTION_DISTANCE = 10;
const PLAYER_SIZE = { width: 4, height: 6 };

interface AppConfig {
  doors: Door[];
  mapConfig: any;
  roles: any;
}

interface GameContentProps {
  config: AppConfig;
  initialCharacters: Character[];
}

const GameContent: React.FC<GameContentProps> = ({ config, initialCharacters }) => {
  const { doors, mapConfig } = config;
  const { lastScannedCode, clearScan } = useRfid();
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(initialCharacters.length > 0 ? initialCharacters[0] : {} as Character);
  const [logMessages, setLogMessages] = useState<LogMessage[]>([]);
  const [isFireModalOpen, setIsFireModalOpen] = useState(false);

  // Initial Data Load from MongoDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedLogs, fetchedChars] = await Promise.all([
          api.getLogs(),
          api.getCharacters()
        ]);

        if (fetchedLogs) setLogMessages(fetchedLogs);

        if (fetchedChars && fetchedChars.length > 0) {
          setCharacters(fetchedChars);

          setSelectedCharacter(prev => {
            // Keep selection if valid, otherwise fallback
            const exists = fetchedChars.find((c: Character) => c.id === prev.id);
            return exists || fetchedChars[0];
          });
        }
      } catch (err) {
        console.error("Failed to load data from DB", err);
      }
    };
    loadData();
  }, []);

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const notificationIdRef = useRef(0);
  const logCounterRef = useRef(0);

  const [doorStatuses, setDoorStatuses] = useState<DoorStatusMap>(
    doors.reduce((acc, door) => ({ ...acc, [door.id]: { isOpen: false, feedback: 'idle' } }), {})
  );

  const [characterStates, setCharacterStates] = useState<CharacterStatesMap>(() =>
    characters.reduce((acc, char, index) => {
      // Improved Footpath Layout Logic using fetched config
      const MAX_WIDTH_PERCENT = 100 - (mapConfig.footpath.xPadding * 2);
      const START_X = mapConfig.footpath.xPadding;
      const SPACING_X = 8;
      const WRAP_AT_INDEX = Math.floor(MAX_WIDTH_PERCENT / SPACING_X);

      const row = Math.floor(index / WRAP_AT_INDEX);
      const col = index % WRAP_AT_INDEX;

      const x = START_X + (col * SPACING_X) + (row % 2 === 1 ? 4 : 0);
      const y = mapConfig.footpath.yStart + (row * 10);

      const isValidPos = char.position && (char.position.x !== 0 || char.position.y !== 0);
      const finalPos = isValidPos ? char.position : { x, y: Math.min(y, mapConfig.footpath.yEnd) };
      const finalRegistered = char.isRegistered !== undefined ? char.isRegistered : false;

      acc[char.id] = { position: finalPos, isRegistered: finalRegistered };
      return acc;
    }, {} as CharacterStatesMap)
  );

  // Sync characterStates when characters list updates from DB
  useEffect(() => {
    setCharacterStates(prev => {
      const next = { ...prev };
      let changed = false;
      characters.forEach((char, index) => {
        const MAX_WIDTH_PERCENT = 100 - (mapConfig.footpath.xPadding * 2);
        const START_X = mapConfig.footpath.xPadding;
        const SPACING_X = 8;
        const WRAP_AT_INDEX = Math.floor(MAX_WIDTH_PERCENT / SPACING_X);

        const row = Math.floor(index / WRAP_AT_INDEX);
        const col = index % WRAP_AT_INDEX;

        const x = START_X + (col * SPACING_X) + (row % 2 === 1 ? 4 : 0);
        const y = mapConfig.footpath.yStart + (row * 10);
        const clampedY = Math.min(y, mapConfig.footpath.yEnd);

        const currentState = next[char.id];
        const dbPosIsValid = char.position && (char.position.x !== 0 || char.position.y !== 0);

        // Only override if we don't have a state yet, OR if the DB has a valid position that differs from our "invalid" default
        const targetPos = dbPosIsValid ? char.position! : { x, y: clampedY };
        const targetRegistered = char.isRegistered !== undefined ? char.isRegistered : (currentState?.isRegistered || false);

        // Detect if update is actually needed to avoid state trash
        const posChanged = !currentState || currentState.position.x !== targetPos.x || currentState.position.y !== targetPos.y;

        if (posChanged) {
          next[char.id] = { position: targetPos, isRegistered: targetRegistered };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [characters, mapConfig]);

  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addLog = useCallback((text: string, type: LogMessage['type'], metadata?: any, userId?: number) => {
    const uniqueId = Date.now() * 1000 + (logCounterRef.current++ % 1000);
    const newLog: LogMessage = {
      id: uniqueId,
      text,
      type,
      timestamp: new Date().toISOString(),
      user: userId,
      metadata: {
        item: type === 'error' ? 'Security System' : 'Access Control',
        userAgent: navigator.userAgent,
        sessionId: 'sess_' + Math.random().toString(36).substr(2, 9),
        ...metadata
      }
    };
    setLogMessages(prevLogs => [newLog, ...prevLogs].slice(0, 500));
    if (!metadata?.skipPersistence) {
      api.createLog(newLog).catch(e => console.error("Failed to save log:", e));
    }

    const notificationId = ++notificationIdRef.current;
    setNotifications(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.message === text && last.type === type) return prev;
      }
      return [...prev, {
        id: notificationId,
        message: text,
        type: type as any,
        onDismiss: dismissNotification,
      }];
    });
  }, [dismissNotification]);

  const handleAddCharacter = useCallback(async (newChar: Character) => {
    try {
      await api.createCharacter(newChar);
      setCharacters(prev => {
        if (prev.some(c => c.id === newChar.id)) return prev;
        return [...prev, newChar];
      });
      addLog(`New access credentials generated for: ${newChar.name} (${newChar.role})`, 'success', { action: 'recruit', characterId: newChar.id });
    } catch (e: any) {
      console.error("Failed to recruit operative:", e);
      addLog(`Failed to recruit operative: ${e.message || 'Database error'}.`, "error");
    }
  }, [addLog]);

  const handleUpdateCharacter = useCallback(async (updatedChar: Character) => {
    try {
      await api.updateCharacter(updatedChar.id, updatedChar);
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
      if (selectedCharacter.id === updatedChar.id) {
        setSelectedCharacter(prev => ({ ...prev, ...updatedChar }));
      }
      addLog(`Operative profile updated: ${updatedChar.name}`, "success", { action: 'update_char', characterId: updatedChar.id });
    } catch (e: any) {
      console.error("Failed to update character:", e);
      addLog(`Failed to update operative profile: ${e.message || 'Database error'}.`, "error");
    }
  }, [addLog, selectedCharacter.id]);

  const handleDeleteCharacter = useCallback(async (id: number): Promise<boolean> => {
    const charToDelete = characters.find(c => c.id === id);
    if (charToDelete?.isSystem || id <= 5) {
      addLog("Cannot delete default system personnel.", "error");
      window.alert("ACCESS DENIED: Cannot delete default system personnel.");
      return false;
    }

    try {
      await api.deleteCharacter(id);
      setCharacters(prev => prev.filter(c => c.id !== id));
      setCharacterStates(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (selectedCharacter.id === id) {
        setSelectedCharacter(CHARACTERS[0]);
      }
      addLog("Operative removed from database.", "success", { action: 'delete_char', characterId: id });
      return true;
    } catch (e: any) {
      console.error("Failed to delete character:", e);
      addLog(`Failed to delete operative: ${e.message}`, "error");
      window.alert(`DELETION FAILED: ${e.message || 'Server error'}`);
      return false;
    }
  }, [addLog, selectedCharacter.id]);

  const [nearbyDoorId, setNearbyDoorId] = useState<number | null>(null);
  const [lastOpenedDoor, setLastOpenedDoor] = useState<{ doorId: number; openedFromPosition: { x: number; y: number } } | null>(null);

  const currentPosition = characterStates[selectedCharacter.id]?.position || { x: 50, y: 115 };
  const isRegistered = characterStates[selectedCharacter.id]?.isRegistered || false;

  // HOOK INTEGRATION
  const {
    modalState,
    setModalState,
    keypadState,
    setKeypadState,
    passwordState,
    setPasswordState,
    handleAccessRequest
  } = useAccessControl({
    doors,
    addLog,
    setDoorStatuses,
    setLastOpenedDoor,
    currentPosition,
    setCharacterStates
  });

  const handleAttemptAccess = useCallback((target: Door) => {
    if (!isRegistered && !(target.name === 'Main Entrance')) {
      addLog("Please register at the Main Entrance first.", "info");
      return;
    }
    setModalState({ isOpen: true, targetDoor: target });
  }, [isRegistered, addLog, setModalState]);

  const getObstacles = useCallback(() => {
    const closedDoorsAsWalls: Wall[] = doors.filter(door => !doorStatuses[door.id]?.isOpen)
      .map(door => ({
        id: 1000 + door.id,
        x: door.orientation === 'horizontal' ? door.position.x - door.size / 2 : door.position.x - 1,
        y: door.orientation === 'vertical' ? door.position.y - door.size / 2 : door.position.y - 1,
        width: door.orientation === 'horizontal' ? door.size : 2,
        height: door.orientation === 'vertical' ? door.size : 2,
      }));

    const otherCharactersAsWalls: Wall[] = CHARACTERS
      .filter(char => char.id !== selectedCharacter.id)
      .map(char => {
        const charPos = characterStates[char.id].position;
        return {
          id: 2000 + char.id,
          x: charPos.x - PLAYER_SIZE.width / 2,
          y: charPos.y - PLAYER_SIZE.height / 2,
          width: PLAYER_SIZE.width,
          height: PLAYER_SIZE.height,
        };
      });

    return [...WALLS, ...closedDoorsAsWalls, ...otherCharactersAsWalls];
  }, [doorStatuses, selectedCharacter.id, characterStates, doors]);

  const findNearbyInteractable = useCallback((position: { x: number; y: number }) => {
    let closestDoor: Door | null = null;
    let minDoorDist = Infinity;
    for (const door of doors) {
      const dx = position.x - door.position.x;
      const dy = position.y - door.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < INTERACTION_DISTANCE && distance < minDoorDist) {
        minDoorDist = distance;
        closestDoor = door;
      }
    }
    setNearbyDoorId(closestDoor ? closestDoor.id : null);
  }, [doors]);

  const handleCharacterSelectImpl = useCallback((character: Character) => {
    if (character.id === selectedCharacter.id) return;
    setSelectedCharacter(character);
    setLastOpenedDoor(null);
    addLog(`Control switched to: ${character.name}.`, 'info', { action: 'switch_char' }, character.id);
  }, [selectedCharacter.id, addLog]);

  const handleToggleDoor = useCallback((doorId: number) => {
    setDoorStatuses(prev => {
      const isOpen = !prev[doorId].isOpen;
      const doorName = doors.find(d => d.id === doorId)?.name || 'Unknown Door';
      addLog(`${doorName} ${isOpen ? 'UNLOCKED' : 'LOCKED'}.`, isOpen ? 'success' : 'info', { action: 'toggle_door', doorId, doorName }, selectedCharacter.id);

      if (isOpen) {
        setLastOpenedDoor({ doorId, openedFromPosition: currentPosition });
      }

      return {
        ...prev,
        [doorId]: { isOpen, feedback: isOpen ? 'granted' : 'idle' }
      };
    });
  }, [addLog, currentPosition, doors]);

  // Game Loop / Key Handler
  useGameLoop({
    doors,
    mapConfig,
    modalState,
    passwordState,
    keypadState,
    nearbyDoorId,
    handleAttemptAccess,
    findNearbyInteractable,
    getObstacles,
    lastOpenedDoor,
    setLastOpenedDoor,
    addLog,
    selectedCharacter,
    setDoorStatuses,
    setCharacterStates,
    currentPosition,
    isDashboardOpen,
    playerSpeed: PLAYER_SPEED,
    playerSize: PLAYER_SIZE,
    onFireAlarm: () => setIsFireModalOpen(true)
  });

  // Wrapped Handler for KeypadModal success
  const handlePinSuccess = useCallback(async (pin: string) => {
    const door = keypadState.pendingDoor;
    const rfid = keypadState.rfidCode;

    if (!door || !rfid) return;

    // Use the new hook logic - pass PIN
    const result = await handleAccessRequest(rfid, door.id, pin, undefined);

    if (result.success) {
      // Post-success logic for registration
      if (door.id === 1 && !isRegistered) {
        setCharacterStates(prev => ({ ...prev, [selectedCharacter.id]: { ...prev[selectedCharacter.id], isRegistered: true } }));
        addLog(`${selectedCharacter.name} successfully registered at the Main Entrance.`, 'success');
      }
    }
  }, [keypadState, handleAccessRequest, selectedCharacter, isRegistered, addLog]);

  // Wrapped Handler for PasswordModal success
  const handlePasswordSuccess = useCallback(async (password: string) => {
    const door = passwordState.pendingDoor;
    const rfid = passwordState.rfidCode;

    if (!door || !rfid) return;

    // Pass Password (pin is undefined)
    const result = await handleAccessRequest(rfid, door.id, undefined, password);

    if (result.success) {
      if (door.id === 1 && !isRegistered) {
        setCharacterStates(prev => ({ ...prev, [selectedCharacter.id]: { ...prev[selectedCharacter.id], isRegistered: true } }));
        addLog(`${selectedCharacter.name} successfully registered at the Main Entrance.`, 'success');
      }
    }
  }, [passwordState, handleAccessRequest, selectedCharacter, isRegistered, addLog]);

  // Wrapped Handler for RFID Scan
  const handleScanRfid = useCallback((enteredCode: string, doorOverride?: Door) => {
    // If overridden, use that door. Else use modal target.
    const target = doorOverride || modalState.targetDoor;
    if (!target) return;

    handleAccessRequest(enteredCode, target.id);
  }, [modalState.targetDoor, handleAccessRequest]);

  // Global RFID Listener
  useEffect(() => {
    if (lastScannedCode) {
      if (modalState.targetDoor) {
        handleScanRfid(lastScannedCode);
      } else if (nearbyDoorId) {
        const door = doors.find(d => d.id === nearbyDoorId);
        if (door) {
          setModalState({ isOpen: true, targetDoor: door });
          // We could auto-trigger here if we trust the loop delay, but safer to let user see modal or just call it directly?
          // Calling directly might bypass the modal rendering which is fine for "instant" feel.
          handleAccessRequest(lastScannedCode, door.id);
        }
      }
      clearScan();
    }
  }, [lastScannedCode, nearbyDoorId, handleScanRfid, clearScan, modalState.targetDoor, handleAccessRequest, doors]);

  // System Events Logic
  const handleSystemEvent = useCallback(async (event: 'lockdown' | 'firedrill' | 'reset') => {
    switch (event) {
      case 'lockdown':
        const lockedState = doors.reduce((acc, door) => ({ ...acc, [door.id]: { isOpen: false, feedback: 'denied' } }), {});
        setDoorStatuses(lockedState as DoorStatusMap);
        addLog('⚠️ GLOBAL LOCKDOWN INITIATED. All doors sealed.', 'error');
        break;
      case 'firedrill':
        const openState = doors.reduce((acc, door) => ({ ...acc, [door.id]: { isOpen: true, feedback: 'granted' } }), {});
        setDoorStatuses(openState as DoorStatusMap);
        addLog('🔥 FIRE DRILL ACTIVE. All emergency exits opened.', 'success');
        break;
      case 'reset':
        try {
          await api.resetSystem();
          // Reset local state
          setLogMessages([]); // Clear local logs immediately
          setNotifications([]);
          setDoorStatuses(doors.reduce((acc, door) => ({ ...acc, [door.id]: { isOpen: false, feedback: 'idle' } }), {}));
          // Fetch fresh logs (which should just comprise the "Reset Complete" message)
          const freshLogs = await api.getLogs();
          setLogMessages(freshLogs);

          // Fetch fresh characters to reset positions
          const freshChars = await api.getCharacters();
          setCharacters(freshChars);
          // Reset interaction state
          setNearbyDoorId(null);
          setLastOpenedDoor(null);
        } catch (e) {
          console.error("Reset failed", e);
          addLog("System Reset Failed.", "error");
        }
        break;
    }
  }, [addLog, doors]);

  if (isDashboardOpen) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans`}>
        <AdminDashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          doorStatuses={doorStatuses}
          onToggleDoor={handleToggleDoor}
          logs={logMessages}
          characters={characters}
          characterStates={characterStates}
          onSystemEvent={handleSystemEvent}
          // isBlackout prop removed
          onAddCharacter={handleAddCharacter}
          doors={doors}
        />
        <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="text-center mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10"></div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wider mb-2">
          RFID Access Control System
        </h1>
        <div className="flex items-center justify-center space-x-2 text-slate-400 mt-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${isRegistered
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
            <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {isRegistered ? 'System Active' : 'Registration Required'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-sm">
            {!isRegistered ? "Approach Main Entrance to register" : "All systems operational"}
          </span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-3">
          <section className="glass rounded-xl p-5 hover-lift">
            <h2 className="text-xl font-semibold text-slate-200 pb-3 mb-4 flex items-center border-b border-slate-700/50">
              <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Select Operative
            </h2>
            <div className="space-y-3">
              {characters.map(char => (
                <CharacterCard key={char.id} character={char} isSelected={selectedCharacter.id === char.id} onSelect={handleCharacterSelectImpl} />
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-6">
          {/* Removed overflow-hidden to show exterior footpath */}
          <section className="relative aspect-video bg-slate-900 rounded-lg shadow-2xl border border-slate-700 group">
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 bg-scanline z-0 opacity-50 pointer-events-none rounded-lg overflow-hidden"></div>

            {/* Exterior Footpath Area (Outside Map) */}
            <div className="absolute w-full pointer-events-none" style={{
              top: '100%',
              height: '30%', // Extended height for exterior area
              backgroundColor: '#334155', // slate-700 (Lighter floor)
              backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 1,
              borderBottomLeftRadius: '0.5rem',
              borderBottomRightRadius: '0.5rem'
            }} />

            {/* Room Labels */}
            {/* Blueprint Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Room Labels */}
            {ROOMS.map(room => (
              <div key={room.id} style={{ position: 'absolute', left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }} className="flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  {/* Technical Corner Markers */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-500/30"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-500/30"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-500/30"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-500/30"></div>

                  <span className="text-slate-400/20 font-mono font-bold text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs xl:text-sm uppercase select-none tracking-[0.2em] text-center whitespace-nowrap rotate-0">
                    {room.name}
                  </span>
                </div>
              </div>
            ))}

            {WALLS.map(wall => (
              <div key={wall.id} className="absolute bg-slate-600 shadow-xl border-slate-500" style={{ left: `${wall.x}%`, top: `${wall.y}%`, width: `${wall.width}%`, height: `${wall.height}%` }} />
            ))}
            {doors.map(door => (
              <DoorCard key={door.id} door={door} status={doorStatuses[door.id]} isNearby={nearbyDoorId === door.id} />
            ))}


            {characters.filter(char => char.id !== selectedCharacter.id).map(char => {
              const charState = characterStates[char.id];
              if (!charState) return null;
              return (
                <div
                  key={`inactive-${char.id}`}
                  className="absolute transition-transform duration-100 ease-linear z-10"
                  style={{
                    left: `${charState.position.x}%`, top: `${charState.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${PLAYER_SIZE.width}%`, height: `${PLAYER_SIZE.height}%`,
                  }}
                >
                  <div className="relative group flex flex-col items-center justify-center w-full h-full">
                    {/* Add a ring to make them pop */}
                    <img src={char.avatar} alt={char.name} className="w-10 h-10 rounded-full border-2 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <div className="absolute -top-6 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded border border-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {char.name}
                    </div>
                  </div>
                </div>
              );
            })}

            <Player character={selectedCharacter} position={currentPosition} />

            <div className="absolute left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-xl text-slate-300 text-sm backdrop-blur-md border border-slate-600 shadow-lg z-50 flex gap-4 whitespace-nowrap" style={{ top: '135%' }}>
              <span className="flex items-center gap-2">
                <kbd className="font-sans px-2 py-0.5 text-xs border border-slate-500 rounded bg-slate-800">WASD</kbd>
                <span className="text-slate-500">/</span>
                <kbd className="font-sans px-2 py-0.5 text-xs border border-slate-500 rounded bg-slate-800">Arrows</kbd>
                Move
              </span>
              <span className="w-px h-4 bg-slate-600 self-center"></span>
              <span className="flex items-center gap-2"><kbd className="font-sans px-2 py-0.5 text-xs border border-slate-500 rounded bg-slate-800">E</kbd> Interact</span>
              <span className="w-px h-4 bg-slate-600 self-center"></span>
              <span className="flex items-center gap-2"><kbd className="font-sans px-2 py-0.5 text-xs border border-red-500/50 rounded bg-red-900/20 text-red-400">F</kbd> Alarm</span>
            </div>
            {/* FIRE ALARM BUTTON (VISUAL INDICATOR - LOBBY TOP-LEFT) */}
            <div className="absolute left-[3%] top-[68%] z-30 group pointer-events-none">
              <div
                className="relative w-10 h-10 rounded-full bg-red-600 border-2 border-red-800 shadow-[0_0_15px_rgba(239,68,68,0.6)] flex items-center justify-center animate-pulse"
              >
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                <svg className="w-6 h-6 text-white drop-shadow-md relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded border border-red-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto backdrop-blur-md">
                PRESS 'F' <br /> TO ACTIVATE
              </div>
            </div>

          </section>
        </div>

        <div className="lg:col-span-3">
          <ControlPanel
            character={selectedCharacter}
            logs={logMessages}
            isRegistered={isRegistered}
            onOpenDashboard={() => setIsDashboardOpen(true)}
          />
        </div>
      </main>

      {modalState.isOpen && (modalState.targetDoor || modalState.targetObject) && (
        <div className="z-50 relative">
          <RfidModal
            isOpen={modalState.isOpen}
            onClose={() => setModalState({ isOpen: false, targetDoor: null })}
            onScan={handleScanRfid}
            targetName={modalState.targetDoor?.name || ''}
            isRegistration={modalState.targetDoor?.id === 1 && !isRegistered}
          />
        </div>
      )}

      {keypadState.isOpen && (
        <KeypadModal
          isOpen={keypadState.isOpen}
          onClose={() => setKeypadState({ isOpen: false, pendingDoor: null, rfidCode: null })}
          onSuccess={handlePinSuccess}
          rfidCode={selectedCharacter.rfidCode}
        />
      )}

      {passwordState.isOpen && (
        <PasswordModal
          isOpen={passwordState.isOpen}
          onClose={() => setPasswordState({ isOpen: false, pendingDoor: null, rfidCode: null })}
          onSuccess={handlePasswordSuccess}
          targetName={passwordState.pendingDoor?.name || 'Secure Area'}
          identity={passwordState.identity}
        />
      )}

      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />

      <FireAlarmModal
        isOpen={isFireModalOpen}
        onClose={() => setIsFireModalOpen(false)}
        onConfirm={() => {
          if (!isFireModalOpen) return;
          addLog("MANUAL FIRE ALARM TRIGGERED", "error", { action: 'manual_alarm', location: 'Lobby' }, selectedCharacter.id);
          setIsFireModalOpen(false);
        }}
      />
    </div>
  );
};


import { RfidStatus } from './components/ui/RfidStatus';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [initialCharacters, setInitialCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configData, charactersData] = await Promise.all([
          api.getConfig(),
          api.getCharacters()
        ]);
        setConfig(configData);
        setInitialCharacters(charactersData);
      } catch (err) {
        console.error("Failed to load system data:", err);
        setError(err instanceof Error ? err.message : "Failed to load system configuration. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="animate-pulse tracking-widest">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-mono p-4">
        <div className="bg-red-950/20 p-8 rounded-lg border border-red-500/50 text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">SYSTEM CRITICAL ERROR</h2>
          <p className="mb-6 text-red-300">{error || "Configuration Load Failed"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded transition-colors text-red-400"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <RfidProvider>
        {/* <RfidStatus /> - Hidden per user request */}
        <GameContent config={config} initialCharacters={initialCharacters} />
      </RfidProvider>
    </ErrorBoundary>
  );
};

export default App;
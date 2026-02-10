import React, { useEffect, useRef } from 'react';
import { Door, Character, Wall } from '@/types';

interface UseGameLoopProps {
    doors: Door[];
    mapConfig: any;
    modalState: { isOpen: boolean; targetDoor: Door | null };
    nearbyDoorId: number | null;
    handleAttemptAccess: (target: Door) => void;
    findNearbyInteractable: (position: { x: number; y: number }) => void;
    getObstacles: () => Wall[];
    lastOpenedDoor: { doorId: number; openedFromPosition: { x: number; y: number } } | null;
    setLastOpenedDoor: React.Dispatch<React.SetStateAction<{ doorId: number; openedFromPosition: { x: number; y: number } } | null>>;
    addLog: (text: string, type: 'success' | 'error' | 'info') => void;
    selectedCharacter: Character;
    setDoorStatuses: React.Dispatch<React.SetStateAction<Record<number, { isOpen: boolean; feedback: 'idle' | 'granted' | 'denied' }>>>;
    setCharacterStates: React.Dispatch<React.SetStateAction<Record<number, { position: { x: number; y: number }; isRegistered: boolean }>>>;
    currentPosition: { x: number; y: number };
    isDashboardOpen: boolean;
    passwordState: { isOpen: boolean };
    keypadState: { isOpen: boolean };
    playerSpeed?: number;
    playerSize?: { width: number; height: number };
    onFireAlarm: () => void;
}

// Add API import
import { api } from '../services/api';

export const useGameLoop = ({
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
    playerSpeed = 1.5,
    playerSize = { width: 4, height: 6 },
    onFireAlarm
}: UseGameLoopProps) => {

    const keydownHandlerRef = useRef({
        doors, mapConfig, modalState, passwordState, keypadState, nearbyDoorId, handleAttemptAccess, findNearbyInteractable,
        getObstacles, lastOpenedDoor, addLog, selectedCharacter, setDoorStatuses,
        setCharacterStates, setLastOpenedDoor, currentPosition, isDashboardOpen, onFireAlarm
    });

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        keydownHandlerRef.current = {
            doors, mapConfig, modalState, passwordState, keypadState, nearbyDoorId, handleAttemptAccess, findNearbyInteractable,
            getObstacles, lastOpenedDoor, addLog, selectedCharacter, setDoorStatuses,
            setCharacterStates, setLastOpenedDoor, currentPosition, isDashboardOpen, onFireAlarm
        };
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const {
                doors, mapConfig, modalState, passwordState, keypadState, nearbyDoorId, handleAttemptAccess, findNearbyInteractable,
                getObstacles, lastOpenedDoor, addLog, selectedCharacter, setDoorStatuses,
                setCharacterStates, setLastOpenedDoor, currentPosition, isDashboardOpen, onFireAlarm
            } = keydownHandlerRef.current;

            if (modalState.isOpen || passwordState.isOpen || keypadState.isOpen || isDashboardOpen) return;
            e.preventDefault();

            if (e.key === 'e' || e.key === 'E') {
                if (nearbyDoorId) {
                    const target = doors.find(d => d.id === nearbyDoorId);
                    if (target) handleAttemptAccess(target);
                }
                return;
            }

            // F Key - Fire Alarm Interaction
            if (e.key === 'f' || e.key === 'F') {
                // Fire Alarm Location (Lobby Top-Left: x=3, y=68)
                const fireAlarmPos = { x: 3, y: 68 };
                const distance = Math.sqrt(
                    Math.pow(currentPosition.x - fireAlarmPos.x, 2) +
                    Math.pow(currentPosition.y - fireAlarmPos.y, 2)
                );

                // Interaction Distance = 10
                if (distance < 10) {
                    onFireAlarm();
                }
                return;
            }

            let newPos = { ...currentPosition };
            switch (e.key) {
                case 'ArrowUp': case 'w': newPos.y -= playerSpeed; break;
                case 'ArrowDown': case 's': newPos.y += playerSpeed; break;
                case 'ArrowLeft': case 'a': newPos.x -= playerSpeed; break;
                case 'ArrowRight': case 'd': newPos.x += playerSpeed; break;
                default: return;
            }

            // Map Bounds Check
            if (newPos.x < 0) newPos.x = 0;
            if (newPos.x > mapConfig.width) newPos.x = mapConfig.width;
            if (newPos.y < 0) newPos.y = 0;
            if (newPos.y > mapConfig.height) newPos.y = mapConfig.height;

            const playerRect = {
                x: newPos.x - playerSize.width / 2,
                y: newPos.y - playerSize.height / 2,
                width: playerSize.width,
                height: playerSize.height,
            };

            if (lastOpenedDoor) {
                const door = doors.find(d => d.id === lastOpenedDoor.doorId);
                if (door) {
                    const doorRect = {
                        x: door.orientation === 'horizontal' ? door.position.x - door.size / 2 : door.position.x - 1,
                        y: door.orientation === 'vertical' ? door.position.y - door.size / 2 : door.position.y - 1,
                        width: door.orientation === 'horizontal' ? door.size : 2,
                        height: door.orientation === 'vertical' ? door.size : 2,
                    };
                    const isOverlapping =
                        playerRect.x < doorRect.x + doorRect.width && playerRect.x + playerRect.width > doorRect.x &&
                        playerRect.y < doorRect.y + doorRect.height && playerRect.y + playerRect.height > doorRect.y;

                    const openedFromPosition = lastOpenedDoor.openedFromPosition;
                    let wasOnSideA, isOnSideA;
                    if (door.orientation === 'horizontal') {
                        wasOnSideA = openedFromPosition.y > door.position.y; isOnSideA = newPos.y > door.position.y;
                    } else {
                        wasOnSideA = openedFromPosition.x > door.position.x; isOnSideA = newPos.x > door.position.x;
                    }
                    if (wasOnSideA !== isOnSideA && !isOverlapping) {
                        setDoorStatuses(prev => ({ ...prev, [door.id]: { ...prev[door.id], isOpen: false, feedback: 'idle' } }));
                        addLog(`${door.name} closed automatically.`, 'info');
                        setLastOpenedDoor(null);
                    }
                }
            }

            const obstacles = getObstacles();
            for (const wall of obstacles) {
                if (
                    playerRect.x < wall.x + wall.width && playerRect.x + playerRect.width > wall.x &&
                    playerRect.y < wall.y + wall.height && playerRect.y + playerRect.height > wall.y
                ) { return; }
            }

            setCharacterStates(prev => ({ ...prev, [selectedCharacter.id]: { ...prev[selectedCharacter.id], position: newPos } }));
            findNearbyInteractable(newPos);

            // Debounced Save to Backend
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                api.updateCharacter(selectedCharacter.id, { position: newPos })
                    .catch(err => console.error("Failed to persist position:", err));
            }, 500);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [playerSpeed, playerSize]);
};

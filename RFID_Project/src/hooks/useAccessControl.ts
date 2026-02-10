import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import { playSuccess, playError } from '../utils/soundEffects';
import { Door, LogMessage } from '../types';

interface UseAccessControlProps {
    doors: Door[];
    addLog: (text: string, type: LogMessage['type'], metadata?: any, userId?: number) => void;
    setDoorStatuses: React.Dispatch<React.SetStateAction<Record<number, { isOpen: boolean; feedback: 'idle' | 'granted' | 'denied' }>>>;
    setLastOpenedDoor: (val: any) => void;
    currentPosition: { x: number; y: number };
    setCharacterStates: React.Dispatch<React.SetStateAction<Record<number, { position: { x: number; y: number }; isRegistered: boolean }>>>;
}

export const useAccessControl = ({ doors, addLog, setDoorStatuses, setLastOpenedDoor, currentPosition, setCharacterStates }: UseAccessControlProps) => {
    const [modalState, setModalState] = useState<{ isOpen: boolean; targetDoor: Door | null }>({ isOpen: false, targetDoor: null });
    const [passwordState, setPasswordState] = useState<{ isOpen: boolean; pendingDoor: Door | null; rfidCode: string | null; identity: string | null }>({ isOpen: false, pendingDoor: null, rfidCode: null, identity: null });
    const [keypadState, setKeypadState] = useState<{ isOpen: boolean; pendingDoor: Door | null; rfidCode: string | null }>({ isOpen: false, pendingDoor: null, rfidCode: null });

    const handleAccessRequest = useCallback(async (rfidCode: string, doorId: number, pin?: string, password?: string) => {
        try {
            const response = await api.requestAccess({ rfidCode, doorId, pin, password });

            if (response.success) {
                // Access Granted
                playSuccess();
                setDoorStatuses(prev => ({
                    ...prev,
                    [doorId]: { isOpen: true, feedback: 'granted' }
                }));

                setLastOpenedDoor({ doorId, openedFromPosition: currentPosition });

                // Sync Registration State if updated
                if (response.user?.isRegistered && response.user?.id) {
                    const uid = response.user.id;
                    setCharacterStates((prev: any) => ({
                        ...prev,
                        [uid]: { ...prev[uid], isRegistered: true }
                    }));
                }

                // Log (Frontend only - Backend already logged it)
                addLog(response.message, 'access_granted', { doorId, skipPersistence: true }, response.user?.id);

                // Close modals
                setModalState({ isOpen: false, targetDoor: null });
                setKeypadState({ isOpen: false, pendingDoor: null, rfidCode: null });
                setPasswordState({ isOpen: false, pendingDoor: null, rfidCode: null, identity: null });

            } else if (response.requirePin) {
                // PIN Required
                addLog('Verifying Identity... PIN Required.', 'info', { doorId });
                const door = doors.find(d => d.id === doorId) || null;
                setModalState({ isOpen: false, targetDoor: null });
                setKeypadState({ isOpen: true, pendingDoor: door, rfidCode }); // Store RFID for next step
                setPasswordState({ isOpen: false, pendingDoor: null, rfidCode: null, identity: null });

            } else if (response.requirePassword) {
                // Password Required
                addLog('Verifying Identity... Password Required.', 'info', { doorId });
                const door = doors.find(d => d.id === doorId) || null;
                setModalState({ isOpen: false, targetDoor: null });
                setPasswordState({ isOpen: true, pendingDoor: door, rfidCode, identity: response.character?.name || null }); // Store RFID & Identity
                setKeypadState({ isOpen: false, pendingDoor: null, rfidCode: null });

            } else {
                // Denied or Error
                playError();
                setDoorStatuses(prev => ({
                    ...prev,
                    [doorId]: { ...prev[doorId], feedback: 'denied' }
                }));
                addLog(response.message, 'access_denied', { doorId, skipPersistence: true });

                setModalState({ isOpen: false, targetDoor: null });
                // Don't auto-close auth modals on failure immediately, allow retry? 
                // For security simulation, maybe force close to re-scan card?
                // Let's force close to simulate "Transaction Failed".
                setKeypadState({ isOpen: false, pendingDoor: null, rfidCode: null });
                setPasswordState({ isOpen: false, pendingDoor: null, rfidCode: null, identity: null });

                setTimeout(() => {
                    setDoorStatuses(prev => {
                        if (prev[doorId].isOpen) return prev;
                        return { ...prev, [doorId]: { ...prev[doorId], feedback: 'idle' } };
                    });
                }, 1500);
            }
            return response;
        } catch (err) {
            console.error(err);
            addLog("System Error: Unable to verify access.", "error");
            return { success: false, message: 'System Error' };
        }
    }, [addLog, setDoorStatuses, setLastOpenedDoor, currentPosition]);

    return {
        modalState,
        setModalState,
        keypadState,
        setKeypadState,
        passwordState,
        setPasswordState,
        handleAccessRequest
    };
};

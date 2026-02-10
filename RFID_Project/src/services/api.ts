
import { Character, LogMessage } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = {
    // Characters
    getCharacters: async () => {
        const res = await fetch(`${API_URL}/characters`);
        if (!res.ok) throw new Error('Failed to fetch characters');
        return res.json();
    },

    createCharacter: async (character: Character) => {
        const res = await fetch(`${API_URL}/characters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(character),
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Failed to create character' }));
            throw new Error(error.message || 'Failed to create character');
        }
        return res.json();
    },

    updateCharacter: async (id: number, charData: Partial<Character>) => {
        const res = await fetch(`${API_URL}/characters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(charData),
        });
        if (!res.ok) throw new Error('Failed to update character');
        return res.json();
    },

    deleteCharacter: async (id: number) => {
        const res = await fetch(`${API_URL}/characters/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete character');
        return res.json();
    },

    // Configuration
    getConfig: async () => {
        const res = await fetch(`${API_URL}/config`);
        if (!res.ok) throw new Error('Failed to fetch configuration');
        return res.json();
    },

    // Access Control
    requestAccess: async (data: { rfidCode: string; doorId: number; pin?: string; password?: string }) => {
        const res = await fetch(`${API_URL}/access/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        // Return mostly the JSON but handle status
        // success is in json.success
        return json;
    },

    // Logs
    getLogs: async () => {
        const res = await fetch(`${API_URL}/logs`);
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
    },

    createLog: async (log: LogMessage) => {
        const res = await fetch(`${API_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
        });
        if (!res.ok) throw new Error('Failed to create log');
        return res.json();
    },

    // Alerts
    getAlerts: async () => {
        const res = await fetch(`${API_URL}/alerts`);
        if (!res.ok) throw new Error('Failed to fetch alerts');
        return res.json();
    },

    createAlert: async (alert: any) => {
        const res = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
        });
        if (!res.ok) throw new Error('Failed to create alert');
        return res.json();
    },

    updateAlert: async (id: number, alertData: any) => {
        const res = await fetch(`${API_URL}/alerts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertData),
        });
        if (!res.ok) throw new Error('Failed to update alert');
        return res.json();
    },

    deleteAlert: async (id: number) => {
        const res = await fetch(`${API_URL}/alerts/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete alert');
        return res.json();
    },

    // Notifications
    sendAlertEmail: async (data: { subject: string; text: string }) => {
        const res = await fetch(`${API_URL}/notifications/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to send email notification');
        return res.json();
    },

    // System
    resetSystem: async () => {
        const res = await fetch(`${API_URL}/system/reset`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to reset system');
        return res.json();
    }
};

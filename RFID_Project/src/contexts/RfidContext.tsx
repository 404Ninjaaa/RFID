import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface RfidContextType {
    lastScannedCode: string | null;
    isConnected: boolean;
    clearScan: () => void;
    simulateScan: (code: string) => void;
}

const RfidContext = createContext<RfidContextType | undefined>(undefined);

export const RfidProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = () => {
        // Prevent multiple connections
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket('ws://localhost:8765');

        ws.onopen = () => {
            console.log('[RfidProvider] Connected to RFID Server');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const code = event.data;
            if (code && typeof code === 'string') {
                const cleanCode = code.trim();
                console.log('[RfidProvider] Received Code:', cleanCode);
                setLastScannedCode(cleanCode);
            }
        };

        ws.onclose = () => {
            console.log('[RfidProvider] Disconnected. Retrying in 3s...');
            setIsConnected(false);
            wsRef.current = null;
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
            console.error('[RfidProvider] Connection Error:', err);
            ws.close();
        };

        wsRef.current = ws;
    };

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    const clearScan = () => setLastScannedCode(null);

    // Helper for manual simulation (e.g. via file upload)
    const simulateScan = (code: string) => {
        setLastScannedCode(code);
    };

    return (
        <RfidContext.Provider value={{ lastScannedCode, isConnected, clearScan, simulateScan }}>
            {children}
        </RfidContext.Provider>
    );
};

export const useRfid = () => {
    const context = useContext(RfidContext);
    if (context === undefined) {
        throw new Error('useRfid must be used within a RfidProvider');
    }
    return context;
};

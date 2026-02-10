import React, { useState } from 'react';
import { Character, LogMessage } from '@/types';
import { ROOMS } from '@/constants';

interface UsersTabProps {
    characters: Character[];
    logs: LogMessage[];
    onAddCharacter: (char: Character) => void;
    onUpdateCharacter: (char: Character) => void;
    onDeleteCharacter: (id: number) => Promise<boolean>;
    doors: any[];
    characterStates: Record<number, { isRegistered: boolean; position: { x: number; y: number } }>;
}

export const UsersTab: React.FC<UsersTabProps> = ({
    characters,
    logs,
    onAddCharacter,
    onUpdateCharacter,
    onDeleteCharacter,
    doors,
    characterStates
}) => {
    const [selectedUser, setSelectedUser] = useState<Character | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', role: 'Staff' as any, avatarCode: 1, pin: '', password: '', rfid: '' });
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const handleCreateClick = () => {
        setIsEditing(false);
        setNewUserForm({ name: '', role: 'Staff', avatarCode: 11, pin: '', password: '', rfid: '' });
        setIsCreateModalOpen(true);
    };

    const handleEditClick = (char: Character) => {
        setSelectedUser(char);
        setIsEditing(true);
        let code = 1;
        if (char.avatar.includes('img=')) {
            code = parseInt(char.avatar.split('img=')[1]) - 10 || 1;
        } else if (char.avatar.includes('u=')) {
            code = parseInt(char.avatar.split('u=')[1]) || 1;
        }

        setNewUserForm({
            name: char.name,
            role: char.role,
            avatarCode: code,
            pin: '',
            password: '',
            rfid: char.rfidCode || ''
        });
        setIsCreateModalOpen(true);
    };

    // Helper to find current room based on coordinates
    const getCurrentZone = (charId: number) => {
        const state = characterStates[charId];
        if (!state) return 'Unknown';
        const { x, y } = state.position;

        // Check rooms
        for (const room of ROOMS) {
            // Simple bound check (percentages)
            if (x >= room.x && x <= room.x + room.width &&
                y >= room.y && y <= room.y + room.height) {
                return room.name;
            }
        }

        // Check exterior/halls
        if (y > 100) return 'Exterior Grounds';
        if (x > 30 && x < 70 && y > 20 && y < 90) return 'Central Hallway';

        return 'Corridor';
    };

    const getRecentActivity = (charId: number) => {
        return logs
            .filter(l => l.user === charId || l.text.toLowerCase().includes(selectedUser?.name.toLowerCase() || ''))
            .slice(0, 10);
    };

    return (
        <div className="h-full flex gap-6 animate-in fade-in">
            {/* List Side */}
            <div className="w-1/3 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-white tracking-tight">Active Personnel</h3>
                    <button
                        onClick={handleCreateClick}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center"
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        RECRUIT
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {characters.map(char => {
                        const status = characterStates[char.id];
                        const isRegistered = status?.isRegistered;

                        return (
                            <div
                                key={char.id}
                                onClick={() => setSelectedUser(char)}
                                className={`p-3 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border ${selectedUser?.id === char.id
                                    ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                    : 'bg-black/20 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="relative">
                                    <img src={char.avatar} className="w-10 h-10 rounded-xl bg-slate-800 object-cover" />
                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-sm truncate ${selectedUser?.id === char.id ? 'text-white' : 'text-slate-200'}`}>{char.name}</h4>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedUser?.id === char.id ? 'text-indigo-200' : 'text-slate-500'}`}>{char.role}</p>
                                </div>
                                {selectedUser?.id === char.id && (
                                    <svg className="w-5 h-5 text-white animate-in slide-in-from-left-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Profile Side */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 relative overflow-hidden flex flex-col">
                {selectedUser ? (
                    <div className="animate-in fade-in slide-in-from-right-4 h-full flex flex-col overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <img src={selectedUser.avatar} className="w-32 h-32 rounded-3xl object-cover relative z-10 border-4 border-slate-800 shadow-2xl" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-4xl font-black text-white tracking-tight">{selectedUser.name}</h2>
                                        <button onClick={() => handleEditClick(selectedUser)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${selectedUser.role === 'Admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                            {selectedUser.role} clearance
                                        </span>
                                        <span className="px-3 py-1 rounded-lg bg-slate-800 border border-white/5 text-slate-400 text-xs font-mono tracking-widest">
                                            ID: {selectedUser.rfidCode || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {/* Current Location */}
                            <div className="bg-black/20 rounded-2xl p-5 border border-white/5 group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:text-indigo-300">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Location</h4>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-white truncate">
                                        {getCurrentZone(selectedUser.id)}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 animate-pulse">● LIVE</span>
                                </div>
                            </div>

                            {/* Access Grants */}
                            <div className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-emerald-500/30 transition-all">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Access Grants</h4>
                                <div className="text-3xl font-black text-emerald-500">
                                    {logs.filter(l => l.user === selectedUser.id || (l.type === 'success' && l.text.toLowerCase().includes(selectedUser.name.toLowerCase()))).length}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Successful entries</div>
                            </div>

                            {/* Access Denied */}
                            <div className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-rose-500/30 transition-all">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Access Denied</h4>
                                <div className="text-3xl font-black text-rose-500">
                                    {logs.filter(l => (l.type === 'error' || l.type === 'access_denied') && (l.user === selectedUser.id || l.text.toLowerCase().includes(selectedUser.name.toLowerCase()))).length}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">Failed attempts</div>
                            </div>
                        </div>

                        {/* Recent Activity Log */}
                        <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                                {getRecentActivity(selectedUser.id).length > 0 ? (
                                    getRecentActivity(selectedUser.id).map(log => (
                                        <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm flex gap-3 items-start">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'success' || log.type === 'access_granted' ? 'bg-emerald-500' : log.type === 'error' || log.type === 'access_denied' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                            <div>
                                                <div className="text-slate-300">{log.text}</div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-sm italic">No recent activity recorded.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-400 mb-2">No Operative Selected</h3>
                        <p className="max-w-xs text-center text-sm">Select personnel from the list to view their detailed profile, activity logs, and status.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="bg-[#0f172a] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-8">
                            <h3 className="text-2xl font-black text-white mb-2">{isEditing ? 'Edit Operative' : 'Recruit New Operative'}</h3>
                            <div className="space-y-6 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operative Name</label>
                                    <input
                                        value={newUserForm.name}
                                        onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role & Clearance</label>
                                        <div className="space-y-2">
                                            {['Admin', 'Engineer', 'Security', 'Staff', 'Visitor'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => setNewUserForm({ ...newUserForm, role: role as any })}
                                                    className={`w-full px-4 py-2 rounded-lg text-sm font-bold text-left transition-all border ${newUserForm.role === role
                                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Profile Avatar</label>
                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-4">
                                            <img
                                                src={`https://i.pravatar.cc/150?img=${newUserForm.avatarCode + 10}`}
                                                className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl"
                                                alt="Avatar Preview"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setNewUserForm(prev => ({ ...prev, avatarCode: Math.max(1, prev.avatarCode - 1) }))}
                                                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => setNewUserForm(prev => ({ ...prev, avatarCode: Math.min(60, prev.avatarCode + 1) }))}
                                                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">IMG_ID: {newUserForm.avatarCode + 10}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Credentials Section */}
                                <div className="space-y-4 pt-2 border-t border-white/5">
                                    <h4 className="text-sm font-bold text-slate-300">Security Credentials</h4>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">RFID Code</label>
                                            <input
                                                value={newUserForm.rfid}
                                                onChange={e => setNewUserForm({ ...newUserForm, rfid: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-slate-600"
                                                placeholder="e.g. D4 C6 4D 08"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                                            <input
                                                value={newUserForm.password}
                                                onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600"
                                                placeholder={isEditing ? "(Unchanged)" : "e.g. admin@123"}
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    {isEditing && (
                                        <button
                                            onClick={async () => {
                                                if (selectedUser && selectedUser.id <= 5) return;
                                                if (deleteConfirm) {
                                                    await onDeleteCharacter(selectedUser!.id);
                                                    setIsCreateModalOpen(false);
                                                    setSelectedUser(null);
                                                } else {
                                                    setDeleteConfirm(true);
                                                }
                                            }}
                                            disabled={selectedUser && selectedUser.id <= 5}
                                            className={`px-4 py-3 rounded-xl font-bold transition-all ${selectedUser && selectedUser.id <= 5
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                                : 'text-rose-400 hover:bg-rose-500/10'
                                                }`}
                                        >
                                            {selectedUser && selectedUser.id <= 5 ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    Protected
                                                </span>
                                            ) : (
                                                deleteConfirm ? 'Confirm Delete?' : 'Delete'
                                            )}
                                        </button>
                                    )}
                                    <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-3 text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
                                    <button
                                        onClick={() => {
                                            const defaultPin = '123456';
                                            const passToSave = newUserForm.password || `${newUserForm.role.toLowerCase()}@123`;
                                            const rfidToSave = newUserForm.rfid || `DF ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`;

                                            if (isEditing && selectedUser) {
                                                onUpdateCharacter({
                                                    ...selectedUser,
                                                    name: newUserForm.name,
                                                    role: newUserForm.role,
                                                    rfidCode: newUserForm.rfid || selectedUser.rfidCode,
                                                    avatar: `https://i.pravatar.cc/150?img=${newUserForm.avatarCode + 10}`,
                                                    pin: newUserForm.pin,
                                                    password: newUserForm.password
                                                });
                                            } else {
                                                onAddCharacter({
                                                    id: Date.now(),
                                                    name: newUserForm.name,
                                                    role: newUserForm.role,
                                                    rfidCode: rfidToSave,
                                                    avatar: `https://i.pravatar.cc/150?img=${newUserForm.avatarCode + 10}`,
                                                    pin: defaultPin,
                                                    password: passToSave
                                                });
                                            }
                                            setIsCreateModalOpen(false);
                                        }}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                                    >
                                        Save Operative
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

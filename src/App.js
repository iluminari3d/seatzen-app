import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, writeBatch, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// --- Author: I Luminari SRLS - www.iluminari3d.com ---
// --- VERSIONE CON MAPPA INTERATTIVA ---

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG) : {};
const appId = 'seatzen-prod-app';

// --- COSTANTI ---
const AGE_RANGES = [ "Non specificata", "0-2 anni", "3-12 anni", "13-17 anni", "18-25 anni", "26-40 anni", "41-60 anni", "61+ anni" ];
const YOUNG_CHILD_RANGES = ["0-2 anni", "3-12 anni"];
const STAFF_ROLES = ["Staff", "Fotografo", "Videomaker", "DJ", "Musicista", "Animatore", "Wedding Planner", "Altro"];
const DEFAULT_STRICT_GROUPS = ["Sposi", "Testimoni Sposo", "Testimoni Sposa", "Genitori Sposo", "Genitori Sposa", "Amici Sposo", "Amici Sposa", "Parenti Sposo", "Parenti Sposa"];

// --- HOOKS PERSONALIZZATI ---
function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'system';
        const savedTheme = localStorage.getItem('seatzen-theme');
        return savedTheme || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        localStorage.setItem('seatzen-theme', theme);
    }, [theme]);

    return [theme, setTheme];
};

// --- COMPONENTI GRAFICI (SVG & UI) ---
const IconMask = ({ className, iconName }) => (
    <div 
        className={`icon-mask ${className}`} 
        style={{ WebkitMaskImage: `url(/logos/${iconName}.svg)`, maskImage: `url(/logos/${iconName}.svg)` }}
    ></div>
);

function IluminariLogo({ className }) {
    return (
        <>
            <img src="/logos/iluminari-logo.svg" alt="Iluminari Logo" className={`${className} logo-light-theme`} />
            <img src="/logos/iluminari-logo-dark.svg" alt="Iluminari Logo" className={`${className} logo-dark-theme`} />
        </>
    );
};
function GoogleIcon({ className }) { return ( <img src="/logos/google-icon.svg" alt="Google Icon" className={className} /> ); };
function SeatZenLogo({ className }) { return ( <img src="/logos/seatzen-logo.svg" alt="SeatZen Logo" className={className} /> ); };

function HomeIcon({ className }) { return <IconMask className={className} iconName="home-icon" />; };
function HelpIcon({ className }) { return <IconMask className={className} iconName="help-icon" />; };
function SettingsIcon({ className }) { return <IconMask className={className} iconName="settings-icon" />; };
function UserAvatarIcon({ className }) { return <IconMask className={className} iconName="user-avatar-icon" />; };
function MagicWandIcon({ className }) { return <IconMask className={className} iconName="magic-wand-icon" />; };
function ResetIcon({ className }) { return <IconMask className={className} iconName="reset-icon" />; };
function GroupIcon({ className }) { return <IconMask className={className} iconName="group-icon" />; };
function PlusIcon({ className }) { return <IconMask className={className} iconName="plus-icon" />; };
function CollapseIcon({ className }) { return <IconMask className={className} iconName="collapse-icon" />; };
function ExpandIcon({ className }) { return <IconMask className={className} iconName="expand-icon" />; };
function TrashIcon({ className }) { return <IconMask className={className} iconName="trash-icon" />; };
function EditIcon({ className }) { return <IconMask className={className} iconName="edit-icon" />; };
function LockIcon({ className }) { return <IconMask className={className} iconName="lock-icon" />; };
function UnlockIcon({ className }) { return <IconMask className={className} iconName="unlock-icon" />; };
function GuestsIcon({ className }) { return <IconMask className={className} iconName="guests-icon" />; };
function StaffIcon({ className }) { return <IconMask className={className} iconName="staff-icon" />; };
function SunIcon({ className }) { return <IconMask className={className} iconName="sun-icon" />; };
function MoonIcon({ className }) { return <IconMask className={className} iconName="moon-icon" />; };
function DesktopIcon({ className }) { return <IconMask className={className} iconName="desktop-icon" />; };

function ExportIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>); };
function FileImportIcon({ className }) { return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);}


// --- MODALI ---
// ... tutti i componenti modali rimangono invariati ...
function SettingsModal({ currentTheme, onThemeChange, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-sm m-4 text-center">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Impostazioni Tema</h2>
                <div className="space-y-4">
                    <button onClick={() => onThemeChange('light')} className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'light' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <SunIcon className="w-6 h-6 mr-2"/> Chiaro
                    </button>
                    <button onClick={() => onThemeChange('dark')} className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'dark' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <MoonIcon className="w-6 h-6 mr-2"/> Scuro
                    </button>
                    <button onClick={() => onThemeChange('system')} className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'system' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        <DesktopIcon className="w-6 h-6 mr-2"/> Sistema
                    </button>
                </div>
                <button onClick={onClose} className="mt-8 text-gray-600 dark:text-gray-300 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Chiudi</button>
            </div>
        </div>
    );
};

function DeleteConfirmationModal({ title, message, onConfirm, onCancel, isDeleting, confirmText = 'Sì, elimina' }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 text-center">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-red-600 mb-4">{title}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Annulla</button>
                    <button onClick={onConfirm} disabled={isDeleting} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-red-700 disabled:bg-red-400">
                        {isDeleting ? 'Eliminazione...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditTableModal({ table, onClose, onSave, isSaving }) {
    const [name, setName] = useState(table.name);
    const [capacity, setCapacity] = useState(table.capacity);
    const [shape, setShape] = useState(table.shape);

    const handleSave = () => {
        if (!name.trim() || capacity < 1) {
            alert("Per favore, inserisci un nome valido e una capacità maggiore di zero.");
            return;
        }
        onSave(table.id, { name: name.trim(), capacity: Number(capacity), shape });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Modifica Tavolo</h2>
                <div className="space-y-4">
                    <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Nome Tavolo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Capacità</label>
                        <input
                            type="number"
                            min="1"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Forma</label>
                        <select
                            value={shape}
                            onChange={(e) => setShape(e.target.value)}
                            className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring"
                        >
                            <option value="round">Rotondo</option>
                            <option value="rectangular">Imperiale</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">
                        {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ImportPeopleModal({ existingGroups, onSave, onClose, isSaving, activeSection }) {
    const [parsedPeople, setParsedPeople] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const isGuestImport = activeSection === 'guests';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError('');
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            try {
                let peopleData;
                if (isGuestImport) {
                    if (file.name.endsWith('.csv')) {
                        peopleData = content.split('\n').filter(row => row.trim() !== '').map((row, index) => {
                            const [name, age, groupName, mustSitWith, likes, dislikes] = row.split(',').map(s => s.trim());
                            return { id: `parsed-${index}`, name: name || '', age: AGE_RANGES.includes(age) ? age : AGE_RANGES[0], groupName: groupName || '', mustSitWithRaw: mustSitWith || '', likesRaw: likes || '', dislikesRaw: dislikes || '', type: 'guest' };
                        });
                    } else if (file.name.endsWith('.txt')) {
                        peopleData = content.split('\n').filter(name => name.trim() !== '').map((name, index) => ({ id: `parsed-${index}`, name: name.trim(), age: AGE_RANGES[0], groupName: '', mustSitWithRaw: '', likesRaw: '', dislikesRaw: '', type: 'guest' }));
                    } else {
                        throw new Error("Formato file non supportato. Usa .csv o .txt");
                    }
                } else { // Importazione Staff
                    if (file.name.endsWith('.csv')) {
                        peopleData = content.split('\n').filter(row => row.trim() !== '').map((row, index) => {
                            const [name, role] = row.split(',').map(s => s.trim());
                            return { id: `parsed-${index}`, name: name || '', role: STAFF_ROLES.includes(role) ? role : STAFF_ROLES[0], type: 'staff' };
                        });
                    } else if (file.name.endsWith('.txt')) {
                        peopleData = content.split('\n').filter(name => name.trim() !== '').map((name, index) => ({ id: `parsed-${index}`, name: name.trim(), role: STAFF_ROLES[0], type: 'staff' }));
                    } else {
                        throw new Error("Formato file non supportato. Usa .csv o .txt");
                    }
                }
                setParsedPeople(peopleData);
            } catch (err) {
                setError(err.message || "Errore durante la lettura del file.");
                setParsedPeople([]);
            }
        };
        reader.readAsText(file);
    };

    const updatePerson = (index, field, value) => {
        const newPeople = [...parsedPeople];
        newPeople[index][field] = value;
        setParsedPeople(newPeople);
    };

    const handleSave = () => {
        const peopleToImport = parsedPeople.filter(p => p.name);
        if (peopleToImport.length > 0) {
            onSave(peopleToImport);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-6xl m-4 max-h-[90vh] flex flex-col">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Importazione Intelligente {isGuestImport ? "Invitati" : "Staff"}</h2>
                <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="w-full sz-accent-bg text-white font-bold py-2 px-4 rounded-lg shadow sz-accent-bg-hover mb-4">Seleziona un file (.csv o .txt)</button>
                {isGuestImport ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">Formato CSV Invitati: `Nome,Età,Gruppo,DeveSedersiCon,VuoleSedersiCon,NonVuoleSedersiCon`</p>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">Formato CSV Staff: `Nome,Ruolo`</p>
                )}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {parsedPeople.length > 0 && (
                    <>
                        <h3 className="font-bold text-lg my-4 dark:text-gray-200">Controlla e conferma i dati importati</h3>
                        <div className="flex-grow overflow-y-auto border rounded-lg border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    {isGuestImport ? (
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Nome</th>
                                            <th scope="col" className="px-4 py-3">Fascia d'Età</th>
                                            <th scope="col" className="px-4 py-3">Gruppo Stretto</th>
                                            <th scope="col" className="px-4 py-3">Preferenze Rilevate</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Nome</th>
                                            <th scope="col" className="px-4 py-3">Ruolo</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {parsedPeople.map((person, index) => (
                                        <tr key={person.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                            <td className="px-4 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{person.name}</td>
                                            {isGuestImport ? (
                                                <>
                                                    <td className="px-4 py-4">
                                                        <select value={person.age} onChange={e => updatePerson(index, 'age', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                                            {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input type="text" value={person.groupName} onChange={e => updatePerson(index, 'groupName', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" list="existing-groups" />
                                                        <datalist id="existing-groups">
                                                            {existingGroups.map(g => <option key={g.id} value={g.name} />)}
                                                        </datalist>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col space-y-1">
                                                            {person.mustSitWithRaw && <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">🔗 {person.mustSitWithRaw}</span>}
                                                            {person.likesRaw && <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">👍 {person.likesRaw}</span>}
                                                            {person.dislikesRaw && <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full">👎 {person.dislikesRaw}</span>}
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-4 py-4">
                                                    <select value={person.role} onChange={e => updatePerson(index, 'role', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                                        {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving || parsedPeople.length === 0} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">
                        {isSaving ? 'Importazione...' : `Importa ${parsedPeople.length} Persone`}
                    </button>
                </div>
            </div>
        </div>
    );
};


function AddFamilyModal({ onClose, onSave, isSaving }) {
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState([{ id: 1, name: '', type: 'adult', age: AGE_RANGES[0] }]);
    const updateMember = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };
    const addMember = () => {
        setMembers([...members, { id: Date.now(), name: '', type: 'adult', age: AGE_RANGES[0] }]);
    };
    const removeMember = (index) => {
        if (members.length > 1) {
            setMembers(members.filter((_, i) => i !== index));
        }
    };
    const handleSave = () => {
        if (!groupName.trim()) { alert("Il nome del gruppo è obbligatorio."); return; }
        const validMembers = members.filter(m => m.name.trim());
        if (validMembers.length === 0) { alert("Aggiungi almeno un componente con un nome valido."); return; }
        onSave(groupName.trim(), validMembers);
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Aggiungi Famiglia / Gruppo</h2>
                <div className="mb-6">
                    <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Nome Gruppo</label>
                    <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Es. Famiglia Rossi" required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                </div>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    {members.map((member, index) => (
                        <div key={member.id} className="p-4 border rounded-lg mb-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 relative">
                            <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-4">Componente {index + 1}</h3>
                            {members.length > 1 && (
                                <button onClick={() => removeMember(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" value={member.name} onChange={(e) => updateMember(index, 'name', e.target.value)} placeholder="Nome" className="md:col-span-2 shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-600 dark:border-gray-500 sz-focus-ring" />
                                <select value={member.age} onChange={(e) => updateMember(index, 'age', e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-600 dark:border-gray-500 sz-focus-ring">
                                    {AGE_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                                </select>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">Categoria</h4>
                                <div className="flex space-x-2">
                                    <button onClick={() => updateMember(index, 'type', 'adult')} className={`flex-1 py-2 px-4 rounded-lg text-sm ${member.type === 'adult' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Adulto</button>
                                    <button onClick={() => updateMember(index, 'type', 'child')} className={`flex-1 py-2 px-4 rounded-lg text-sm ${member.type === 'child' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Bambino</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addMember} className="mt-4 text-sm sz-accent-text font-bold hover:underline self-start">+ Aggiungi componente</button>
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva Gruppo'}</button>
                </div>
            </div>
        </div>
    );
};

function StrictGroupModal({ groups, onAdd, onDelete, onClose, isSaving }) {
    const [newGroupName, setNewGroupName] = useState('');
    const handleAdd = (e) => { e.preventDefault(); if (newGroupName.trim()) { onAdd(newGroupName.trim()); setNewGroupName(''); } };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg m-4">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Gestisci Gruppi Stretti</h2>
                <form onSubmit={handleAdd} className="flex items-center space-x-2 mb-6">
                    <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Es. Famiglia Sposa" className="flex-grow shadow appearance-none border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                    <button type="submit" disabled={isSaving} className="sz-accent-bg text-white font-bold py-2 px-4 rounded-lg shadow sz-accent-bg-hover transition-colors disabled:bg-gray-400">{isSaving ? '...' : '+ Crea'}</button>
                </form>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groups.length > 0 ? groups.map(group => (
                        <div key={group.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                            <span className="text-gray-800 dark:text-gray-200">{group.name}</span>
                            <button onClick={() => onDelete(group.id)} className="text-red-500 hover:text-red-700 font-bold">Elimina</button>
                        </div>
                    )) : <p className="text-gray-500 dark:text-gray-400 italic">Nessun gruppo creato.</p>}
                </div>
                <div className="text-right mt-6">
                    <button onClick={onClose} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover">Chiudi</button>
                </div>
            </div>
        </div>
    );
}

function ArrangeOptionsModal({ onClose, onArrange, isArranging, guestGroups }) {
    const [capacity, setCapacity] = useState(8);
    const [tableType, setTableType] = useState('round');
    const [createKidsTable, setCreateKidsTable] = useState(true);
    const [noCoupleTable, setNoCoupleTable] = useState(false);
    const [allowSpecialTables, setAllowSpecialTables] = useState(false);
    const [specialTables, setSpecialTables] = useState([]);

    const addSpecialTable = () => {
        setSpecialTables([...specialTables, { id: Date.now(), capacity: 8, groupIds: [] }]);
    };
    
    const updateSpecialTable = (id, field, value) => {
        setSpecialTables(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeSpecialTable = (id) => {
        setSpecialTables(prev => prev.filter(t => t.id !== id));
    };

    const handleArrangeClick = () => {
        const options = {
            capacity: Number(capacity),
            tableType,
            createKidsTable,
            noCoupleTable,
            allowSpecialTables,
            specialTables: specialTables.filter(t => t.groupIds.length > 0),
        };
        onArrange(options);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Opzioni di Auto-Disposizione</h2>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                    {/* General Settings */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-3">Impostazioni Generali Tavoli</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="font-bold text-gray-600 dark:text-gray-300 mb-2 block text-sm">Capacità di Default</label>
                                <input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-600 sz-focus-ring" />
                            </div>
                            <div>
                                <label className="font-bold text-gray-600 dark:text-gray-300 mb-2 block text-sm">Forma di Default</label>
                                <select value={tableType} onChange={e => setTableType(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-600 sz-focus-ring">
                                    <option value="round">Rotondo</option>
                                    <option value="rectangular">Imperiale</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Regole Automatiche */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-3">Regole Automatiche</h3>
                         <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={createKidsTable} onChange={e => setCreateKidsTable(e.target.checked)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span className="text-gray-700 dark:text-gray-300">Crea un "Tavolo Bambini" separato per le fasce 0-12 anni.</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={!noCoupleTable} onChange={e => setNoCoupleTable(!e.target.checked)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span className="text-gray-700 dark:text-gray-300">Crea un "Tavolo Sposi" per il gruppo 'Sposi'.</span>
                            </label>
                        </div>
                    </div>
                    
                    {/* Tavoli Speciali */}
                     <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-3">Tavoli Speciali per Gruppi</h3>
                         <label className="flex items-center space-x-3 cursor-pointer mb-4">
                            <input type="checkbox" checked={allowSpecialTables} onChange={e => setAllowSpecialTables(e.target.checked)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                            <span className="text-gray-700 dark:text-gray-300">Crea tavoli dedicati per combinazioni di gruppi specifici.</span>
                        </label>
                        {allowSpecialTables && (
                            <div className="space-y-4">
                                {specialTables.map((tableRule) => (
                                    <div key={tableRule.id} className="p-3 bg-white dark:bg-gray-600 rounded-lg border dark:border-gray-500 relative">
                                        <button onClick={() => removeSpecialTable(tableRule.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="font-bold text-gray-600 dark:text-gray-300 mb-2 block text-sm">Gruppi da unire</label>
                                                <select
                                                    multiple
                                                    value={tableRule.groupIds}
                                                    onChange={e => updateSpecialTable(tableRule.id, 'groupIds', Array.from(e.target.selectedOptions, option => option.value))}
                                                    className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight h-24 bg-white dark:bg-gray-500 sz-focus-ring"
                                                >
                                                    {guestGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="font-bold text-gray-600 dark:text-gray-300 mb-2 block text-sm">Capacità Tavolo</label>
                                                 <input type="number" min="1" value={tableRule.capacity} onChange={e => updateSpecialTable(tableRule.id, 'capacity', e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight bg-white dark:bg-gray-500 sz-focus-ring" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addSpecialTable} className="mt-2 text-sm sz-accent-text font-bold hover:underline">+ Aggiungi regola tavolo speciale</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleArrangeClick} disabled={isArranging} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">
                        {isArranging ? 'Elaborazione...' : 'Disponi Automaticamente'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PersonDetailModal({ person, allGuests, strictGroups, onSave, onClose, isSaving, isCreating, onManageGroups, onDelete, initialType = 'guest' }) {
    const [personType, setPersonType] = useState(person ? (person.role ? 'staff' : 'guest') : initialType);
    const [name, setName] = useState(person?.name || '');
    const [age, setAge] = useState(person?.age || AGE_RANGES[0]);
    const [role, setRole] = useState(person?.role || STAFF_ROLES[0]);
    
    const [likes, setLikes] = useState(person?.likes || []);
    const [dislikes, setDislikes] = useState(person?.dislikes || []);
    const [mustSitWith, setMustSitWith] = useState(person?.mustSitWith || []);
    const [strictGroupId, setStrictGroupId] = useState(person?.strictGroupId || '');
    
    const otherGuests = allGuests.filter(g => g.id !== person?.id);

    const handleSave = () => {
        if (!name.trim()) {
            alert("Il nome è obbligatorio.");
            return;
        }
        let personData = { name: name.trim() };
        if (personType === 'guest') {
            personData = { ...personData, age, likes, dislikes, mustSitWith, strictGroupId };
        } else {
            personData = { ...personData, role };
        }
        onSave(person?.id, personData, personType);
    };

    const handleDeleteClick = () => {
        onClose(); // Close this modal first
        setTimeout(() => onDelete(person), 150); // Then open the confirmation modal after a short delay for a smoother transition
    }

    const handleTogglePreference = (listType, targetGuestId) => {
        const updateList = (setList) => {
            setList(prev => prev.includes(targetGuestId) ? prev.filter(id => id !== targetGuestId) : [...prev, targetGuestId]);
        };
        if (listType === 'likes') {
            if (dislikes.includes(targetGuestId)) setDislikes(l => l.filter(id => id !== targetGuestId));
            if (mustSitWith.includes(targetGuestId)) setMustSitWith(l => l.filter(id => id !== targetGuestId));
            updateList(setLikes);
        } else if (listType === 'dislikes') {
            if (likes.includes(targetGuestId)) setLikes(l => l.filter(id => id !== targetGuestId));
            if (mustSitWith.includes(targetGuestId)) setMustSitWith(l => l.filter(id => id !== targetGuestId));
            updateList(setDislikes);
        } else if (listType === 'mustSitWith') {
            if (dislikes.includes(targetGuestId)) setDislikes(l => l.filter(id => id !== targetGuestId));
            if (likes.includes(targetGuestId)) setLikes(l => l.filter(id => id !== targetGuestId));
            updateList(setMustSitWith);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{isCreating ? 'Nuova Persona' : `Dettagli per: ${person.name}`}</h2>
                
                {isCreating && (
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo</h3>
                        <div className="flex space-x-2">
                            <button onClick={() => setPersonType('guest')} className={`w-full py-2 px-4 rounded-lg text-sm ${personType === 'guest' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Invitato</button>
                            <button onClick={() => setPersonType('staff')} className={`w-full py-2 px-4 rounded-lg text-sm ${personType === 'staff' ? 'sz-accent-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Staff</button>
                        </div>
                    </div>
                )}


                <div className="mb-4">
                    <label className="font-bold text-gray-700 dark:text-gray-300 mb-2 block">Nome</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome e Cognome" required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                </div>

                {personType === 'guest' && (
                    <>
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Fascia d'Età</h3>
                            <select value={age} onChange={e => setAge(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring">
                                {AGE_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                            </select>
                        </div>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300">Gruppo Stretto</h3>
                                <button type="button" onClick={onManageGroups} className="text-sm sz-accent-text hover:underline">[Gestisci]</button>
                            </div>
                            <select value={strictGroupId} onChange={e => setStrictGroupId(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring">
                                <option value="">Nessun gruppo</option>
                                {strictGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <PreferenceSelector title="Deve sedersi con (Posti Vincolati)" icon="🔗" list={mustSitWith} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('mustSitWith', id)} color="blue" />
                            <PreferenceSelector title="Vuole sedersi con" icon="👍" list={likes} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('likes', id)} color="green" />
                            <PreferenceSelector title="NON vuole sedersi con" icon="👎" list={dislikes} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('dislikes', id)} color="red" />
                        </div>
                    </>
                )}

                {personType === 'staff' && (
                    <div className="mb-4">
                         <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Ruolo</h3>
                         <select value={role} onChange={e => setRole(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring">
                            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                )}

                <div className="flex justify-between items-center mt-8">
                    <div>
                        {!isCreating && (
                             <button onClick={handleDeleteClick} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-colors">
                                Elimina
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-4">
                        <button onClick={onClose} className="text-gray-600 dark:text-gray-300 font-bold py-2 px-4">Annulla</button>
                        <button onClick={handleSave} disabled={isSaving} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function PreferenceSelector({ title, icon, list, otherGuests, onToggle, color }) {
    const colorClasses = {
        blue: { bg: 'bg-blue-500', hover: 'bg-blue-600' },
        green: { bg: 'bg-green-500', hover: 'bg-green-600' },
        red: { bg: 'bg-red-500', hover: 'bg-red-600' },
    };
    return (
        <div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">{icon} <span className="ml-2">{title}</span></h3>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded">
                {otherGuests.length > 0 ? otherGuests.map(g => (
                    <button key={g.id} onClick={() => onToggle(g.id)} className={`py-1 px-3 rounded-full text-sm transition-colors ${list.includes(g.id) ? `${colorClasses[color].bg} text-white` : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {g.name}
                    </button>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aggiungi altre persone.</p>}
            </div>
        </div>
    );
};

function GuestListItem({ guest, onEdit, activeSection }) {
    return (
        <li onClick={() => onEdit(guest)} className="text-gray-700 dark:text-gray-200 p-2 rounded flex justify-between items-center bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer animate-fade-in">
            <span className="truncate">{guest.name}</span>
            <div className="flex items-center space-x-2">
                {activeSection === 'guests' && guest.mustSitWith?.length > 0 && <span title="Posti Vincolati">🔗</span>}
                {activeSection === 'guests' && guest.strictGroupId && <GroupIcon className="h-4 w-4" />}
                {activeSection === 'guests' && (guest.likes?.length > 0 || guest.dislikes?.length > 0) && <span className="text-yellow-500 text-lg">★</span>}
                {activeSection === 'staff' && guest.role && <span className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{guest.role}</span>}
            </div>
        </li>
    );
}

function PeopleList({ people, isLoading, onEditPerson, activeSection, onAddPersonClick, onAddGroupClick, onImportClick, onClearListClick }) {
    const addMenuRef = useRef(null);
    const [showAddMenu, setShowAddMenu] = useState(false);

     useEffect(() => {
        function handleClickOutside(event) {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
                setShowAddMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [addMenuRef]);

    const unassignedPeople = people.filter(p => !p.tableId);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-gray-800 dark:text-gray-100">{activeSection === 'guests' ? 'Invitati' : 'Staff'}</h3>
                <div className="relative" ref={addMenuRef}>
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="sz-accent-bg text-white font-bold py-2 px-4 rounded-lg shadow hover:sz-accent-bg-hover flex items-center">
                        <PlusIcon className="h-5 w-5 mr-2"/> Aggiungi
                    </button>
                    {showAddMenu && (
                         <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg z-30 py-1">
                             <a href="#" onClick={(e)=>{e.preventDefault(); onAddPersonClick(); setShowAddMenu(false);}} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <UserAvatarIcon className="h-5 w-5 mr-3"/> Aggiungi Persona
                             </a>
                             {activeSection === 'guests' && (
                                <a href="#" onClick={(e)=>{e.preventDefault(); onAddGroupClick(); setShowAddMenu(false);}} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <GroupIcon className="h-5 w-5 mr-3"/> Aggiungi Gruppo
                                </a>
                             )}
                             <a href="#" onClick={(e)=>{e.preventDefault(); onImportClick(); setShowAddMenu(false);}} className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <FileImportIcon className="h-5 w-5 mr-3"/> Importa da File
                             </a>
                         </div>
                    )}
                </div>
            </div>
             <button onClick={onClearListClick} className="w-full text-center text-xs text-red-500 dark:text-red-400 hover:underline mb-4">Svuota Lista</button>
            {isLoading ? <p className="text-gray-500 dark:text-gray-400">Caricamento...</p> : people.length > 0 ? (
                <ul className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 space-y-2 min-h-[100px] flex-grow overflow-y-auto">
                     <p className="text-xs text-gray-400 mb-2">Non assegnati ({unassignedPeople.length})</p>
                    {unassignedPeople.map(person => <GuestListItem key={person.id} guest={person} onEdit={onEditPerson} activeSection={activeSection} />)}
                </ul>
            ) : <div className="text-gray-500 dark:text-gray-400 italic mt-4 p-4 border border-dashed rounded-lg border-gray-300 dark:border-gray-600 text-center">Nessuna persona in questa lista.</div>}
        </div>
    );
}

function AddTableForm({ onAddTable, isAdding }) {
    const [tableName, setTableName] = useState('');
    const [tableCapacity, setTableCapacity] = useState(8);
    const [tableShape, setTableShape] = useState('round');
    const handleSubmit = (e) => { e.preventDefault(); if (tableName.trim() && tableCapacity > 0) { onAddTable(tableName.trim(), tableCapacity, tableShape); setTableName(''); setTableCapacity(8); } };
    return (
        <form onSubmit={handleSubmit} className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Nuovo Tavolo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Nome Tavolo (es. Sposi)" required className="md:col-span-2 shadow appearance-none border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                <button type="submit" disabled={isAdding} className="w-full sz-accent-bg text-white font-bold py-2 px-4 rounded-lg shadow sz-accent-bg-hover transition-colors disabled:bg-gray-400">{isAdding ? '...' : 'Aggiungi'}</button>
            </div>
            <div className="flex items-center space-x-4 mt-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Capacità:</label>
                <input type="number" min="1" value={tableCapacity} onChange={(e) => setTableCapacity(parseInt(e.target.value, 10))} required className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 w-20 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Forma:</label>
                <select value={tableShape} onChange={(e) => setTableShape(e.target.value)} className="shadow border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring">
                    <option value="round">Rotondo</option>
                    <option value="rectangular">Imperiale</option>
                </select>
            </div>
        </form>
    );
};

function TableCard({ table, people, onDragStart, onDragOver, onDrop, isDragOver, onEditPerson, onEditTable, onDeleteTable, onToggleLock, activeSection }) {
    const isFull = people.length >= table.capacity;
    const baseClasses = "bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-fade-in transition-all duration-200 relative";
    const stateClasses = isDragOver && !isFull && !table.locked ? "ring-2 scale-105 sz-focus-ring" : isFull ? "bg-red-100 dark:bg-red-900/20" : "";
    const lockedClasses = table.locked ? "opacity-70 border-2 border-blue-300 dark:border-blue-700" : "";
    return (
        <div onDragOver={onDragOver} onDrop={onDrop} className={`${baseClasses} ${stateClasses} ${lockedClasses}`}>
            <div className="absolute top-2 right-2 flex items-center space-x-1">
                <button onClick={() => onToggleLock(table.id, !table.locked)} title={table.locked ? "Sblocca tavolo" : "Blocca tavolo"} className="p-1 text-gray-400 hover:text-blue-500">
                    {table.locked ? <LockIcon className="h-5 w-5" /> : <UnlockIcon className="h-5 w-5" />}
                </button>
                <button onClick={() => onEditTable(table)} title="Modifica tavolo" className="p-1 text-gray-400 hover:text-green-500">
                    <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDeleteTable(table)} title="Elimina tavolo" className="p-1 text-gray-400 hover:text-red-500">
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
            <h4 style={{fontFamily: 'Lora, serif'}} className="text-lg font-bold sz-accent-text flex justify-between items-center pr-24">
                <span>{table.name}</span>
                <span className={`text-sm font-mono p-1 rounded ${isFull ? 'text-red-700 bg-red-200 dark:text-red-200 dark:bg-red-800' : 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'}`}>{people.length}/{table.capacity}</span>
            </h4>
            <ul className="mt-2 space-y-1 text-sm min-h-[2rem]">
                {people.map(person => <GuestListItem key={person.id} guest={person} onDragStart={onDragStart} onEdit={onEditPerson} activeSection={activeSection} />)}
            </ul>
        </div>
    );
};

function TableList({ tables, people, onEditPerson, onEditTable, onDeleteTable, onToggleLock, activeSection }) {
    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.length > 0 ? tables.map(table => {
                    const assignedPeople = people.filter(p => p.tableId === table.id);
                    return <TableCard key={table.id} table={table} people={assignedPeople} onEditPerson={onEditPerson} onEditTable={onEditTable} onDeleteTable={onDeleteTable} onToggleLock={onToggleLock} activeSection={activeSection} />;
                }) : <p className="text-gray-500 dark:text-gray-400 italic mt-4 col-span-full text-center">Nessun tavolo creato.</p>}
            </div>
        </div>
    );
}

function MapView({ tables, people }) {
    return (
        <div className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner min-h-[300px] border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center items-start gap-8 p-4">
                {tables.length > 0 ? tables.map(table => {
                    const assignedPeople = people.filter(p => p.tableId === table.id);
                    const isRound = table.shape === 'round';
                    const tableSize = table.capacity > 10 ? (isRound ? 'w-56 h-56' : 'w-72 h-56') : (isRound ? 'w-48 h-48' : 'w-64 h-48');
                    const tableClasses = `flex flex-col justify-start items-center p-4 border-2 border-gray-600 dark:border-gray-400 bg-white dark:bg-gray-700 shadow-lg transition-transform hover:scale-105 overflow-hidden ${isRound ? 'rounded-full' : 'rounded-lg'} ${tableSize}`;
                    
                    return (
                        <div key={table.id} className={tableClasses}>
                            <div className="text-center flex-shrink-0">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">{table.name}</h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">({assignedPeople.length}/{table.capacity})</span>
                            </div>
                            <div className="w-full overflow-y-auto mt-1 px-2 flex-grow">
                                <ul className="text-center text-sm text-gray-700 dark:text-gray-300">
                                    {assignedPeople.map(p => <li key={p.id} className="truncate w-full">{p.name}</li>)}
                                </ul>
                            </div>
                        </div>
                    );
                }) : <p className="text-gray-500 dark:text-gray-400 italic mt-4 col-span-full text-center">Crea dei tavoli per visualizzare la mappa.</p>}
            </div>
        </div>
    );
}

function FaqView() {
    const downloadTemplate = () => {
        const csvContent = [
            "Nome,Fascia d'Età,Gruppo Stretto,Deve Sedersi Con,Vuole Sedersi Con,Non Vuole Sedersi Con",
            "Marco Bianchi,26-40 anni,Sposi,Anna Verdi,,",
            "Anna Verdi,26-40 anni,Sposi,Marco Bianchi,,Simone Romano",
            "Simone Romano,26-40 anni,Amici Sposi,,,Anna Verdi"
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "template_invitati_seatzen.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    return (
        <div className="w-full max-w-4xl mx-auto p-8 animate-fade-in">
            <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-8">Aiuto & FAQ</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">Importazione Intelligente degli Invitati</h2>
                <div className="space-y-6 text-gray-700 dark:text-gray-300">
                    <div>
                        <h3 className="font-bold text-lg mb-2">A cosa serve la funzione di importazione?</h3>
                        <p>Permette di caricare in un solo colpo un'intera lista di invitati da un file esterno (.csv o .txt), risparmiando ore di lavoro manuale. L'app non solo importa i nomi, ma è in grado di capire anche le relazioni tra le persone, come i gruppi familiari e le preferenze di posto.</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Quale formato di file devo usare?</h3>
                        <p>Puoi usare un file di testo semplice (`.txt`), con un nome per riga, oppure un file `.csv` (Comma Separated Values), che è il formato standard per i fogli di calcolo. Per sfruttare al massimo la potenza dell'app, **consigliamo il formato .csv**.</p>
                        <button onClick={downloadTemplate} className="mt-4 sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover">Scarica Template CSV</button>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Come deve essere strutturato il file .csv?</h3>
                        <p>Il file deve avere delle colonne in un ordine preciso. Non preoccuparti dei nomi delle colonne (intestazioni), l'app guarda solo l'ordine:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <li><strong className="font-mono">Nome Invitato</strong> (Obbligatorio)</li>
                            <li><strong className="font-mono">Fascia d'Età</strong> (Opzionale)</li>
                            <li><strong className="font-mono">Gruppo Stretto</strong> (Opzionale, es. "Famiglia Sposa")</li>
                            <li><strong className="font-mono">Deve Sedersi Con</strong> (Opzionale)</li>
                            <li><strong className="font-mono">Vuole Sedersi Con</strong> (Opzionale)</li>
                            <li><strong className="font-mono">Non Vuole Sedersi Con</strong> (Opzionale)</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Come inserisco più nomi nelle preferenze?</h3>
                        <p>Usa un **punto e virgola (`;`)** per separare i nomi all'interno della stessa cella. <br /> Esempio: `Anna Verdi;Luca Verdi`</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Cosa succede dopo aver caricato il file?</h3>
                        <p>SeatZen non importa i dati ciecamente. Ti mostrerà una **schermata di revisione** dove potrai controllare tutti i dati, correggere eventuali errori e confermare le preferenze che l'app ha rilevato. L'importazione finale avviene solo dopo la tua approvazione. Hai sempre il controllo totale.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

function EventCard({ event, onSelect, onDelete }) {
    const eventDate = event.date ? new Date(event.date) : null;
    const formattedDate = eventDate ? eventDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data non specificata';
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 text-left w-full flex justify-between items-center transition-transform duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
            <div>
                <h3 style={{ fontFamily: 'Lora, serif' }} className="text-xl font-bold text-gray-800 dark:text-gray-100">{event.name}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500 dark:text-gray-400">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={() => onSelect(event)} style={{ fontFamily: 'Inter, sans-serif' }} className="sz-accent-bg text-white font-bold py-2 px-5 rounded-lg sz-accent-bg-hover transition-colors">Gestisci</button>
                <button onClick={() => onDelete(event)} title="Elimina Evento" className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

function Dashboard({ events, isEventsLoading, onSelectEvent, onNavigate, onDeleteEvent }) {
    return (
        <div className="w-full max-w-4xl mx-auto p-8 text-center animate-fade-in">
            <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">Dashboard Eventi</h1>
            <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-600 dark:text-gray-300 mb-8">{events.length > 0 ? "Seleziona un evento dalla barra laterale o creane uno nuovo." : "Crea il tuo primo evento per iniziare."}</p>
            <div className="mb-10 w-full">
                {isEventsLoading ? <p className="text-gray-600 dark:text-gray-300">Caricamento eventi...</p> : events.length > 0 ? (
                    <div className="space-y-4">{events.map(event => <EventCard key={event.id} event={event} onSelect={onSelectEvent} onDelete={onDeleteEvent} />)}</div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Nessun evento ancora creato.</p>
                        <button onClick={() => onNavigate('createEvent')} style={{ fontFamily: 'Inter, sans-serif' }} className="sz-accent-bg text-white font-bold py-3 px-8 rounded-lg shadow-lg sz-accent-bg-hover transition-colors">+ Crea il Tuo Primo Evento</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FormInput({ label, ...props }) {
    return (
        <div className="w-full mb-6 text-left">
            <label style={{ fontFamily: 'Inter, sans-serif' }} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                {label}
            </label>
            <input 
                style={{ fontFamily: 'Inter, sans-serif' }}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring"
                {...props}
            />
        </div>
    );
};

function CreateEventForm({ onSave, onCancel, isSaving }) {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if (eventName.trim() && eventDate) { onSave({ name: eventName, date: eventDate }); } };
    return (
        <div className="w-full max-w-lg mx-auto p-8 text-center animate-fade-in">
            <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Crea un nuovo evento</h1>
            <form onSubmit={handleSubmit}>
                <FormInput label="Nome Evento" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Es. Matrimonio di Anna e Marco" required />
                <FormInput label="Data Evento" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                <div className="flex items-center justify-end mt-4">
                    <button type="button" onClick={onCancel} style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-700 dark:text-gray-300 font-bold py-2 px-6 rounded-lg mr-4 hover:bg-gray-200 dark:hover:bg-gray-700">Annulla</button>
                    <button type="submit" disabled={isSaving} style={{ fontFamily: 'Inter, sans-serif' }} className="sz-accent-bg text-white font-bold py-2 px-6 rounded-lg shadow-lg sz-accent-bg-hover disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva Evento'}</button>
                </div>
            </form>
        </div>
    );
};

function LoginPage({ onLogin, onEmailLogin, onEmailRegister }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (isRegister) {
            onEmailRegister(email, password, setError);
        } else {
            onEmailLogin(email, password, setError);
        }
    };
    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center mb-8">
                    <SeatZenLogo className="h-16 w-16" />
                    <h1 className="text-5xl text-gray-800 dark:text-gray-100 ml-4 flex items-baseline">
                        <span style={{ fontFamily: 'Lora, serif' }} className="font-bold">Seat</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }} className="tracking-wider">ZEN</span>
                    </h1>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">Posti perfetti, stress zero.</p>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full mb-4 shadow-inner appearance-none border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full mb-4 shadow-inner appearance-none border rounded-lg py-2 px-3 text-gray-800 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 dark:border-gray-600 sz-focus-ring" />
                        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                        <button type="submit" className="w-full sz-accent-bg text-white font-bold py-2 px-4 rounded-lg shadow sz-accent-bg-hover transition-colors">{isRegister ? 'Registrati' : 'Accedi'}</button>
                    </form>
                    <div className="my-4 flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">oppure</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="space-y-2">
                        <button onClick={() => onLogin('google')} className="w-full flex items-center justify-center bg-white dark:bg-gray-700 py-2 px-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600">
                            <GoogleIcon className="h-5 w-5 mr-3" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Continua con Google</span>
                        </button>
                    </div>
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    {isRegister ? 'Hai già un account?' : 'Non hai un account?'}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="font-bold sz-accent-text hover:underline ml-1">{isRegister ? 'Accedi' : 'Registrati'}</button>
                </p>
            </div>
        </div>
    );
};

function EventView({ event, db, user, onDeleteEvent }) {
    // Hooks MUST be called at the top level, before any conditional returns.
    const [activeSection, setActiveSection] = useState('guests');
    const [people, setPeople] = useState([]);
    const [isLoadingPeople, setIsLoadingPeople] = useState(true);
    const [tables, setTables] = useState([]);
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [strictGroups, setStrictGroups] = useState([]);
    const [editingPerson, setEditingPerson] = useState(null);
    const [deletingPerson, setDeletingPerson] = useState(null);
    const [isDeletingPerson, setIsDeletingPerson] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [isSavingTable, setIsSavingTable] = useState(false);
    const [isCreatingPerson, setIsCreatingPerson] = useState(false);
    const [isSavingPerson, setIsSavingPerson] = useState(false);
    const [isManagingGroups, setIsManagingGroups] = useState(false);
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isSavingImport, setIsSavingImport] = useState(false);
    const [isArranging, setIsArranging] = useState(false);
    const [viewMode, setViewMode] = useState('list');
	const [deletingTable, setDeletingTable] = useState(null);
    const [isDeletingTable, setIsDeletingTable] = useState(false);
	const [showArrangeOptions, setShowArrangeOptions] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);
    const [showClearListConfirm, setShowClearListConfirm] = useState(false);
    const [isClearingList, setIsClearingList] = useState(false);
    const [isAddingFamily, setIsAddingFamily] = useState(false);

    useEffect(() => {
        function handleClickOutside(event) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportMenuRef]);

    useEffect(() => {
        if (!db || !user || !event) {
            setPeople([]);
            setTables([]);
            setStrictGroups([]);
            return;
        };

        const peopleCollection = activeSection === 'guests' ? 'guests' : 'staff';
        const peoplePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${peopleCollection}`;
        const tablesPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
        const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;

        setIsLoadingPeople(true);
        setIsLoadingTables(true);

        const unsubPeople = onSnapshot(query(collection(db, peoplePath), orderBy("name")), snap => {
            setPeople(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoadingPeople(false);
        }, err => { console.error(err); setIsLoadingPeople(false); });

        const qTables = query(collection(db, tablesPath), where("section", "==", activeSection), orderBy("createdAt"));
        const unsubTables = onSnapshot(qTables, snap => {
            setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoadingTables(false);
        }, err => { console.error(err); setIsLoadingTables(false); });

        const unsubGroups = activeSection === 'guests'
            ? onSnapshot(query(collection(db, groupsPath), orderBy("name")), snap => { setStrictGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }, err => console.error(err))
            : () => { setStrictGroups([]); return () => {}; };

        return () => { unsubPeople(); unsubTables(); unsubGroups(); };
    }, [db, user, event, activeSection]);

    // This guard clause now comes AFTER all hooks have been called.
    if (!event) {
        return (
            <div className="flex justify-center items-center w-full h-full p-8 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300">Caricamento evento in corso...</p>
            </div>
        );
    }

    // --- FUNZIONE PDF CORRETTA ---
    const handleExportPdf = async (type) => { // La funzione ora è "async" per attendere il caricamento dell'immagine
        try {
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();

            // PASSO 1: Carica l'immagine dal file nella cartella public
            // Assicurati di avere un'immagine chiamata 'seatzen-logo.png' in 'public/logos/'
            const logoUrl = '/logos/seatzen-logo.png'; 
            const img = new Image();
            img.src = logoUrl;

            // Attende che l'immagine sia completamente caricata prima di procedere
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (err) => {
                    console.error("Errore nel caricamento del logo:", err);
                    reject("Impossibile caricare il logo. Controlla che il file esista in 'public/logos/seatzen-logo.png'");
                };
            });

            // PASSO 2: Aggiungi l'immagine (ora caricata) al PDF
            doc.addImage(img, 'PNG', pageW - 45, 8, 30, 30);

            // Stili e testi del documento
            doc.setFont('times', 'bold');
            doc.setFontSize(20);
            doc.text(event.name, 15, 20);
            
            doc.setFont('times', 'normal');
            doc.setFontSize(12);
            doc.text(new Date(event.date).toLocaleDateString('it-IT'), 15, 28);
            
            const tableOptions = {
                startY: 40,
                styles: {
                    font: 'helvetica',
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [181, 142, 72], // Colore #b58e48
                    textColor: 255,
                    fontStyle: 'bold',
                },
            };
            
            let head, body, fileName;

            if (type === 'guests') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Lista ${activeSection === 'guests' ? 'Invitati' : 'Staff'}`, 15, 35);
                
                head = [['Nome', 'Gruppo', 'Tavolo Assegnato']];
                body = people.map(p => {
                    const groupName = p.strictGroupId ? strictGroups.find(g => g.id === p.strictGroupId)?.name || 'N/D' : '-';
                    const tableName = p.tableId ? tables.find(t => t.id === p.tableId)?.name || 'Non Assegnato' : 'Non Assegnato';
                    return [p.name, groupName, tableName];
                });
                fileName = `lista_${activeSection}_${event.name}.pdf`;

            } else if (type === 'tables') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Disposizione Tavoli', 15, 35);

                head = [['Nome Tavolo', 'Capacità', 'Persone Assegnate']];
                body = tables.map(t => {
                    const assigned = people.filter(p => p.tableId === t.id);
                    const assignedNames = assigned.map(p => p.name).join('\n');
                    return [t.name, `${assigned.length} / ${t.capacity}`, assignedNames];
                });
                fileName = `disposizione_tavoli_${event.name}.pdf`;
            }

            autoTable(doc, { ...tableOptions, head, body });
            doc.save(fileName);

        } catch (error) {
            console.error("Errore durante la generazione del PDF:", error);
            alert(`Si è verificato un errore durante la creazione del PDF: ${error}`);
        } finally {
            setShowExportMenu(false);
        }
    };


    const handleAddTable = async (tableName, tableCapacity, tableShape) => {
        if (!db || !user || !event) return;
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
        await addDoc(collection(db, path), { name: tableName, capacity: tableCapacity, shape: tableShape, section: activeSection, createdAt: serverTimestamp(), locked: false });
    };

    const handleUpdateTable = async (tableId, tableData) => {
        if (!db || !user || !event) return;
        setIsSavingTable(true);
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables/${tableId}`;
        try {
            await updateDoc(doc(db, path), tableData);
        } catch (error) {
            console.error("Errore durante l'aggiornamento del tavolo:", error);
            alert("Si è verificato un errore durante il salvataggio.");
        } finally {
            setIsSavingTable(false);
            setEditingTable(null);
        }
    };
    
	const handleDeleteTable = async (table) => {
		if (!db || !user || !event || !table) return;
		setIsDeletingTable(true);
		
		const peopleCollection = activeSection === 'guests' ? 'guests' : 'staff';
		const peoplePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${peopleCollection}`;
		const tablePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables/${table.id}`;

		const batch = writeBatch(db);
		
		const peopleOnTable = people.filter(p => p.tableId === table.id);
		peopleOnTable.forEach(p => {
			batch.update(doc(db, peoplePath, p.id), { tableId: null });
		});

		batch.delete(doc(db, tablePath));

		await batch.commit();

		setDeletingTable(null);
		setIsDeletingTable(false);
	}
	
	const handleToggleLock = async (tableId, locked) => {
		if (!db || !user || !event || !tableId) return;
		const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables/${tableId}`;
		await updateDoc(doc(db, path), { locked });
	}
	
	const handleAutoArrange = async (options) => {
		setIsArranging(true);
		const peopleCollection = 'guests';
		const peoplePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${peopleCollection}`;
		const tablesPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
		
		// 1. Clear existing unlocked tables and assignments
		const clearBatch = writeBatch(db);
		people.forEach(p => {
			const table = tables.find(t => t.id === p.tableId);
			if (p.tableId && (!table || !table.locked)) {
				clearBatch.update(doc(db, peoplePath, p.id), { tableId: null });
			}
		});
		tables.filter(t => !t.locked).forEach(t => {
			clearBatch.delete(doc(db, tablesPath, t.id));
		});
		await clearBatch.commit();
		
		const arrangementBatch = writeBatch(db);
		const lockedTableIds = tables.filter(t => t.locked).map(t => t.id);
		let remainingPeople = [...people.filter(p => !lockedTableIds.includes(p.tableId))];
		let seatedPersonIds = new Set();
	
		// Helper to seat a group of people
		const seatGroup = (peopleToSeat, baseTableName, capacity, shape) => {
			let tableCounter = 1;
			while (peopleToSeat.length > 0) {
				const newTableRef = doc(collection(db, tablesPath));
				const tableName = `${baseTableName} ${peopleToSeat.length > capacity ? tableCounter++ : ''}`.trim();
				arrangementBatch.set(newTableRef, { name: tableName, capacity, shape, section: activeSection, createdAt: serverTimestamp(), locked: false });
				const tableGuests = peopleToSeat.splice(0, capacity);
				tableGuests.forEach(guest => {
					arrangementBatch.update(doc(db, peoplePath, guest.id), { tableId: newTableRef.id });
					seatedPersonIds.add(guest.id);
				});
			}
		};
	
		// 2. Handle Couple's Table
		if (!options.noCoupleTable) {
			const coupleGroupId = strictGroups.find(g => g.name.toLowerCase() === 'sposi')?.id;
			if (coupleGroupId) {
				const couple = remainingPeople.filter(p => p.strictGroupId === coupleGroupId);
				if (couple.length > 0) {
					seatGroup(couple, 'Tavolo Sposi', couple.length > options.capacity ? couple.length : options.capacity, options.tableType);
				}
			}
		}
		remainingPeople = remainingPeople.filter(p => !seatedPersonIds.has(p.id));
	
		// 3. Handle Kids' Table
		if (options.createKidsTable) {
			const kids = remainingPeople.filter(p => YOUNG_CHILD_RANGES.includes(p.age));
			if (kids.length > 0) {
				seatGroup(kids, 'Tavolo Bambini', options.capacity, options.tableType);
			}
		}
		remainingPeople = remainingPeople.filter(p => !seatedPersonIds.has(p.id));

		// 4. Handle Special Tables
		if (options.allowSpecialTables && options.specialTables.length > 0) {
			for (const specialTableRule of options.specialTables) {
				const groupIds = specialTableRule.groupIds;
				const tableGuests = remainingPeople.filter(p => groupIds.includes(p.strictGroupId));
				if (tableGuests.length > 0) {
					const groupNames = specialTableRule.groupIds.map(id => strictGroups.find(g => g.id === id)?.name || '').join(' & ');
					seatGroup(tableGuests, `Tavolo ${groupNames}`, specialTableRule.capacity, options.tableType);
				}
			}
		}
		remainingPeople = remainingPeople.filter(p => !seatedPersonIds.has(p.id));

		// 5. Handle remaining guests
		seatGroup(remainingPeople, 'Tavolo', options.capacity, options.tableType);
	
		await arrangementBatch.commit();
		setIsArranging(false);
		setShowArrangeOptions(false);
	}

	const handleResetLayout = async () => {
		setIsResetting(true);
		const peopleCollection = activeSection === 'guests' ? 'guests' : 'staff';
		const peoplePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${peopleCollection}`;
		const tablesPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
		
		const batch = writeBatch(db);

		people.forEach(p => {
			const table = tables.find(t => t.id === p.tableId);
			if (p.tableId && (!table || !table.locked)) {
				batch.update(doc(db, peoplePath, p.id), { tableId: null });
			}
		});
		
		tables.filter(t => !t.locked).forEach(t => {
			batch.delete(doc(db, tablesPath, t.id));
		});

		await batch.commit();
		setIsResetting(false);
		setShowResetConfirm(false);
	}

    const handleClearList = async () => {
        setIsClearingList(true);
        const collectionName = activeSection === 'guests' ? 'guests' : 'staff';
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${collectionName}`;
        
        try {
            const q = query(collection(db, path));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } catch (error) {
            console.error("Errore durante la pulizia della lista:", error);
            alert("Si è verificato un errore.");
        } finally {
            setIsClearingList(false);
            setShowClearListConfirm(false);
        }
    };
	
	const handleEditPerson = (person) => {
		setEditingPerson(person);
		setIsCreatingPerson(false);
	}

	const handleSavePerson = async (personId, personData, personType) => {
        if (!db || !user || !event) return;
        setIsSavingPerson(true);
        const collectionName = personType === 'staff' ? 'staff' : 'guests';
		const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${collectionName}`;
		
		try {
            if (personId) {
                const originalCollectionName = personData.role ? 'staff' : 'guests';
                const originalPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${originalCollectionName}`;
                await updateDoc(doc(db, originalPath, personId), personData);
            } else {
                await addDoc(collection(db, path), { ...personData, createdAt: serverTimestamp() });
            }
        } catch (error) {
            console.error("Errore salvataggio persona:", error);
            alert("Si è verificato un errore.");
        } finally {
            setIsSavingPerson(false);
            setEditingPerson(null);
            setIsCreatingPerson(false);
        }
	}

    const handleDeletePerson = async () => {
        if (!deletingPerson || !db || !user || !event) return;
        setIsDeletingPerson(true);
        
        const collectionName = deletingPerson.role ? 'staff' : 'guests';
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${collectionName}/${deletingPerson.id}`;

        try {
            await deleteDoc(doc(db, path));
        } catch (error) {
            console.error("Errore durante l'eliminazione della persona:", error);
            alert("Si è verificato un errore durante l'eliminazione.");
        } finally {
            setIsDeletingPerson(false);
            setDeletingPerson(null);
            setEditingPerson(null);
        }
    }

    const handleAddStrictGroup = async (groupName) => {
        if (!db || !user || !event) return;
        setIsSavingGroup(true);
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        await addDoc(collection(db, path), { name: groupName, createdAt: serverTimestamp() });
        setIsSavingGroup(false);
    }

    const handleDeleteStrictGroup = async (groupId) => {
        if (!db || !user || !event || !groupId) return;
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups/${groupId}`;
        await deleteDoc(doc(db, path));
    }
	
    const handleImportSave = async (peopleToImport) => {
        if (!db || !user || !event) return;
        setIsSavingImport(true);

        const peopleCollection = activeSection === 'guests' ? 'guests' : 'staff';
        const peoplePath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/${peopleCollection}`;
        const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        
        try {
            // Step 1: Identify and create any new groups.
            const groupNamesInCsv = [...new Set(peopleToImport.map(p => p.groupName).filter(Boolean))];
            
            const existingGroupsQuery = query(collection(db, groupsPath), where('name', 'in', groupNamesInCsv.length > 0 ? groupNamesInCsv : [' ']));
            const existingGroupsSnapshot = await getDocs(existingGroupsQuery);
            const existingGroupNames = existingGroupsSnapshot.docs.map(d => d.data().name);

            const groupsToCreate = groupNamesInCsv.filter(name => !existingGroupNames.includes(name));

            if (groupsToCreate.length > 0) {
                const groupsBatch = writeBatch(db);
                groupsToCreate.forEach(name => {
                    const newGroupRef = doc(collection(db, groupsPath));
                    groupsBatch.set(newGroupRef, { name, createdAt: serverTimestamp() });
                });
                await groupsBatch.commit();
            }

            // Step 2: Get a complete, up-to-date map of all relevant groups by name.
            const allGroupsSnapshot = await getDocs(collection(db, groupsPath));
            const allGroupsMap = new Map(allGroupsSnapshot.docs.map(d => [d.data().name, d.id]));

            // Step 3: Create the people with the correct strictGroupId.
            const peopleBatch = writeBatch(db);
            peopleToImport.forEach(person => {
                const newPersonRef = doc(collection(db, peoplePath));
                let personData;

                if (person.type === 'guest') {
                    const groupId = allGroupsMap.get(person.groupName) || '';
                    personData = {
                        name: person.name,
                        age: person.age,
                        strictGroupId: groupId,
                        likes: [], dislikes: [], mustSitWith: [], tableId: null, createdAt: serverTimestamp(),
                    };
                } else { // Staff
                    personData = {
                        name: person.name,
                        role: person.role,
                        tableId: null, createdAt: serverTimestamp(),
                    };
                }
                peopleBatch.set(newPersonRef, personData);
            });

            await peopleBatch.commit();

        } catch (error) {
            console.error("Error importing people:", error);
            alert("An error occurred during the import.");
        } finally {
            setIsSavingImport(false);
            setIsImporting(false); 
        }
    };


    const unassignedPeople = people.filter(p => !p.tableId);

    return (
        <div className="relative w-full h-full">
            {deletingTable && <DeleteConfirmationModal title="Conferma Eliminazione Tavolo" message={`Sei sicuro di voler eliminare permanentemente il tavolo <strong class="font-bold">${deletingTable.name}</strong>? Gli invitati verranno spostati tra i non assegnati.`} onConfirm={() => handleDeleteTable(deletingTable)} onCancel={() => setDeletingTable(null)} isDeleting={isDeletingTable} />}
			{deletingPerson && <DeleteConfirmationModal title="Conferma Eliminazione Persona" message={`Sei sicuro di voler eliminare permanentemente <strong class="font-bold">${deletingPerson.name}</strong> dalla lista?`} onConfirm={handleDeletePerson} onCancel={() => setDeletingPerson(null)} isDeleting={isDeletingPerson} />}
            {showResetConfirm && <DeleteConfirmationModal title="Resetta Disposizione" message={`Sei sicuro di voler resettare la disposizione? Tutti gli invitati verranno rimossi dai tavoli <strong class="font-bold">non bloccati</strong>.`} onConfirm={handleResetLayout} onCancel={() => setShowResetConfirm(false)} isDeleting={isResetting} confirmText="Sì, resetta"/>}
			{showArrangeOptions && <ArrangeOptionsModal onClose={() => setShowArrangeOptions(false)} onArrange={handleAutoArrange} isArranging={isArranging} guestGroups={strictGroups} />}
            {editingTable && <EditTableModal table={editingTable} onClose={() => setEditingTable(null)} onSave={handleUpdateTable} isSaving={isSavingTable} />}
            {(editingPerson || isCreatingPerson) && <PersonDetailModal person={editingPerson} allGuests={people} strictGroups={strictGroups} onSave={handleSavePerson} onClose={() => { setEditingPerson(null); setIsCreatingPerson(false); }} isSaving={isSavingPerson} isCreating={isCreatingPerson} onManageGroups={() => setIsManagingGroups(true)} onDelete={setDeletingPerson} initialType={activeSection === 'staff' ? 'staff' : 'guest'} />}
            {isManagingGroups && <StrictGroupModal groups={strictGroups} onAdd={handleAddStrictGroup} onDelete={handleDeleteStrictGroup} onClose={() => setIsManagingGroups(false)} isSaving={isSavingGroup} />}
            {isImporting && <ImportPeopleModal existingGroups={strictGroups} onClose={() => setIsImporting(false)} onSave={handleImportSave} isSaving={isSavingImport} activeSection={activeSection} />}
            {showClearListConfirm && <DeleteConfirmationModal title="Svuota Lista" message={`Sei sicuro di voler eliminare <strong class="font-bold">tutti</strong> gli ${activeSection === 'guests' ? 'invitati' : 'staff'} da questo evento? L'azione è irreversibile.`} onConfirm={handleClearList} onCancel={() => setShowClearListConfirm(false)} isDeleting={isClearingList} confirmText="Sì, svuota"/>}
            {isAddingFamily && <AddFamilyModal onClose={() => setIsAddingFamily(false)} onSave={() => {}} isSaving={false} />}


            <div className="w-full h-full p-4 md:p-8 text-left animate-fade-in dark:bg-gray-900">
                <div className="flex justify-between items-start mb-8">
                    <h1 style={{ fontFamily: 'Lora, serif' }} className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">{event.name}</h1>
					<div className="flex items-center space-x-2">
                        <div className="relative" ref={exportMenuRef}>
                            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center bg-green-600 text-white text-sm font-bold py-2 px-3 rounded-lg shadow hover:bg-green-700 transition-colors">
                                <ExportIcon className="h-4 w-4 mr-2" />
                                Esporta PDF
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20">
                                    <a href="#" onClick={(e) => {e.preventDefault(); handleExportPdf('guests')}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Lista Invitati/Staff</a>
                                    <a href="#" onClick={(e) => {e.preventDefault(); handleExportPdf('tables')}} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Disposizione Tavoli</a>
                                </div>
                            )}
                        </div>
						<button onClick={() => setShowArrangeOptions(true)} className="flex items-center bg-blue-500 text-white text-sm font-bold py-2 px-3 rounded-lg shadow hover:bg-blue-600 transition-colors">
							<MagicWandIcon className="h-4 w-4 mr-2" />
							Auto-Disponi
						</button>
						<button onClick={() => setShowResetConfirm(true)} className="flex items-center bg-yellow-500 text-white text-sm font-bold py-2 px-3 rounded-lg shadow hover:bg-yellow-600 transition-colors">
							<ResetIcon className="h-4 w-4 mr-2" />
							Resetta
						</button>
						<button onClick={() => onDeleteEvent(event)} className="flex items-center bg-red-500 text-white text-sm font-bold py-2 px-3 rounded-lg shadow hover:bg-red-600 transition-colors">
							<TrashIcon className="h-4 w-4 mr-2" />
							Elimina Evento
						</button>
					</div>
                </div>

                <div className="mb-6">
                    <div className="inline-flex rounded-lg shadow-sm">
                        <button onClick={() => setActiveSection('guests')} className={`px-6 py-3 text-lg font-bold rounded-l-lg transition-colors ${activeSection === 'guests' ? 'sz-accent-bg text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                            <GuestsIcon className="inline-block w-6 h-6 mr-2" />
                            Sala Invitati
                        </button>
                        <button onClick={() => setActiveSection('staff')} className={`px-6 py-3 text-lg font-bold rounded-r-lg transition-colors ${activeSection === 'staff' ? 'sz-accent-bg text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                            <StaffIcon className="inline-block w-6 h-6 mr-2" />
                            Sala Staff
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm flex flex-col">
                        <PeopleList 
                            people={unassignedPeople} 
                            isLoading={isLoadingPeople} 
                            onEditPerson={handleEditPerson}
                            activeSection={activeSection}
                            onAddPersonClick={() => setIsCreatingPerson(true)}
                            onAddGroupClick={() => setIsAddingFamily(true)}
                            onImportClick={() => setIsImporting(true)}
                            onClearListClick={() => setShowClearListConfirm(true)}
                        />
                    </div>
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm">
                         <AddTableForm onAddTable={handleAddTable} isAdding={false} />
                         <div className="flex justify-between items-center my-4">
                            <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-gray-800 dark:text-gray-100">Tavoli Creati ({tables.length})</h3>
                            <div className="inline-flex rounded-md shadow-sm">
                                <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'sz-accent-bg text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-50'} rounded-l-lg border border-gray-200 dark:border-gray-600`}>Elenco</button>
                                <button onClick={() => setViewMode('map')} className={`px-4 py-2 text-sm font-medium ${viewMode === 'map' ? 'sz-accent-bg text-white' : 'bg-white dark:bg-gray-700 hover:bg-gray-50'} rounded-r-lg border border-gray-200 dark:border-gray-600`}>Mappa</button>
                            </div>
                         </div>
                        
                        {viewMode === 'list' ? (
                            <TableList 
                                tables={tables}
                                people={people}
                                onEditPerson={handleEditPerson}
                                onEditTable={setEditingTable}
                                onDeleteTable={setDeletingTable}
                                onToggleLock={handleToggleLock}
                                activeSection={activeSection}
                            />
                        ) : (
                            <MapView tables={tables} people={people} />
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

function Sidebar({ user, auth, isCollapsed, events, isLoading, onSelectEvent, onNavigate, selectedEventId, onShowSettings }) {
    return (
        <aside className={`bg-white dark:bg-gray-800 min-h-screen p-4 flex flex-col shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center mb-8">
                <SeatZenLogo className="h-10 w-10 flex-shrink-0" />
                <h2 className={`text-xl text-gray-800 dark:text-gray-100 ml-2 flex items-baseline whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    <span style={{ fontFamily: 'Lora, serif' }} className="font-bold">Seat</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }} className="tracking-wider">ZEN</span>
                </h2>
            </div>
            <nav className="flex-grow">
                <button onClick={() => onNavigate('dashboard')} title="Dashboard" className="w-full flex items-center font-bold text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mb-2">
                    <div className="flex-shrink-0 w-10 flex justify-center"><HomeIcon className="h-6 w-6" /></div>
                    <span className={`ml-3 whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden' : 'inline'}`}>Dashboard</span>
                </button>
                <button onClick={() => onNavigate('faq')} title="Aiuto & FAQ" className="w-full flex items-center font-bold text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mb-4">
                    <div className="flex-shrink-0 w-10 flex justify-center"><HelpIcon className="h-6 w-6" /></div>
                    <span className={`ml-3 whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden' : 'inline'}`}>Aiuto & FAQ</span>
                </button>
                
                <h3 className={`px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : 'text-left'}`}>
                    <span className={isCollapsed ? 'hidden' : 'inline'}>Eventi</span>
                    <span className={isCollapsed ? 'inline text-lg' : 'hidden'}>·</span>
                </h3>
                {isLoading ? <p className="text-xs text-gray-400 px-3">...</p> : (
                    <ul className="space-y-1">
                        {events.map(event => (
                            <li key={event.id}>
                                <button onClick={() => onSelectEvent(event)} title={event.name} className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors truncate ${selectedEventId === event.id ? 'sz-accent-bg text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>{event.name}</span>
                                    {isCollapsed && <span className="w-full text-center font-bold">{event.name.charAt(0)}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </nav>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onShowSettings} title="Impostazioni" className="w-full flex items-center font-bold text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mb-4">
                    <div className="flex-shrink-0 w-10 flex justify-center">
                        <SettingsIcon className="h-6 w-6" />
                    </div>
                    <span className={`ml-3 whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden' : 'inline'}`}>Impostazioni</span>
                </button>
                {user && (
                    <div className="flex items-center px-3"> 
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full" />
                            ) : (
                                <UserAvatarIcon className="h-6 w-6" />
                            )}
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user.displayName || user.email}</p>
                            <button onClick={() => signOut(auth)} className="text-xs text-red-500 hover:underline">Logout</button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [events, setEvents] = useState([]);
    const [isEventsLoading, setIsEventsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [deletingEvent, setDeletingEvent] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [theme, setTheme] = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    
    useEffect(() => {
        if (Object.keys(firebaseConfig).length > 0) {
            try {
                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);
                setAuth(authInstance); setDb(dbInstance);
                const unsub = onAuthStateChanged(authInstance, (currentUser) => {
                    setUser(currentUser);
                    setIsLoading(false);
                });
                return () => unsub();
            } catch (e) { console.error(e); setIsLoading(false); }
        } else { console.warn("Firebase config missing"); setIsLoading(false); }
    }, []);

    useEffect(() => {
        if (!db || !user) {
            setEvents([]);
            setIsEventsLoading(false);
            return;
        };
        setIsEventsLoading(true);
        const path = `artifacts/${appId}/users/${user.uid}/events`;
        const q = query(collection(db, path), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const fetchedEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEvents(fetchedEvents);

            if (selectedEvent && !fetchedEvents.some(e => e.id === selectedEvent.id)) {
                setSelectedEvent(null);
                setCurrentView('dashboard');
            }
            setIsEventsLoading(false);
        }, (err) => { console.error(err); setIsEventsLoading(false); });
        return () => unsub();
    }, [db, user, selectedEvent]);

    const handleLogin = async (providerName) => {
        if(!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch(error) {
            console.error(`Errore durante il login con ${providerName}:`, error);
        }
    };

    const handleEmailRegister = async (email, password, setError) => {
        if(!auth) return;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleEmailLogin = async (email, password, setError) => {
        if(!auth) return;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSelectEvent = (event) => { setSelectedEvent(event); setCurrentView('eventView'); };

    const handleNavigate = (view) => { 
        if(view === 'dashboard' || view === 'faq') setSelectedEvent(null);
        setCurrentView(view); 
    };

    const handleSaveEvent = async (eventData) => {
        if (!db || !user) return; setIsSaving(true);
        try {
            const path = `artifacts/${appId}/users/${user.uid}/events`;
            const docRef = await addDoc(collection(db, path), { ...eventData, createdAt: serverTimestamp(), authorId: user.uid, useKidsTable: false });
            
			const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${docRef.id}/strictGroups`;
			const batch = writeBatch(db);
			DEFAULT_STRICT_GROUPS.forEach(groupName => {
				const newGroupRef = doc(collection(db, groupsPath));
				batch.set(newGroupRef, { name: groupName, createdAt: serverTimestamp() });
			});
			await batch.commit();
			
            const newEvent = { id: docRef.id, ...eventData };
            handleSelectEvent(newEvent);

        } catch (e) { console.error("Error saving event:", e); handleNavigate('dashboard'); } finally { setIsSaving(false); }
    };
    
    const handleDeleteEvent = async () => {
        if (!deletingEvent || !db || !user) return;
        setIsDeleting(true);

        const eventRef = doc(db, `artifacts/${appId}/users/${user.uid}/events`, deletingEvent.id);
        
        try {
            const batch = writeBatch(db);
            
            const collectionsToDelete = ['guests', 'staff', 'tables', 'strictGroups'];
            for (const coll of collectionsToDelete) {
                const collRef = collection(eventRef, coll);
                const snapshot = await getDocs(query(collRef));
                snapshot.forEach(doc => batch.delete(doc.ref));
            }

            batch.delete(eventRef);
            
            await batch.commit();
            
            setDeletingEvent(null);
            if (selectedEvent?.id === deletingEvent.id) {
                setSelectedEvent(null);
                setCurrentView('dashboard');
            }
        } catch(e) {
            console.error("Errore durante l'eliminazione dell'evento:", e);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const renderContent = () => {
        switch (currentView) {
            case 'createEvent': return <CreateEventForm onSave={handleSaveEvent} onCancel={() => handleNavigate('dashboard')} isSaving={isSaving} />;
            case 'eventView': return <EventView event={selectedEvent} db={db} user={user} onDeleteEvent={setDeletingEvent} />;
            case 'faq': return <FaqView />;
            case 'dashboard': default: return <Dashboard events={events} isEventsLoading={isEventsLoading} onSelectEvent={handleSelectEvent} onNavigate={handleNavigate} onDeleteEvent={setDeletingEvent} />;
        }
    };
    
    if (isLoading) {
         return <div className="flex justify-center items-center w-full h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-600 dark:text-gray-300">Caricamento applicazione...</p></div>;
    }

    if (!user) {
        return <LoginPage onLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailRegister={handleEmailRegister} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
             {deletingEvent && <DeleteConfirmationModal title="Conferma Eliminazione Evento" message={`Sei sicuro di voler eliminare permanentemente l'evento <strong class="font-bold">${deletingEvent.name}</strong>?<br/><span class="font-bold text-red-500">Tutti i dati collegati (invitati, staff, tavoli) verranno cancellati. Questa azione è irreversibile.</span>`} onConfirm={handleDeleteEvent} onCancel={() => setDeletingEvent(null)} isDeleting={isDeleting} />}
             {showSettings && <SettingsModal currentTheme={theme} onThemeChange={setTheme} onClose={() => setShowSettings(false)} />}
            
            <div className="relative">
                <Sidebar 
                    user={user}
                    auth={auth}
                    isCollapsed={isSidebarCollapsed} 
                    events={events} 
                    isLoading={isEventsLoading} 
                    onSelectEvent={handleSelectEvent} 
                    onNavigate={handleNavigate} 
                    selectedEventId={selectedEvent?.id} 
                    onShowSettings={() => setShowSettings(true)}
                />
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={isSidebarCollapsed ? "Espandi Sidebar" : "Collassa Sidebar"}
                    className="absolute top-1/2 -translate-y-1/2 -right-4 z-40 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-110 transition-all duration-200"
                >
                    {isSidebarCollapsed ? <ExpandIcon className="h-5 w-5"/> : <CollapseIcon className="h-5 w-5"/>}
                </button>
            </div>
            <div className="flex flex-col flex-grow">
                <main className="flex-grow overflow-y-auto">
                    {renderContent()}
                </main>
                <footer className="w-full text-center p-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    Made with <span className="text-red-500 mx-1">❤️</span> by 
                    <a href="https://www.iluminari3d.com" target="_blank" rel="noopener noreferrer" className="ml-1">
                        <IluminariLogo className="h-4" />
                    </a>
                </footer>
            </div>
        </div>
    );
}

export default App;

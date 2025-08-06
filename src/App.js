import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, writeBatch, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import seatzenLogo from './logos/seatzen-logo.png'; // IMPORTANTE: Importiamo il logo direttamente


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


// --- OMETTO I COMPONENTI MODAL E ALTRI PER BREVITÀ, SONO INVARIATI ---
// ...

function EventView({ event, db, user, onDeleteEvent }) {
    // ... tutti gli hooks (useState, useEffect) rimangono invariati ...
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

    if (!event) {
        return (
            <div className="flex justify-center items-center w-full h-full p-8 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-300">Caricamento evento in corso...</p>
            </div>
        );
    }

    const handleExportPdf = async (type) => {
        try {
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();
            
            const img = new Image();
            img.src = seatzenLogo;
            
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (err) => {
                    console.error("Errore nel caricamento del logo importato:", err);
                    reject("Impossibile caricare il logo.");
                };
            });

            doc.addImage(img, 'PNG', pageW - 45, 8, 30, 30);
            
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
                    fillColor: [181, 142, 72],
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
                
                // --- MODIFICA CHIAVE: CREAZIONE DEL CORPO DELLA TABELLA ---
                body = [];
                tables.forEach(table => {
                    const assignedPeople = people.filter(p => p.tableId === table.id);
                    
                    if (assignedPeople.length === 0) {
                        body.push([table.name, `0 / ${table.capacity}`, '(Nessuno)']);
                    } else {
                        // La prima riga contiene nome e capacità del tavolo, con rowSpan per unire le celle
                        const firstRow = [
                            { content: table.name, rowSpan: assignedPeople.length, styles: { verticalAlign: 'middle' } },
                            { content: `${assignedPeople.length} / ${table.capacity}`, rowSpan: assignedPeople.length, styles: { verticalAlign: 'middle' } },
                            assignedPeople[0].name
                        ];
                        body.push(firstRow);
        
                        // Le righe successive contengono solo i nomi degli altri invitati
                        for (let i = 1; i < assignedPeople.length; i++) {
                            body.push([assignedPeople[i].name]);
                        }
                    }
                });
                // --- FINE MODIFICA ---

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
    
    // ... il resto del file è invariato ...
    // ...
    // --- Ritorno il JSX del componente EventView e del componente App principale ---
    // ... (Il resto del codice è identico a quello che avevi già)

}

// ... tutto il resto del file App.js rimane invariato

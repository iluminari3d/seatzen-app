import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, setLogLevel, collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, writeBatch, where, getDocs, deleteDoc } from 'firebase/firestore';

// Componenti
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import EventView from './components/EventView';
import CreateEventForm from './components/CreateEventForm';
import FaqView from './components/FaqView';
import IluminariLogo from './components/IluminariLogo';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-seatzen-app';

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
        const q = query(collection(db, path));
        const unsub = onSnapshot(q, (snap) => {
            const fetchedEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEvents(fetchedEvents);
            if (selectedEvent) {
                const updatedSelectedEvent = fetchedEvents.find(e => e.id === selectedEvent.id);
                if (updatedSelectedEvent) {
                    setSelectedEvent(updatedSelectedEvent);
                } else {
                    setSelectedEvent(null);
                    setCurrentView('dashboard');
                }
            }
            setIsEventsLoading(false);
        }, (err) => { console.error(err); setIsEventsLoading(false); });
        return () => unsub();
    }, [db, user]);

    const handleLogin = async (providerName) => {
        if(!auth) return;
        const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
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
            const newEvent = { id: docRef.id, ...eventData, useKidsTable: false };
            handleSelectEvent(newEvent);
        } catch (e) { console.error("Error saving event:", e); handleNavigate('dashboard'); } finally { setIsSaving(false); }
    };
    
    const handleDeleteEvent = async () => {
        if (!deletingEvent || !db || !user) return;
        setIsDeleting(true);
        const eventRef = doc(db, `artifacts/${appId}/users/${user.uid}/events`, deletingEvent.id);
        
        try {
            const batch = writeBatch(db);
            const collectionsToDelete = ['guests', 'tables', 'strictGroups'];
            for (const coll of collectionsToDelete) {
                const collRef = collection(db, eventRef.path, coll);
                const snapshot = await getDocs(query(collRef));
                snapshot.forEach(doc => batch.delete(doc.ref));
            }
            batch.delete(eventRef);
            await batch.commit();
            setDeletingEvent(null);
             if(selectedEvent?.id === deletingEvent.id) {
                handleNavigate('dashboard');
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
            case 'eventView': return <EventView event={selectedEvent} db={db} user={user} />;
            case 'faq': return <FaqView />;
            case 'dashboard': default: return <Dashboard events={events} isEventsLoading={isEventsLoading} onSelectEvent={handleSelectEvent} onNavigate={handleNavigate} onDeleteEvent={setDeletingEvent} />;
        }
    };
    
    if (isLoading) {
         return <div className="flex justify-center items-center w-full h-screen bg-[#F5F0E6]"><p className="text-[#4A5B53]">Caricamento applicazione...</p></div>;
    }

    if (!user) {
        return <LoginPage onLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailRegister={handleEmailRegister} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F5F0E6]">
             <div className="flex flex-grow">
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
                     />
                     <button 
                         onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                         title={isSidebarCollapsed ? "Espandi Sidebar" : "Collassa Sidebar"}
                         className="absolute top-1/2 -translate-y-1/2 -right-4 z-40 bg-white p-2 rounded-full shadow-lg text-gray-600 hover:bg-gray-100 hover:scale-110 transition-all duration-200"
                     >
                         {isSidebarCollapsed ? <ExpandIcon className="h-5 w-5"/> : <CollapseIcon className="h-5 w-5"/>}
                     </button>
                 </div>
                 <main className="flex-grow h-screen overflow-y-auto">
                      {renderContent()}
                 </main>
             </div>
              <footer className="w-full text-center p-4 text-xs text-gray-500 flex items-center justify-center">
                Made with <span className="text-red-500 mx-1">❤️</span> by 
                <a href="https://www.iluminari3d.com" target="_blank" rel="noopener noreferrer" className="ml-1">
                    <IluminariLogo className="h-4 fill-current text-gray-800" />
                </a>
            </footer>
        </div>
    );
}

export default App;
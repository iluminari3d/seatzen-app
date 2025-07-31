import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, writeBatch, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';

// --- Author: I Luminari SRLS - www.iluminari3d.com ---
// --- Versione con correzioni per errori di build (Sintassi Componenti) ---

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG) : {};
const appId = 'seatzen-prod-app';

// --- COSTANTI ---
const AGE_RANGES = [ "Non specificata", "0-2 anni", "3-12 anni", "13-17 anni", "18-25 anni", "26-40 anni", "41-60 anni", "61+ anni" ];
const YOUNG_CHILD_RANGES = ["0-2 anni", "3-12 anni"];
const STAFF_ROLES = ["Staff", "Fotografo", "Videomaker", "DJ", "Musicista", "Animatore", "Wedding Planner", "Altro"];

// --- HOOKS PERSONALIZZATI ---
function useTheme() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('seatzen-theme') : 'system';
        return savedTheme || 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        if (typeof window !== 'undefined') {
            localStorage.setItem('seatzen-theme', theme);
        }
    }, [theme]);

    return [theme, setTheme];
};

// --- COMPONENTI GRAFICI (SVG & UI) ---
function IluminariLogo({ className }) { return ( <svg className={className} id="Livello_2" data-name="Livello 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304.55 55.49"><g id="Livello_1-2" data-name="Livello 1"><g id="Avatar_Black" data-name="Avatar Black"><g><g><path d="M.96,1.04h-.96v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04H.96Z"/><path d="M50.95,41.8h-.96v.96c0,8.26-.53,8.75-4.72,8.75h-9.43V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04h-9.88v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h23.45v-12.67h-1.25Z"/><path d="M83.32,47.68h-.96v.96c0,2.4-1.07,3.89-2.79,3.89-1.62,0-2.44-3.22-2.44-9.56V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v28.69c0,12.04-4.36,18.53-8.47,18.53-4.85,0-5.23-6.98-5.23-9.12V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v37.08c0,7.59,4.01,13.1,9.54,13.1,3.7,0,6.82-2.22,9.14-6.48,1.19,5.26,3.75,6.48,5.86,6.48,3.9,0,5.68-3.55,5.68-6.85v-.96h-1.7Z"/><path d="M115.7,1.04h-.66l-.24.61-11.59,29.7L93.1,1.69l-.22-.65h-7.39v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.22s.02.05.03.08c1.71,4.99,4.55,13.32,9.4,27.63l-3.17,8.28c-1.05,2.55-.78,5.84.66,7.98.99,1.48,2.49,2.3,4.22,2.3,1.88,0,3.46-.82,4.58-2.38,1.55-2.16,1.98-5.58,1.05-8.31l-3.18-9.38,10.62-27.14v41.91c0,1.98-.39,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.31c0-1.98.46-1.98,1.82-1.98h.96V1.04h-6.59ZM103.72,51.35c-.58.9-1.45,1.17-1.61,1.19-.73,0-1.3-.31-1.73-.93-1.05-1.51-.98-4.35-.47-5.71l1.92-4.87c.59,1.77,1.24,3.68,1.95,5.67.67,1.96.65,3.57-.05,4.66Z"/><path d="M130.01,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M132.17,50.19V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98Z"/><path d="M167.39,1.04h-7.32v2.29h.96c1.36,0,1.82,0,1.82,1.98v36.94L144.53,1.6l-.26-.57h-6.53v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.5l20.47,45.41h1.85V5.31c0-1.98.39-1.98,1.82-1.98h.96V1.04h-.96Z"/><path d="M205.62,47.68h-.96v.96c0,2.87-1.41,3.89-2.73,3.89-1.66,0-2.5-3.22-2.5-9.56V15.68C199.42,8.45,195.91,0,186.02,0c-4.81,0-11.28,2.6-13.69,9.93l-.28.85.83.34,2.5,1.03,1.01.42.29-1.05c1.72-6.32,6.2-8.56,9.52-8.56,7.86,0,8.92,7.06,8.92,13.97v2.95c-9.7.18-24.82,3.27-24.82,20.67,0,8.8,5.07,14.94,12.32,14.94,5.54,0,9.81-3.14,12.72-9.34.66,6.2,2.79,9.34,6.37,9.34,4.12,0,5.62-4.1,5.62-6.85v-.96h-1.7ZM182.61,52.54c-5.09,0-8.01-4.37-8.01-11.99,0-15.83,14.62-17.89,20.51-18.08v4.61c0,5.97-.9,25.45-12.5,25.45Z"/><path d="M234.87,49.28l-12.8-19.41c.2.01.4.02.59.02,5.99,0,12.04-4.92,12.04-15.9,0-8.23-4.91-12.96-13.46-12.96h-12.55v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98v-21.49l14.76,22.24c1.47,2.24,3.67,3.52,6.03,3.52h2.78v-2.29h-.96c-1.25,0-1.72-.27-3.52-2.89ZM221.58,26.49c-1.74,0-3.55-.61-5.37-1.83l-.42-.28V5.31c0-.84,2.07-1.32,5.68-1.32,3.17,0,8.52,2.14,8.52,10.15,0,7.16-3.54,12.35-8.41,12.35Z"/><path d="M246.22,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M250.21,52.17c-1.36,0-1.82,0-1.82-1.98V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96Z"/></g><g><path d="M272.67,15.88c2.22-1.52,3.69-4.12,3.69-7.08,0-4.97-4.03-8.31-10.04-8.31-4.38,0-7.91,1.94-9.2,5.06-1.13,2.73-.32,5.84,2.16,8.32l.57.57,2.39-.9-.62-1.24c-1.17-2.32-1.26-4.51-.24-6.15.99-1.6,2.94-2.56,5.21-2.56,3.64,0,5.48,1.73,5.48,5.14,0,5.49-5.51,5.91-7.2,5.91h-1.24v3.13h1.24c4.09,0,8.45.51,8.45,6.6,0,4.77-3.38,6.9-6.73,6.9-2.27,0-4.22-.96-5.21-2.56-1.01-1.64-.93-3.83.24-6.15l.62-1.24-2.39-.9-.57.57c-2.48,2.48-3.29,5.59-2.16,8.32,1.29,3.12,4.82,5.06,9.2,5.06,4.69,0,11.29-3.1,11.29-9.99,0-4.67-2.36-7.22-4.94-8.48Z"/><path d="M287.53,1.09h-10.04v2.75h1.24c.48,0,.72.02.83.05.02.07.04.2.04.43v26.25c0,.23-.02.36-.04.42-.1.03-.32.06-.83.06h-1.24v2.7h10.04c12.55,0,17.02-8.41,17.02-16.29s-4.47-16.37-17.02-16.37ZM287.71,30.66c-2.55,0-3.47-.21-3.8-.35V4.56c.31-.13,1.22-.38,3.8-.38,5.65,0,12.25,3.48,12.25,13.28s-6.33,13.2-12.25,13.2Z"/></g><g><path d="M264.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M290.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M277.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M303.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/></g></g></g></g>
</svg> ); };
function GoogleIcon({ className }) { return ( <svg className={className} viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.546,44,29.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg> ); };
function UserAvatarIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> ); };
function LogoutIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> ); };
function SeatZenLogo({ className }) { return ( <svg id="Livello_2" data-name="Livello 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1169.07 1169.07" className={className}><g id="Livello_3" data-name="Livello 3"><g><path className="text-gray-800 dark:text-gray-200" fill="currentColor" d="M1123.12,357c-29.44-69.61-71.59-132.12-125.26-185.79-53.67-53.67-116.18-95.82-185.79-125.26C739.99,15.46,663.43,0,584.54,0h-2.77c-6.76,0-12.23,5.48-12.23,12.23v38.1c0,6.76,5.48,12.23,12.23,12.23h0c288.46,0,524.36,232.82,524.74,521.27.38,288.37-234.3,523.06-522.68,522.68-288.46-.38-521.27-236.29-521.27-524.74h0c0-6.76-5.48-12.23-12.23-12.23H15c-8.28,0-15,6.72-15,15h0c0,78.9,15.46,155.45,45.95,227.54,29.44,69.61,71.58,132.12,125.26,185.79,53.67,53.67,116.18,95.82,185.79,125.26,72.09,30.49,148.64,45.95,227.54,45.95s155.45-15.46,227.54-45.95c69.61-29.44,132.12-71.59,185.79-125.26,53.67-53.67,95.82-116.18,125.26-185.79,30.49-72.09,45.95-148.64,45.95-227.54s-15.46-155.45-45.95-227.54Z"/><circle className="sz-accent-fill" fill="currentColor" cx="584.54" cy="584.54" r="328.66"/><g><path className="sz-accent-fill" fill="currentColor" d="M584.64,235.81c22.48,0,44.63,2.14,66.32,6.34,3.4.66,6.69-1.54,7.41-4.93.97-4.57,1.95-9.14,2.92-13.71.74-3.49-1.52-6.91-5.03-7.59-23.18-4.5-47.12-6.86-71.62-6.87-24.49,0-48.42,2.34-71.6,6.82-3.51.68-5.78,4.1-5.03,7.59.97,4.57,1.95,9.14,2.92,13.71.72,3.38,4.01,5.59,7.41,4.93,21.69-4.18,43.83-6.3,66.29-6.3Z"/><path className="sz-accent-fill" fill="currentColor" d="M831.2,338.01c15.89,15.9,30.04,33.07,42.41,51.38,1.94,2.87,5.82,3.64,8.73,1.76,3.92-2.54,7.84-5.09,11.76-7.63,2.99-1.94,3.81-5.97,1.81-8.92-13.21-19.57-28.47-38.17-45.79-55.5-17.31-17.32-35.89-32.58-55.45-45.8-2.96-2-6.98-1.19-8.93,1.81-2.54,3.92-5.09,7.84-7.63,11.76-1.88,2.9-1.11,6.79,1.75,8.73,18.29,12.38,35.45,26.53,51.33,42.42Z"/><path className="sz-accent-fill" fill="currentColor" d="M933.28,584.62c0,22.48-2.14,44.63-6.34,66.32-.66,3.4,1.54,6.69,4.93,7.41,4.57.97,9.14,1.95,13.71,2.92,3.49.74,6.91-1.52,7.59-5.03,4.5-23.18,6.86-47.12,6.87-71.62s-2.34-48.42-6.82-71.6c-.68-3.51-4.1-5.78-7.59-5.03-4.57.97-9.14-1.95-13.71,2.92-3.38.72-5.59,4.01-4.93,7.41,4.18,21.69,6.3,43.83,6.3,66.29Z"/><path className="sz-accent-fill" fill="currentColor" d="M831.08,831.19c-15.9,15.89-33.07,30.04-51.38,42.41-2.87,1.94-3.64,5.82-1.76,8.73,2.54,3.92,5.09,7.84,7.63,11.76,1.94,2.99,5.97,3.81,8.92,1.81,19.57-13.21,38.17-28.47,55.5-45.79,17.32-17.31,32.58-35.89,45.8-55.45,2-2.96-1.19-6.98-1.81-8.93-3.92-2.54-7.84-5.09-11.76-7.63-2.9-1.88-6.79-1.11-8.73,1.75-12.38,18.29-26.53,35.45-42.42,51.33Z"/><path className="sz-accent-fill" fill="currentColor" d="M584.46,933.27c-22.48,0-44.63-2.14-66.32-6.34-3.4-.66-6.69,1.54-7.41,4.93-.97,4.57-1.95,9.14-2.92,13.71-.74,3.49,1.52,6.91,5.03,7.59,23.18,4.5,47.12,6.86,71.62,6.87,24.49,0,48.42-2.34,71.6-6.82,3.51-.68-5.78,4.1,5.03-7.59-.97-4.57-1.95,9.14-2.92-13.71-.72-3.38-4.01-5.59-7.41-4.93-21.69,4.18-43.83,6.3-66.29,6.3Z"/><path className="sz-accent-fill" fill="currentColor" d="M337.9,831.06c-15.89-15.9-30.04-33.07-42.41-51.38-1.94-2.87-5.82-3.64-8.73-1.76-3.92,2.54-7.84-5.09-11.76,7.63-2.99,1.94-3.81,5.97-1.81,8.92,13.21,19.57,28.47,38.17,45.79,55.5,17.31,17.32,35.89,32.58,55.45,45.8,2.96,2,6.98,1.19,8.93-1.81,2.54-3.92,5.09-7.84,7.63-11.76,1.88-2.9,1.11-6.79-1.75-8.73-18.29-12.38-35.45-26.53-51.33-42.42Z"/><path className="sz-accent-fill" fill="currentColor" d="M235.82,584.45c0-22.48,2.14-44.63,6.34-66.32.66-3.4-1.54-6.69-4.93-7.41-4.57-.97-9.14-1.95-13.71-2.92-3.49-.74-6.91,1.52-7.59,5.03-4.5,23.18-6.86,47.12-6.87,71.62s2.34,48.42,6.82,71.6c.68,3.51,4.1,5.78,7.59,5.03,4.57-.97,9.14-1.95,13.71-2.92,3.38-.72,5.59-4.01,4.93-7.41-4.18-21.69-6.3-43.83-6.3-66.29Z"/><path className="sz-accent-fill" fill="currentColor" d="M338.02,337.89c15.9-15.89,33.07-30.04,51.38-42.41,2.87-1.94,3.64-5.82,1.76-8.73-2.54-3.92-5.09-7.84-7.63-11.76-1.94-2.99-5.97-3.81-8.92-1.81-19.57,13.21-38.17-28.47-55.5,45.79-17.32,17.31-32.58,35.89-45.8,55.45-2,2.96-1.19-6.98,1.81,8.93,3.92,2.54,7.84-5.09,11.76,7.63,2.9,1.88,6.79,1.11,8.73-1.75,12.38-18.29,26.53-35.45,42.42-51.33Z"/></g></g></g></svg> ); };
function GroupIcon({ className }) { return ( <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> ); };
function HomeIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> ); };
function PlusIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> ); };
function CollapseIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg> ); };
function ExpandIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> ); };
function TrashIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> ); };
function HelpIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 18v.01"></path></svg> ); };
function EditIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg> ); };
function LockIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> ); };
function UnlockIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8zM5 11h2"></path></svg> ); };
function SettingsIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>); };
function GuestsIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>); };
function StaffIcon({ className }) { return ( <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>); };

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

// --- MODALI ---
function SettingsModal({ currentTheme, onThemeChange, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-sm m-4 text-center">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Impostazioni Tema</h2>
                <div className="space-y-4">
                    <button onClick={() => onThemeChange('light')} className={`w-full py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        ☀️ Chiaro
                    </button>
                    <button onClick={() => onThemeChange('dark')} className={`w-full py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        🌙 Scuro
                    </button>
                    <button onClick={() => onThemeChange('system')} className={`w-full py-2 px-4 rounded-lg text-lg transition-colors ${currentTheme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        🖥️ Sistema
                    </button>
                </div>
                <button onClick={onClose} className="mt-8 text-gray-600 dark:text-gray-300 font-bold py-2 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Chiudi</button>
            </div>
        </div>
    );
};

// ... (Altri componenti modali e di UI definiti qui come funzioni)

// --- VISTE PRINCIPALI ---
// ... (Componenti come Dashboard, FaqView, EventCard, etc. definiti qui come funzioni)

// --- COMPONENTE PRINCIPALE APP ---
function App() {
    // ... (tutta la logica dell'app come prima)
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
    
    // Hook per il tema
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
                        <IluminariLogo className="h-4 fill-current text-gray-800 dark:text-gray-200" />
                    </a>
                </footer>
            </div>
        </div>
    );
}

export default App;

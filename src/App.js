import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, setLogLevel, collection, addDoc, serverTimestamp, query, onSnapshot, doc, updateDoc, writeBatch, where, getDocs, deleteDoc } from 'firebase/firestore';

// --- Author: I Luminari SRLS - www.iluminari3d.com ---

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG) : {};
const appId = 'seatzen-prod-app';

// --- COSTANTI ---
const AGE_RANGES = [ "Non specificata", "0-2 anni", "3-12 anni", "13-17 anni", "18-25 anni", "26-40 anni", "41-60 anni", "61+ anni" ];
const YOUNG_CHILD_RANGES = ["0-2 anni", "3-12 anni"];


// --- COMPONENTI GRAFICI (SVG & UI) ---
const IluminariLogo = ({ className }) => ( <svg className={className} id="Livello_2" data-name="Livello 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304.55 55.49"><g id="Livello_1-2" data-name="Livello 1"><g id="Avatar_Black" data-name="Avatar Black"><g><g><path d="M.96,1.04h-.96v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04H.96Z"/><path d="M50.95,41.8h-.96v.96c0,8.26-.53,8.75-4.72,8.75h-9.43V5.38c0-1.98.35-1.98,1.82-1.98h.96V1.04h-9.88v2.37h.96c1.47,0,1.82,0,1.82,1.98v44.81c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h23.45v-12.67h-1.25Z"/><path d="M83.32,47.68h-.96v.96c0,2.4-1.07,3.89-2.79,3.89-1.62,0-2.44-3.22-2.44-9.56V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v28.69c0,12.04-4.36,18.53-8.47,18.53-4.85,0-5.23-6.98-5.23-9.12V1.04h-7.09v2.29h.96c1.36,0,1.82,0,1.82,1.98v37.08c0,7.59,4.01,13.1,9.54,13.1,3.7,0,6.82-2.22,9.14-6.48,1.19,5.26,3.75,6.48,5.86,6.48,3.9,0,5.68-3.55,5.68-6.85v-.96h-1.7Z"/><path d="M115.7,1.04h-.66l-.24.61-11.59,29.7L93.1,1.69l-.22-.65h-7.39v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.22s.02.05.03.08c1.71,4.99,4.55,13.32,9.4,27.63l-3.17,8.28c-1.05,2.55-.78,5.84.66,7.98.99,1.48,2.49,2.3,4.22,2.3,1.88,0,3.46-.82,4.58-2.38,1.55-2.16,1.98-5.58,1.05-8.31l-3.18-9.38,10.62-27.14v41.91c0,1.98-.39,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V5.31c0-1.98.46-1.98,1.82-1.98h.96V1.04h-6.59ZM103.72,51.35c-.58.9-1.45,1.17-1.61,1.19-.73,0-1.3-.31-1.73-.93-1.05-1.51-.98-4.35-.47-5.71l1.92-4.87c.59,1.77,1.24,3.68,1.95,5.67.67,1.96.65,3.57-.05,4.66Z"/><path d="M130.01,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M132.17,50.19V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98Z"/><path d="M167.39,1.04h-7.32v2.29h.96c1.36,0,1.82,0,1.82,1.98v36.94L144.53,1.6l-.26-.57h-6.53v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h8.29v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98V9.5l20.47,45.41h1.85V5.31c0-1.98.39-1.98,1.82-1.98h.96V1.04h-.96Z"/><path d="M205.62,47.68h-.96v.96c0,2.87-1.41,3.89-2.73,3.89-1.66,0-2.5-3.22-2.5-9.56V15.68C199.42,8.45,195.91,0,186.02,0c-4.81,0-11.28,2.6-13.69,9.93l-.28.85.83.34,2.5,1.03,1.01.42.29-1.05c1.72-6.32,6.2-8.56,9.52-8.56,7.86,0,8.92,7.06,8.92,13.97v2.95c-9.7.18-24.82,3.27-24.82,20.67,0,8.8,5.07,14.94,12.32,14.94,5.54,0,9.81-3.14,12.72-9.34.66,6.2,2.79,9.34,6.37,9.34,4.12,0,5.62-4.1,5.62-6.85v-.96h-1.7ZM182.61,52.54c-5.09,0-8.01-4.37-8.01-11.99,0-15.83,14.62-17.89,20.51-18.08v4.61c0,5.97-.9,25.45-12.5,25.45Z"/><path d="M234.87,49.28l-12.8-19.41c.2.01.4.02.59.02,5.99,0,12.04-4.92,12.04-15.9,0-8.23-4.91-12.96-13.46-12.96h-12.55v2.29h.96c1.36,0,1.82,0,1.82,1.98v44.88c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96c-1.36,0-1.82,0-1.82-1.98v-21.49l14.76,22.24c1.47,2.24,3.67,3.52,6.03,3.52h2.78v-2.29h-.96c-1.25,0-1.72-.27-3.52-2.89ZM221.58,26.49c-1.74,0-3.55-.61-5.37-1.83l-.42-.28V5.31c0-.84,2.07-1.32,5.68-1.32,3.17,0,8.52,2.14,8.52,10.15,0,7.16-3.54,12.35-8.41,12.35Z"/><path d="M246.22,7.75c.27,0,.54-.04.8-.12,1.66-.51,2.68-2.54,2.31-4.62-.33-1.78-1.6-3.01-3.1-3.01h0c-.27,0-.54.04-.8.12-1.72.51-2.74,2.49-2.37,4.62.32,1.75,1.65,3.01,3.16,3.01Z"/><path d="M250.21,52.17c-1.36,0-1.82,0-1.82-1.98V13.62c0-2.27-1.47-4.05-3.35-4.05h-3.75v2.29h.96c1.47,0,1.82,0,1.82,1.98v36.35c0,1.98-.46,1.98-1.82,1.98h-.96v2.29h9.88v-2.29h-.96Z"/></g><g><path d="M272.67,15.88c2.22-1.52,3.69-4.12,3.69-7.08,0-4.97-4.03-8.31-10.04-8.31-4.38,0-7.91,1.94-9.2,5.06-1.13,2.73-.32,5.84,2.16,8.32l.57.57,2.39-.9-.62-1.24c-1.17-2.32-1.26-4.51-.24-6.15.99-1.6,2.94-2.56,5.21-2.56,3.64,0,5.48,1.73,5.48,5.14,0,5.49-5.51,5.91-7.2,5.91h-1.24v3.13h1.24c4.09,0,8.45.51,8.45,6.6,0,4.77-3.38,6.9-6.73,6.9-2.27,0-4.22-.96-5.21-2.56-1.01-1.64-.93-3.83.24-6.15l.62-1.24-2.39-.9-.57.57c-2.48,2.48-3.29,5.59-2.16,8.32,1.29,3.12,4.82,5.06,9.2,5.06,4.69,0,11.29-3.1,11.29-9.99,0-4.67-2.36-7.22-4.94-8.48Z"/><path d="M287.53,1.09h-10.04v2.75h1.24c.48,0,.72.02.83.05.02.07.04.2.04.43v26.25c0,.23-.02.36-.04.42-.1.03-.32.06-.83.06h-1.24v2.7h10.04c12.55,0,17.02-8.41,17.02-16.29s-4.47-16.37-17.02-16.37ZM287.71,30.66c-2.55,0-3.47-.21-3.8-.35V4.56c.31-.13,1.22-.38,3.8-.38,5.65,0,12.25,3.48,12.25,13.28s-6.33,13.2-12.25,13.2Z"/></g><g><path d="M264.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M290.3,41.89h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M277.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/><path d="M303.3,50.17h-1.52v-1.52c0-.69-.56-1.25-1.25-1.25s-1.25.56-1.25,1.25v1.52h-1.52c-.69,0-1.25.56-1.25,1.25s.56,1.25,1.25,1.25h1.52v1.52c0,.69.56,1.25,1.25,1.25s1.25-.56,1.25-1.25v-1.52h1.52c.69,0,1.25-.56,1.25-1.25s-.56-1.25-1.25-1.25Z"/></g></g></g></g>
    </svg>
);

const GoogleIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.546,44,29.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const UserAvatarIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);


const LogoutIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
);


const SeatZenLogo = ({ className }) => (
    <svg id="Livello_2" data-name="Livello 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1169.07 1169.07" className={className}>
        <g id="Livello_3" data-name="Livello 3">
            <g>
            <path fill="#3a4a42" d="M1123.12,357c-29.44-69.61-71.59-132.12-125.26-185.79-53.67-53.67-116.18-95.82-185.79-125.26C739.99,15.46,663.43,0,584.54,0h-2.77c-6.76,0-12.23,5.48-12.23,12.23v38.1c0,6.76,5.48,12.23,12.23,12.23h0c288.46,0,524.36,232.82,524.74,521.27.38,288.37-234.3,523.06-522.68,522.68-288.46-.38-521.27-236.29-521.27-524.74h0c0-6.76-5.48-12.23-12.23-12.23H15c-8.28,0-15,6.72-15,15h0c0,78.9,15.46,155.45,45.95,227.54,29.44,69.61,71.58,132.12,125.26,185.79,53.67,53.67,116.18,95.82,185.79,125.26,72.09,30.49,148.64,45.95,227.54,45.95s155.45-15.46,227.54-45.95c69.61-29.44,132.12-71.59,185.79-125.26,53.67-53.67,95.82-116.18,125.26-185.79,30.49-72.09,45.95-148.64,45.95-227.54s-15.46-155.45-45.95-227.54Z"/>
            <circle fill="#b58e48" cx="584.54" cy="584.54" r="328.66"/>
            <g>
                <path fill="#b58e48" d="M584.64,235.81c22.48,0,44.63,2.14,66.32,6.34,3.4.66,6.69-1.54,7.41-4.93.97-4.57,1.95-9.14,2.92-13.71.74-3.49-1.52-6.91-5.03-7.59-23.18-4.5-47.12-6.86-71.62-6.87-24.49,0-48.42,2.34-71.6,6.82-3.51.68-5.78,4.1-5.03,7.59.97,4.57,1.95,9.14,2.92,13.71.72,3.38,4.01,5.59,7.41,4.93,21.69-4.18,43.83-6.3,66.29-6.3Z"/>
                <path fill="#b58e48" d="M831.2,338.01c15.89,15.9,30.04,33.07,42.41,51.38,1.94,2.87,5.82,3.64,8.73,1.76,3.92-2.54,7.84-5.09,11.76-7.63,2.99-1.94,3.81-5.97,1.81-8.92-13.21-19.57-28.47-38.17-45.79-55.5-17.31-17.32-35.89-32.58-55.45-45.8-2.96-2-6.98-1.19-8.93,1.81-2.54,3.92-5.09,7.84-7.63,11.76-1.88,2.9-1.11,6.79,1.75,8.73,18.29,12.38,35.45,26.53,51.33,42.42Z"/>
                <path fill="#b58e48" d="M933.28,584.62c0,22.48-2.14,44.63-6.34,66.32-.66,3.4,1.54,6.69,4.93,7.41,4.57.97,9.14,1.95,13.71,2.92,3.49.74,6.91-1.52,7.59-5.03,4.5-23.18,6.86-47.12,6.87-71.62s-2.34-48.42-6.82-71.6c-.68-3.51-4.1-5.78-7.59-5.03-4.57.97-9.14-1.95-13.71,2.92-3.38.72-5.59,4.01-4.93,7.41,4.18,21.69,6.3,43.83,6.3,66.29Z"/>
                <path fill="#b58e48" d="M831.08,831.19c-15.9,15.89-33.07,30.04-51.38,42.41-2.87,1.94-3.64,5.82-1.76,8.73,2.54,3.92,5.09,7.84,7.63,11.76,1.94,2.99,5.97,3.81,8.92,1.81,19.57-13.21,38.17-28.47,55.5-45.79,17.32-17.31,32.58-35.89,45.8-55.45,2-2.96-1.19-6.98-1.81-8.93-3.92-2.54-7.84-5.09-11.76-7.63-2.9-1.88-6.79-1.11-8.73,1.75-12.38,18.29-26.53,35.45-42.42,51.33Z"/>
                <path fill="#b58e48" d="M584.46,933.27c-22.48,0-44.63-2.14-66.32-6.34-3.4-.66-6.69,1.54-7.41,4.93-.97,4.57-1.95,9.14-2.92,13.71-.74,3.49,1.52,6.91,5.03,7.59,23.18,4.5,47.12,6.86,71.62,6.87,24.49,0,48.42-2.34,71.6-6.82,3.51-.68-5.78,4.1,5.03-7.59-.97-4.57-1.95,9.14-2.92-13.71-.72-3.38-4.01-5.59-7.41-4.93-21.69,4.18-43.83,6.3-66.29,6.3Z"/>
                <path fill="#b58e48" d="M337.9,831.06c-15.89-15.9-30.04-33.07-42.41-51.38-1.94-2.87-5.82-3.64-8.73-1.76-3.92,2.54-7.84-5.09-11.76,7.63-2.99,1.94-3.81,5.97-1.81,8.92,13.21,19.57,28.47,38.17,45.79,55.5,17.31,17.32,35.89,32.58,55.45,45.8,2.96,2,6.98,1.19,8.93-1.81,2.54-3.92,5.09-7.84,7.63-11.76,1.88-2.9,1.11-6.79-1.75-8.73-18.29-12.38-35.45-26.53-51.33-42.42Z"/>
                <path fill="#b58e48" d="M235.82,584.45c0-22.48,2.14-44.63,6.34-66.32.66-3.4-1.54-6.69-4.93-7.41-4.57-.97-9.14-1.95-13.71-2.92-3.49-.74-6.91,1.52-7.59,5.03-4.5,23.18-6.86,47.12-6.87,71.62s2.34,48.42,6.82,71.6c.68,3.51,4.1,5.78,7.59,5.03,4.57-.97,9.14-1.95,13.71-2.92,3.38-.72,5.59-4.01,4.93-7.41-4.18-21.69-6.3-43.83-6.3-66.29Z"/>
                <path fill="#b58e48" d="M338.02,337.89c15.9-15.89,33.07-30.04,51.38-42.41,2.87-1.94,3.64-5.82,1.76-8.73-2.54-3.92-5.09-7.84-7.63-11.76-1.94-2.99-5.97-3.81-8.92-1.81-19.57,13.21-38.17,28.47-55.5,45.79-17.32,17.31-32.58,35.89-45.8,55.45-2,2.96-1.19-6.98,1.81,8.93,3.92,2.54,7.84-5.09,11.76,7.63,2.9,1.88,6.79,1.11,8.73-1.75,12.38-18.29,26.53-35.45,42.42-51.33Z"/>
            </g>
            </g>
        </g>
    </svg>
);


const GroupIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
);

const HomeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
);

const PlusIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

const CollapseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const ExpandIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);

const HelpIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 18v.01"></path></svg>
);

const EditIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"></path></svg>
);

const LockIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
);

const UnlockIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8zM5 11h2"></path></svg>
);


const FormInput = ({ label, ...props }) => (
    <div className="w-full mb-6 text-left">
        <label style={{ fontFamily: 'Inter, sans-serif' }} className="block text-[#4A5B53] text-sm font-bold mb-2">
            {label}
        </label>
        <input 
            style={{ fontFamily: 'Inter, sans-serif' }}
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50] bg-white"
            {...props}
        />
    </div>
);

// --- MODALI ---
const DeleteConfirmationModal = ({ title, message, onConfirm, onCancel, isDeleting, confirmText = 'Sì, elimina' }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4 text-center">
            <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-red-600 mb-4">{title}</h2>
            <p className="text-gray-700 mb-6" dangerouslySetInnerHTML={{ __html: message }}></p>
            <div className="flex justify-center space-x-4">
                <button onClick={onCancel} className="text-gray-600 font-bold py-2 px-6 rounded-lg hover:bg-gray-200">Annulla</button>
                <button onClick={onConfirm} disabled={isDeleting} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-red-700 disabled:bg-red-400">
                    {isDeleting ? 'Eliminazione...' : confirmText}
                </button>
            </div>
        </div>
    </div>
);

const ImportGuestsModal = ({ existingGroups, onSave, onClose, isSaving }) => {
    const [parsedGuests, setParsedGuests] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError('');

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            try {
                let guestsData;
                 if (file.name.endsWith('.csv')) {
                    guestsData = content.split('\n').filter(row => row.trim() !== '').map((row, index) => {
                        const [name, age, groupName, mustSitWith, likes, dislikes] = row.split(',').map(s => s.trim());
                        return { 
                            id: `parsed-${index}`, 
                            name: name || '', 
                            age: AGE_RANGES.includes(age) ? age : AGE_RANGES[0], 
                            groupName: groupName || '',
                            mustSitWithRaw: mustSitWith || '',
                            likesRaw: likes || '',
                            dislikesRaw: dislikes || '',
                            type: 'adult' 
                        };
                    });
                } else if (file.name.endsWith('.txt')) {
                    guestsData = content.split('\n').filter(name => name.trim() !== '').map((name, index) => ({
                        id: `parsed-${index}`, name: name.trim(), age: AGE_RANGES[0], groupName: '', mustSitWithRaw: '', likesRaw: '', dislikesRaw: '', type: 'adult'
                    }));
                } else {
                    throw new Error("Formato file non supportato. Usa .csv o .txt");
                }
                setParsedGuests(guestsData);
            } catch (err) {
                setError(err.message || "Errore durante la lettura del file.");
                setParsedGuests([]);
            }
        };
        reader.readAsText(file);
    };

    const updateGuest = (index, field, value) => {
        const newGuests = [...parsedGuests];
        newGuests[index][field] = value;
        setParsedGuests(newGuests);
    };
    
    const handleSave = () => {
        const guestsToImport = parsedGuests.filter(g => g.name);
        if(guestsToImport.length > 0) {
            onSave(guestsToImport);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-6xl m-4 max-h-[90vh] flex flex-col">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-[#333333] mb-6">Importazione Intelligente Invitati</h2>
                <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="w-full bg-[#4A5B53] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#3a4a42] mb-4">
                    Seleziona un file (.csv o .txt)
                </button>
                <p className="text-xs text-gray-500 text-center mb-4">Formato CSV: `Nome,Età,Gruppo,DeveSedersiCon,VuoleSedersiCon,NonVuoleSedersiCon`</p>
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {parsedGuests.length > 0 && (
                    <>
                        <h3 className="font-bold text-lg my-4">Controlla e conferma i dati importati</h3>
                        <div className="flex-grow overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Nome</th>
                                        <th scope="col" className="px-4 py-3">Fascia d'Età</th>
                                        <th scope="col" className="px-4 py-3">Gruppo Stretto</th>
                                        <th scope="col" className="px-4 py-3">Preferenze Rilevate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedGuests.map((guest, index) => (
                                        <tr key={guest.id} className="bg-white border-b">
                                            <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{guest.name}</td>
                                            <td className="px-4 py-4">
                                                <select value={guest.age} onChange={e => updateGuest(index, 'age', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                                                     {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input type="text" value={guest.groupName} onChange={e => updateGuest(index, 'groupName', e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" list="existing-groups"/>
                                                <datalist id="existing-groups">
                                                    {existingGroups.map(g => <option key={g.id} value={g.name} />)}
                                                </datalist>
                                            </td>
                                             <td className="px-4 py-4">
                                                <div className="flex flex-col space-y-1">
                                                    {guest.mustSitWithRaw && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">🔗 {guest.mustSitWithRaw}</span>}
                                                    {guest.likesRaw && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">👍 {guest.likesRaw}</span>}
                                                    {guest.dislikesRaw && <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">👎 {guest.dislikesRaw}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="text-gray-600 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving || parsedGuests.length === 0} className="bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48] disabled:bg-gray-400">
                        {isSaving ? 'Importazione...' : `Importa ${parsedGuests.length} Invitati`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddFamilyModal = ({ onClose, onSave, isSaving }) => {
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
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-[#333333] mb-6">Aggiungi Famiglia / Gruppo</h2>
                <div className="mb-6">
                    <label className="font-bold text-gray-700 mb-2 block">Nome Gruppo</label>
                    <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Es. Famiglia Rossi" required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                </div>

                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                {members.map((member, index) => (
                    <div key={member.id} className="p-4 border rounded-lg mb-4 bg-gray-50 relative">
                        <h3 className="font-bold text-gray-600 mb-4">Componente {index + 1}</h3>
                        {members.length > 1 && (
                            <button onClick={() => removeMember(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" value={member.name} onChange={(e) => updateMember(index, 'name', e.target.value)} placeholder="Nome" className="md:col-span-2 shadow appearance-none border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                            <select value={member.age} onChange={(e) => updateMember(index, 'age', e.target.value)} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]">
                                {AGE_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                            </select>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-600 mb-2">Categoria</h4>
                            <div className="flex space-x-2">
                                <button onClick={() => updateMember(index, 'type', 'adult')} className={`flex-1 py-2 px-4 rounded-lg text-sm ${member.type === 'adult' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Adulto</button>
                                <button onClick={() => updateMember(index, 'type', 'child')} className={`flex-1 py-2 px-4 rounded-lg text-sm ${member.type === 'child' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Bambino</button>
                            </div>
                        </div>
                    </div>
                ))}
                </div>

                <button onClick={addMember} className="mt-4 text-sm text-[#4A5B53] font-bold hover:underline self-start">+ Aggiungi componente</button>

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="text-gray-600 font-bold py-2 px-4">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48] disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva Gruppo'}</button>
                </div>
            </div>
        </div>
    );
};


const StrictGroupModal = ({ groups, onAdd, onDelete, onClose, isSaving }) => {
    const [newGroupName, setNewGroupName] = useState('');
    const handleAdd = (e) => { e.preventDefault(); if (newGroupName.trim()) { onAdd(newGroupName.trim()); setNewGroupName(''); } };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in"><div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg m-4"><h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-[#333333] mb-6">Gestisci Gruppi Stretti</h2><form onSubmit={handleAdd} className="flex items-center space-x-2 mb-6"><input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Es. Famiglia Sposa" className="flex-grow shadow appearance-none border rounded-lg py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" /><button type="submit" disabled={isSaving} className="bg-[#4A5B53] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#3a4a42] transition-colors disabled:bg-gray-400">{isSaving ? '...' : '+ Crea'}</button></form><div className="space-y-2 max-h-64 overflow-y-auto">{groups.length > 0 ? groups.map(group => (<div key={group.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg"><span className="text-gray-800">{group.name}</span><button onClick={() => onDelete(group.id)} className="text-red-500 hover:text-red-700 font-bold">Elimina</button></div>)) : <p className="text-gray-500 italic">Nessun gruppo creato.</p>}</div><div className="text-right mt-6"><button onClick={onClose} className="bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48]">Chiudi</button></div></div></div>
    );
}

const GuestDetailModal = ({ guest, allGuests, strictGroups, onSave, onClose, isSaving, isCreating, onManageGroups }) => {
    const [name, setName] = useState(guest?.name || '');
    const [type, setType] = useState(guest?.type || 'adult');
    const [age, setAge] = useState(guest?.age || AGE_RANGES[0]);
    const [likes, setLikes] = useState(guest?.likes || []);
    const [dislikes, setDislikes] = useState(guest?.dislikes || []);
    const [mustSitWith, setMustSitWith] = useState(guest?.mustSitWith || []);
    const [strictGroupId, setStrictGroupId] = useState(guest?.strictGroupId || '');
    
    const otherGuests = allGuests.filter(g => g.id !== guest?.id);
    
    const handleSave = () => { if (isCreating && !name.trim()) { return; } onSave(guest?.id, { name: name.trim(), type, age, likes, dislikes, mustSitWith, strictGroupId }); };
    
    const handleTogglePreference = (listType, targetGuestId) => {
        const updateList = (currentList, setList) => {
            setList(prev => prev.includes(targetGuestId) ? prev.filter(id => id !== targetGuestId) : [...prev, targetGuestId]);
        };

        if (listType === 'likes') {
            if (dislikes.includes(targetGuestId)) setDislikes(l => l.filter(id => id !== targetGuestId));
            if (mustSitWith.includes(targetGuestId)) setMustSitWith(l => l.filter(id => id !== targetGuestId));
            updateList(likes, setLikes);
        } else if (listType === 'dislikes') {
            if (likes.includes(targetGuestId)) setLikes(l => l.filter(id => id !== targetGuestId));
            if (mustSitWith.includes(targetGuestId)) setMustSitWith(l => l.filter(id => id !== targetGuestId));
            updateList(dislikes, setDislikes);
        } else if (listType === 'mustSitWith') {
            if (dislikes.includes(targetGuestId)) setDislikes(l => l.filter(id => id !== targetGuestId));
             if (likes.includes(targetGuestId)) setLikes(l => l.filter(id => id !== targetGuestId));
            updateList(mustSitWith, setMustSitWith);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
                 <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-[#333333] mb-6">{isCreating ? 'Nuovo Invitato' : `Dettagli per: ${guest.name}`}</h2>
                {isCreating && ( <div className="mb-4"><label className="font-bold text-gray-700 mb-2 block">Nome Invitato</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome e Cognome" required className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" /></div> )}
                <div className="grid grid-cols-2 gap-6 mb-4">
                    <div><h3 className="font-bold text-gray-700 mb-2">Categoria</h3><div className="flex space-x-2"><button onClick={() => setType('adult')} className={`w-full py-2 px-4 rounded-lg text-sm ${type === 'adult' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Adulto</button><button onClick={() => setType('child')} className={`w-full py-2 px-4 rounded-lg text-sm ${type === 'child' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Bambino</button></div></div>
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">Fascia d'Età</h3>
                        <select value={age} onChange={e => setAge(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]">
                            {AGE_RANGES.map(range => <option key={range} value={range}>{range}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="mb-4">
                    <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-gray-700">Gruppo Stretto</h3><button type="button" onClick={onManageGroups} className="text-sm text-[#4A5B53] hover:underline">[Gestisci]</button></div>
                    <select value={strictGroupId} onChange={e => setStrictGroupId(e.target.value)} className="shadow border rounded-lg w-full py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]"><option value="">Nessun gruppo</option>{strictGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
                </div>

                <div className="space-y-4">
                    <PreferenceSelector title="Deve sedersi con (Posti Vincolati)" icon="🔗" list={mustSitWith} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('mustSitWith', id)} color="blue" />
                    <PreferenceSelector title="Vuole sedersi con" icon="👍" list={likes} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('likes', id)} color="green" />
                    <PreferenceSelector title="NON vuole sedersi con" icon="👎" list={dislikes} otherGuests={otherGuests} onToggle={(id) => handleTogglePreference('dislikes', id)} color="red" />
                </div>

                <div className="flex justify-end space-x-4 mt-8"><button onClick={onClose} className="text-gray-600 font-bold py-2 px-4">Annulla</button><button onClick={handleSave} disabled={isSaving} className="bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48] disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva'}</button></div>
            </div>
        </div>
    );
};

const PreferenceSelector = ({ title, icon, list, otherGuests, onToggle, color }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-500', hover: 'bg-blue-600' },
        green: { bg: 'bg-green-500', hover: 'bg-green-600' },
        red: { bg: 'bg-red-500', hover: 'bg-red-600' },
    };
    return (
        <div>
            <h3 className="font-bold text-gray-700 mb-2 flex items-center">{icon} <span className="ml-2">{title}</span></h3>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-gray-50 rounded">
                {otherGuests.length > 0 ? otherGuests.map(g => (
                    <button key={g.id} onClick={() => onToggle(g.id)} className={`py-1 px-3 rounded-full text-sm transition-colors ${list.includes(g.id) ? `${colorClasses[color].bg} text-white` : 'bg-gray-200'}`}>
                        {g.name}
                    </button>
                )) : <p className="text-sm text-gray-500 italic">Aggiungi altri invitati.</p>}
            </div>
        </div>
    );
};


// --- COMPONENTI GESTIONE INVITATI ---

const GuestListItem = ({ guest, onDragStart, onEdit }) => (
    <li draggable="true" onDragStart={() => onDragStart(guest.id)} onClick={() => onEdit(guest)} className="text-gray-700 p-2 rounded flex justify-between items-center bg-gray-50 hover:bg-gray-200 cursor-pointer animate-fade-in">
        <span className="truncate">{guest.name}</span>
        <div className="flex items-center space-x-2">
            {guest.mustSitWith?.length > 0 && <span title="Posti Vincolati">🔗</span>}
            {guest.strictGroupId && <GroupIcon className="h-4 w-4 text-gray-400" />}
            {(guest.likes?.length > 0 || guest.dislikes?.length > 0) && <span className="text-yellow-500 text-lg">★</span>}
        </div>
    </li>
);

const GuestList = ({ guests, isLoading, onDragStart, onDragOver, onDrop, onEditGuest }) => (
    <div className="mt-4 w-full" onDragOver={onDragOver} onDrop={onDrop}>
        <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-[#333333] mb-4">Invitati non assegnati ({guests.length})</h3>
        {isLoading ? <p className="text-gray-500">Caricamento...</p> : guests.length > 0 ? ( <ul className="bg-white rounded-lg shadow p-4 space-y-2 min-h-[100px] flex-grow overflow-y-auto"> {guests.map(guest => <GuestListItem key={guest.id} guest={guest} onDragStart={onDragStart} onEdit={onEditGuest} />)} </ul> ) : <div className="text-gray-500 italic mt-4 p-4 border border-dashed rounded-lg text-center">Tutti gli invitati sono stati assegnati.</div>}
    </div>
);

// --- COMPONENTI GESTIONE TAVOLI ---

const AddTableForm = ({ onAddTable, isAdding }) => {
    const [tableName, setTableName] = useState('');
    const [tableCapacity, setTableCapacity] = useState(8);
    const [tableShape, setTableShape] = useState('round');

    const handleSubmit = (e) => { e.preventDefault(); if (tableName.trim() && tableCapacity > 0) { onAddTable(tableName.trim(), tableCapacity, tableShape); setTableName(''); setTableCapacity(8); } };
    
    return (
        <form onSubmit={handleSubmit} className="w-full p-4 bg-white rounded-lg shadow mb-6">
            <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-[#333333] mb-4">Nuovo Tavolo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="Nome Tavolo (es. Sposi)" required className="md:col-span-2 shadow appearance-none border rounded-lg py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                <button type="submit" disabled={isAdding} className="w-full bg-[#4A5B53] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#3a4a42] transition-colors disabled:bg-gray-400">{isAdding ? '...' : 'Aggiungi'}</button>
            </div>
            <div className="flex items-center space-x-4 mt-4">
                 <label className="text-sm font-bold text-gray-600">Capacità:</label>
                 <input type="number" min="1" value={tableCapacity} onChange={(e) => setTableCapacity(parseInt(e.target.value))} required className="shadow appearance-none border rounded-lg py-2 px-3 text-[#333333] w-20 leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                 <label className="text-sm font-bold text-gray-600">Forma:</label>
                 <select value={tableShape} onChange={(e) => setTableShape(e.target.value)} className="shadow border rounded-lg py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]">
                     <option value="round">Rotondo</option>
                     <option value="rectangular">Imperiale</option>
                 </select>
            </div>
        </form>
    );
};

const TableCard = ({ table, guests, onDragStart, onDragOver, onDrop, isDragOver, onEditGuest, onEditTable, onDeleteTable, onToggleLock }) => {
    const isFull = guests.length >= table.capacity;
    const baseClasses = "bg-white rounded-lg shadow p-4 animate-fade-in transition-all duration-200 relative";
    const stateClasses = isDragOver && !isFull && !table.locked ? "ring-2 ring-[#C09A50] scale-105" : isFull ? "bg-red-100" : "";
    const lockedClasses = table.locked ? "opacity-70 border-2 border-blue-300" : "";

    return (
        <div onDragOver={onDragOver} onDrop={onDrop} className={`${baseClasses} ${stateClasses} ${lockedClasses}`}>
            <div className="absolute top-2 right-2 flex items-center space-x-1">
                <button onClick={() => onToggleLock(table.id, !table.locked)} title={table.locked ? "Sblocca tavolo" : "Blocca tavolo"} className="p-1 text-gray-400 hover:text-blue-500">
                    {table.locked ? <LockIcon className="h-5 w-5 text-blue-500" /> : <UnlockIcon className="h-5 w-5" />}
                </button>
                <button onClick={() => onEditTable(table)} title="Modifica tavolo" className="p-1 text-gray-400 hover:text-green-500">
                    <EditIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDeleteTable(table)} title="Elimina tavolo" className="p-1 text-gray-400 hover:text-red-500">
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
            <h4 style={{fontFamily: 'Lora, serif'}} className="text-lg font-bold text-[#4A5B53] flex justify-between items-center pr-24">
                <span>{table.name}</span>
                <span className={`text-sm font-mono p-1 rounded ${isFull ? 'text-red-700 bg-red-200' : 'text-gray-600 bg-gray-100'}`}>{guests.length}/{table.capacity}</span>
            </h4>
            <ul className="mt-2 space-y-1 text-sm min-h-[2rem]">{guests.map(guest => <GuestListItem key={guest.id} guest={guest} onDragStart={onDragStart} onEdit={onEditGuest} />)}</ul>
        </div>
    );
};

const TableList = ({ tables, guests, onDragStart, onDragOver, onDrop, dragOverId, onEditGuest, onEditTable, onDeleteTable, onToggleLock }) => (
    <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.length > 0 ? tables.map(table => { 
                const assignedGuests = guests.filter(g => g.tableId === table.id); 
                return <TableCard key={table.id} table={table} guests={assignedGuests} onDragStart={onDragStart} onDragOver={(e) => onDragOver(e, table.id)} onDrop={() => onDrop(table.id)} isDragOver={dragOverId === table.id} onEditGuest={onEditGuest} onEditTable={onEditTable} onDeleteTable={onDeleteTable} onToggleLock={onToggleLock} />;
            }) : <p className="text-gray-500 italic mt-4 col-span-full text-center">Nessun tavolo creato.</p>}
        </div>
    </div>
);

const MapView = ({ tables, guests }) => (
    <div className="w-full p-4 bg-white rounded-lg shadow-inner">
        <div className="flex flex-wrap justify-center items-start gap-8">
             {tables.length > 0 ? tables.map(table => {
                const assignedGuests = guests.filter(g => g.tableId === table.id);
                const isRound = table.shape === 'round';
                const tableClasses = `flex flex-col justify-center items-center p-4 border-2 border-[#4A5B53] ${isRound ? 'rounded-full w-48 h-48' : 'rounded-lg w-64 min-h-[12rem]'}`;
                return (
                    <div key={table.id} className={tableClasses}>
                        <h4 className="font-bold text-[#4A5B53]">{table.name}</h4>
                        <span className="text-xs text-gray-500 mb-2">({assignedGuests.length}/{table.capacity})</span>
                        <ul className="text-center text-sm">
                            {assignedGuests.map(g => <li key={g.id}>{g.name}</li>)}
                        </ul>
                    </div>
                );
             }) : <p className="text-gray-500 italic mt-4 col-span-full text-center">Crea dei tavoli per visualizzare la mappa.</p>}
        </div>
    </div>
);

// --- VISTE PRINCIPALI ---

const FaqView = () => {
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
            <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl md:text-5xl font-bold text-[#333333] mb-8">Aiuto & FAQ</h1>
            
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 style={{ fontFamily: 'Lora, serif' }} className="text-2xl font-bold text-[#4A5B53] mb-6">Importazione Intelligente degli Invitati</h2>

                <div className="space-y-6 text-gray-700">
                    <div>
                        <h3 className="font-bold text-lg mb-2">A cosa serve la funzione di importazione?</h3>
                        <p>Permette di caricare in un solo colpo un'intera lista di invitati da un file esterno (.csv o .txt), risparmiando ore di lavoro manuale. L'app non solo importa i nomi, ma è in grado di capire anche le relazioni tra le persone, come i gruppi familiari e le preferenze di posto.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2">Quale formato di file devo usare?</h3>
                        <p>Puoi usare un file di testo semplice (`.txt`), con un nome per riga, oppure un file `.csv` (Comma Separated Values), che è il formato standard per i fogli di calcolo. Per sfruttare al massimo la potenza dell'app, **consigliamo il formato .csv**.</p>
                        <button onClick={downloadTemplate} className="mt-4 bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48]">
                            Scarica Template CSV
                        </button>
                    </div>

                     <div>
                        <h3 className="font-bold text-lg mb-2">Come deve essere strutturato il file .csv?</h3>
                        <p>Il file deve avere delle colonne in un ordine preciso. Non preoccuparti dei nomi delle colonne (intestazioni), l'app guarda solo l'ordine:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1 bg-gray-50 p-4 rounded-lg">
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
                        <p>Usa un **punto e virgola (`;`)** per separare i nomi all'interno della stessa cella. <br/> Esempio: `Anna Verdi;Luca Verdi`</p>
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

const EventCard = ({ event, onSelect, onDelete }) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const formattedDate = eventDate ? eventDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data non specificata';
    return (
        <div className="bg-white rounded-lg shadow-md p-5 text-left w-full flex justify-between items-center transition-transform duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
            <div>
                <h3 style={{ fontFamily: 'Lora, serif' }} className="text-xl font-bold text-[#333333]">{event.name}</h3>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-gray-500">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={() => onSelect(event)} style={{ fontFamily: 'Inter, sans-serif' }} className="bg-[#4A5B53] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#3a4a42] transition-colors">Gestisci</button>
                <button onClick={() => onDelete(event)} title="Elimina Evento" className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors">
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const Dashboard = ({ events, isEventsLoading, onSelectEvent, onNavigate, onDeleteEvent }) => (
    <div className="w-full max-w-4xl mx-auto p-8 text-center animate-fade-in">
        <h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl md:text-5xl font-bold text-[#333333] mb-4">Dashboard Eventi</h1>
        <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-[#4A5B53] mb-8">{events.length > 0 ? "Seleziona un evento dalla barra laterale o creane uno nuovo." : "Crea il tuo primo evento per iniziare."}</p>
        <div className="mb-10 w-full">
            {isEventsLoading ? <p className="text-[#4A5B53]">Caricamento eventi...</p> : events.length > 0 ? ( 
                <div className="space-y-4">{events.map(event => <EventCard key={event.id} event={event} onSelect={onSelectEvent} onDelete={onDeleteEvent} />)}</div> 
            ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <p className="text-gray-500 mb-4">Nessun evento ancora creato.</p>
                     <button onClick={() => onNavigate('createEvent')} style={{ fontFamily: 'Inter, sans-serif' }} className="bg-[#C09A50] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-[#b58e48] transition-colors">+ Crea il Tuo Primo Evento</button>
                </div>
            )}
        </div>
    </div>
);


const CreateEventForm = ({ onSave, onCancel, isSaving }) => {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); if (eventName.trim() && eventDate) { onSave({ name: eventName, date: eventDate }); } };
    return ( <div className="w-full max-w-lg mx-auto p-8 text-center animate-fade-in"><h1 style={{ fontFamily: 'Lora, serif' }} className="text-4xl font-bold text-[#333333] mb-8">Crea un nuovo evento</h1><form onSubmit={handleSubmit}><FormInput label="Nome Evento" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Es. Matrimonio di Anna e Marco" required /><FormInput label="Data Evento" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required /><div className="flex items-center justify-end mt-4"><button type="button" onClick={onCancel} style={{ fontFamily: 'Inter, sans-serif' }} className="text-[#4A5B53] font-bold py-2 px-6 rounded-lg mr-4 hover:bg-gray-200">Annulla</button><button type="submit" disabled={isSaving} style={{ fontFamily: 'Inter, sans-serif' }} className="bg-[#C09A50] text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b58e48] disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva Evento'}</button></div></form></div> );
};

const EventView = ({ event, db, user, onDeleteEvent }) => {
    const [guests, setGuests] = useState([]);
    const [isLoadingGuests, setIsLoadingGuests] = useState(true);
    const [tables, setTables] = useState([]);
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [isAddingTable, setIsAddingTable] = useState(false);
    const [strictGroups, setStrictGroups] = useState([]);
    
    const [editingGuest, setEditingGuest] = useState(null);
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);
    const [isSavingGuestDetails, setIsSavingGuestDetails] = useState(false);
    const [draggedGuestId, setDraggedGuestId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [isManagingGroups, setIsManagingGroups] = useState(false);
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const [isAddingFamily, setIsAddingFamily] = useState(false);
    const [isSavingFamily, setIsSavingFamily] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isSavingImport, setIsSavingImport] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [isArranging, setIsArranging] = useState(false);
    const addMenuRef = useRef(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    const [useKidsTable, setUseKidsTable] = useState(event.useKidsTable || false);
    
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

    useEffect(() => {
        if (!db || !user || !event) return;
        const guestsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`;
        const tablesPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
        const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        const unsubGuests = onSnapshot(query(collection(db, guestsPath)), snap => { setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingGuests(false); }, err => { console.error(err); setIsLoadingGuests(false); });
        const unsubTables = onSnapshot(query(collection(db, tablesPath)), snap => { setTables(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setIsLoadingTables(false); }, err => { console.error(err); setIsLoadingTables(false); });
        const unsubGroups = onSnapshot(query(collection(db, groupsPath)), snap => { setStrictGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }, err => console.error(err));
        return () => { unsubGuests(); unsubTables(); unsubGroups(); };
    }, [db, user, event]);

    const handleSaveGuest = async (guestId, data) => {
        setIsSavingGuestDetails(true);
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`;
        try { 
            const batch = writeBatch(db);
            let currentGuestId = guestId;

            if (guestId) { 
                const guestRef = doc(db, path, guestId);
                batch.update(guestRef, data);
            } else { 
                const guestRef = doc(collection(db, path));
                batch.set(guestRef, { ...data, createdAt: serverTimestamp(), tableId: null });
            } 
            
            await batch.commit();
            setEditingGuest(null); 
            setIsCreatingGuest(false); 
        } catch (e) { 
            console.error("Error saving guest:", e); 
        } finally { 
            setIsSavingGuestDetails(false); 
        }
    };
    
    const handleAddTable = async (tableName, tableCapacity, tableShape) => {
        if (!db || !user || !event) return; setIsAddingTable(true);
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/tables`;
        try { await addDoc(collection(db, path), { name: tableName, capacity: tableCapacity, shape: tableShape, createdAt: serverTimestamp() }); } catch (e) { console.error("Error adding table:", e); } finally { setIsAddingTable(false); }
    };
    
    const handleToggleKidsTable = async (e) => {
        const newValue = e.target.checked; setUseKidsTable(newValue);
        const eventRef = doc(db, `artifacts/${appId}/users/${user.uid}/events`, event.id);
        try { await updateDoc(eventRef, { useKidsTable: newValue }); } catch (err) { console.error("Error updating event option", err); setUseKidsTable(!newValue); }
    };
    
    const handleAddGroup = async (name) => {
        setIsSavingGroup(true);
        const path = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        try { await addDoc(collection(db, path), { name }); } catch (e) { console.error("Error adding group", e); } finally { setIsSavingGroup(false); }
    };

    const handleDeleteGroup = async (groupId) => {
        const batch = writeBatch(db);
        const groupRef = doc(db, `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`, groupId);
        batch.delete(groupRef);
        const guestsToUpdateQuery = query(collection(db, `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`), where("strictGroupId", "==", groupId));
        const guestsSnapshot = await getDocs(guestsToUpdateQuery);
        guestsSnapshot.forEach(guestDoc => { batch.update(guestDoc.ref, { strictGroupId: "" }); });
        try { await batch.commit(); } catch(e) { console.error("Error deleting group", e); }
    };

    const handleSaveFamily = async (groupName, members) => {
        setIsSavingFamily(true);
        const batch = writeBatch(db);
        const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        const guestsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`;
        const groupRef = doc(collection(db, groupsPath));
        batch.set(groupRef, { name: groupName });
        members.forEach(member => {
            const guestRef = doc(collection(db, guestsPath));
            const guestData = { name: member.name, type: member.type, age: member.age, strictGroupId: groupRef.id, tableId: null, likes: [], dislikes: [], mustSitWith: [], createdAt: serverTimestamp(), };
            batch.set(guestRef, guestData);
        });
        try { await batch.commit(); setIsAddingFamily(false); } catch (e) { console.error("Error saving family:", e); } finally { setIsSavingFamily(false); }
    }
    
    const handleSaveImportedGuests = async (importedGuests) => {
        setIsSavingImport(true);
        const batch = writeBatch(db);
        const groupsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/strictGroups`;
        const guestsPath = `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`;
        
        const groupMap = new Map(strictGroups.map(g => [g.name.toLowerCase(), g.id]));
        const newGroupsToCreate = new Map();

        importedGuests.forEach(guest => {
            if (guest.groupName && !groupMap.has(guest.groupName.toLowerCase())) {
                 if(!newGroupsToCreate.has(guest.groupName.toLowerCase())) {
                    const newGroupRef = doc(collection(db, groupsPath));
                    newGroupsToCreate.set(guest.groupName.toLowerCase(), {ref: newGroupRef, name: guest.groupName});
                }
            }
        });
        
        newGroupsToCreate.forEach(({ref, name}) => {
            batch.set(ref, { name });
            groupMap.set(name.toLowerCase(), ref.id);
        });
        
        const guestNameToRef = new Map();
        importedGuests.forEach(guest => {
             const guestRef = doc(collection(db, guestsPath));
             guestNameToRef.set(guest.name.toLowerCase(), guestRef);
        });

        importedGuests.forEach(guest => {
            const guestRef = guestNameToRef.get(guest.name.toLowerCase());
            const groupId = guest.groupName ? (groupMap.get(guest.groupName.toLowerCase()) || newGroupsToCreate.get(guest.groupName.toLowerCase())?.ref.id) : '';
            
            const resolvePreference = (rawString) => {
                if(!rawString) return [];
                return rawString.split(';')
                                .map(name => name.trim().toLowerCase())
                                .map(name => guestNameToRef.get(name)?.id)
                                .filter(Boolean);
            }
            
            batch.set(guestRef, {
                name: guest.name,
                age: guest.age,
                type: (YOUNG_CHILD_RANGES.includes(guest.age) || guest.age === '13-17 anni') ? 'child' : 'adult',
                strictGroupId: groupId || '',
                mustSitWith: resolvePreference(guest.mustSitWithRaw),
                likes: resolvePreference(guest.likesRaw),
                dislikes: resolvePreference(guest.dislikesRaw),
                tableId: null, 
                createdAt: serverTimestamp(),
            });
        });

        try {
            await batch.commit();
            setIsImporting(false);
        } catch (e) {
            console.error("Error importing guests:", e);
        } finally {
            setIsSavingImport(false);
        }
    };

    const handleDragStart = (guestId) => setDraggedGuestId(guestId);
    const handleDragOver = (e, tableId = null) => { e.preventDefault(); setDragOverId(tableId); };
    const handleDragLeave = () => setDragOverId(null);

    const handleDrop = async (tableId) => {
        if (!draggedGuestId) return;
        const guestsOnTable = guests.filter(g => g.tableId === tableId).length;
        const tableCapacity = tables.find(t => t.id === tableId)?.capacity;
        if (tableId && tableCapacity && guestsOnTable >= tableCapacity) { setDragOverId(null); setDraggedGuestId(null); return; }
        const guestRef = doc(db, `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`, draggedGuestId);
        try { await updateDoc(guestRef, { tableId }); } catch (e) { console.error("Error updating guest:", e); }
        setDragOverId(null); setDraggedGuestId(null);
    };

     const handleAutoArrange = async () => {
        setIsArranging(true);

        let processingGuests = JSON.parse(JSON.stringify(guests));
        let assignments = {};
        let tempTables = JSON.parse(JSON.stringify(tables)).map(t => ({ ...t, seated: [] }));
        const guestMap = processingGuests.reduce((acc, guest) => ({ ...acc, [guest.id]: guest }), {});

        const findTableForGroup = (group, tables) => {
            return tables.find(t => t.capacity - t.seated.length >= group.length);
        };
        
        const getConnectedGroups = (guestList, key) => {
            const adj = {};
            guestList.forEach(g => adj[g.id] = []);
            guestList.forEach(g => {
                (g[key] || []).forEach(neighborId => {
                    if (adj[neighborId]) {
                        adj[g.id].push(neighborId);
                        adj[neighborId].push(g.id);
                    }
                });
            });

            const visited = new Set();
            const connectedGroups = [];
            for (const guest of guestList) {
                if (!visited.has(guest.id)) {
                    const component = [];
                    const stack = [guest.id];
                    visited.add(guest.id);
                    while (stack.length > 0) {
                        const u = stack.pop();
                        component.push(u);
                        (adj[u] || []).forEach(v => {
                            if (!visited.has(v)) {
                                visited.add(v);
                                stack.push(v);
                            }
                        });
                    }
                    connectedGroups.push(component);
                }
            }
            return connectedGroups;
        };

        let mustSitGroups = getConnectedGroups(processingGuests, 'mustSitWith');
        
        const strictGroupMap = {};
        processingGuests.forEach(g => {
            if (g.strictGroupId) {
                if (!strictGroupMap[g.strictGroupId]) strictGroupMap[g.strictGroupId] = [];
                strictGroupMap[g.strictGroupId].push(g.id);
            }
        });
        
        let finalGroups = [];
        const processedGuests = new Set();

        mustSitGroups.forEach(msGroup => {
            let combinedGroup = new Set(msGroup);
            msGroup.forEach(guestId => {
                const guest = guestMap[guestId];
                if (guest.strictGroupId && strictGroupMap[guest.strictGroupId]) {
                    strictGroupMap[guest.strictGroupId].forEach(id => combinedGroup.add(id));
                }
            });
            finalGroups.push(Array.from(combinedGroup));
            combinedGroup.forEach(id => processedGuests.add(id));
        });

        Object.values(strictGroupMap).forEach(sGroup => {
            if (!sGroup.some(id => processedGuests.has(id))) {
                finalGroups.push(sGroup);
                sGroup.forEach(id => processedGuests.add(id));
            }
        });

        processingGuests.forEach(guest => {
            if (!processedGuests.has(guest.id)) {
                finalGroups.push([guest.id]);
            }
        });

        finalGroups.sort((a, b) => b.length - a.length);

        const groupsWithYoungChildren = finalGroups.filter(group => group.some(id => YOUNG_CHILD_RANGES.includes(guestMap[id].age)));
        const otherGroups = finalGroups.filter(group => !group.some(id => YOUNG_CHILD_RANGES.includes(guestMap[id].age)));
        
        groupsWithYoungChildren.forEach(group => {
            const table = findTableForGroup(group, tempTables);
            if (table) {
                group.forEach(id => { assignments[id] = table.id; });
                table.seated.push(...group);
            } else { console.warn(`Nessun tavolo per gruppo con bambino: ${group}`); }
        });

        otherGroups.forEach(group => {
            let bestTable = null;
            let maxScore = -Infinity;

            for (const table of tempTables) {
                if (table.capacity - table.seated.length >= group.length) {
                    let score = 0;
                    let conflict = false;
                    for (const groupMemberId of group) {
                        for (const seatedId of table.seated) {
                            if (guestMap[groupMemberId].dislikes?.includes(seatedId) || guestMap[seatedId].dislikes?.includes(groupMemberId)) {
                                conflict = true; break;
                            }
                            if (guestMap[groupMemberId].likes?.includes(seatedId)) score++;
                            if (guestMap[seatedId].likes?.includes(groupMemberId)) score++;
                        }
                        if(conflict) break;
                    }
                    if (!conflict && score > maxScore) {
                        maxScore = score;
                        bestTable = table;
                    }
                }
            }
            const tableToAssign = bestTable || findTableForGroup(group, tempTables);
            if (tableToAssign) {
                group.forEach(id => { assignments[id] = tableToAssign.id; });
                tableToAssign.seated.push(...group);
            } else { console.warn(`Nessun tavolo per gruppo: ${group}`); }
        });

        const batch = writeBatch(db);
        guests.forEach(guest => {
            const newTableId = assignments[guest.id] || null;
            if (guest.tableId !== newTableId) {
                const guestRef = doc(db, `artifacts/${appId}/users/${user.uid}/events/${event.id}/guests`, guest.id);
                batch.update(guestRef, { tableId: newTableId });
            }
        });
        
        try { await batch.commit(); } catch (e) { console.error("Errore durante l'assegnazione automatica", e); }
        setIsArranging(false);
    };


    const unassignedGuests = guests.filter(g => !g.tableId);

    if (!event) return null;

    return (
        <>
            {(editingGuest || isCreatingGuest) && <GuestDetailModal guest={editingGuest} allGuests={guests} strictGroups={strictGroups} onClose={() => { setEditingGuest(null); setIsCreatingGuest(false); }} onSave={handleSaveGuest} isSaving={isSavingGuestDetails} isCreating={isCreatingGuest} onManageGroups={() => setIsManagingGroups(true)}/>}
            {isManagingGroups && <StrictGroupModal groups={strictGroups} onAdd={handleAddGroup} onDelete={handleDeleteGroup} onClose={() => setIsManagingGroups(false)} isSaving={isSavingGroup} />}
            {isAddingFamily && <AddFamilyModal onClose={() => setIsAddingFamily(false)} onSave={handleSaveFamily} isSaving={isSavingFamily}/>}
            {isImporting && <ImportGuestsModal existingGroups={strictGroups} onSave={handleSaveImportedGuests} onClose={() => setIsImporting(false)} isSaving={isSavingImport} />}

            <div className="w-full h-full p-4 md:p-8 text-left animate-fade-in" onDragLeave={handleDragLeave}>
                <div className="flex justify-between items-start mb-8">
                    <h1 style={{ fontFamily: 'Lora, serif' }} className="text-3xl md:text-4xl font-bold text-[#333333]">{event.name}</h1>
                    <button onClick={() => onDeleteEvent(event)} className="flex items-center bg-red-500 text-white text-sm font-bold py-2 px-3 rounded-lg shadow hover:bg-red-600 transition-colors">
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Elimina Evento
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                    <div className="lg:col-span-1 bg-[#FDFBF7] p-4 md:p-6 rounded-lg shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-[#333333]">Invitati</h3>
                             <div className="relative" ref={addMenuRef}>
                                <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-[#C09A50] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#b58e48] transition-colors flex items-center">
                                    + Aggiungi
                                    <svg className={`w-4 h-4 ml-2 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {showAddMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30 animate-fade-in">
                                        <button onClick={() => { setIsCreatingGuest(true); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Invitato Singolo</button>
                                        <button onClick={() => { setIsAddingFamily(true); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Famiglia / Gruppo</button>
                                        <button onClick={() => { setIsImporting(true); setShowAddMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Importa da File</button>
                                    </div>
                                )}
                             </div>
                        </div>
                        <div className="flex-grow">
                             <GuestList guests={unassignedGuests} isLoading={isLoadingGuests} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={() => handleDrop(null)} onEditGuest={(guest) => setEditingGuest(guest)} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-[#FDFBF7] p-4 md:p-6 rounded-lg shadow-sm">
                        <div className="bg-white rounded-lg shadow p-4 mb-6">
                            <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-[#333333] mb-4">Opzioni Avanzate</h3>
                             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center space-x-3 text-gray-600">
                                    <input type="checkbox" id="kids-table-toggle" checked={useKidsTable} onChange={handleToggleKidsTable} className="h-4 w-4 text-[#4A5B53] focus:ring-[#C09A50] border-gray-300 rounded" />
                                    <label htmlFor="kids-table-toggle" className="text-sm">Usa un tavolo dedicato per i bambini</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Vista:</span>
                                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'list' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Elenco</button>
                                    <button onClick={() => setViewMode('map')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'map' ? 'bg-[#4A5B53] text-white' : 'bg-gray-200'}`}>Mappa</button>
                                </div>
                                <button onClick={handleAutoArrange} disabled={isArranging || tables.length === 0} className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {isArranging ? 'Elaborazione...' : 'Disponi Automaticamente'}
                                </button>
                            </div>
                        </div>
                         <AddTableForm onAddTable={handleAddTable} isAdding={isAddingTable} />
                         <h3 style={{fontFamily: 'Lora, serif'}} className="text-xl font-bold text-[#333333] my-4">Tavoli Creati ({tables.length})</h3>
                         {isLoadingTables ? <p className="text-gray-500">Caricamento tavoli...</p> : viewMode === 'list' ? (
                            <TableList tables={tables} guests={guests} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} dragOverId={dragOverId} onEditGuest={(guest) => setEditingGuest(guest)} />
                         ) : (
                            <MapView tables={tables} guests={guests} />
                         )}
                    </div>
                </div>
            </div>
        </>
    );
};

const Sidebar = ({ user, auth, isCollapsed, events, isLoading, onSelectEvent, onNavigate, selectedEventId }) => (
    <aside className={`bg-white min-h-screen p-4 flex flex-col shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center mb-8">
             <SeatZenLogo className="h-10 w-10 flex-shrink-0" />
            <h2 className={`text-xl text-[#333333] ml-2 flex items-baseline whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                <span style={{ fontFamily: 'Lora, serif' }} className="font-bold">Seat</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }} className="tracking-wider">ZEN</span>
            </h2>
        </div>
        <nav className="flex-grow">
             <button onClick={() => onNavigate('dashboard')} title="Dashboard" className="w-full flex items-center font-bold text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 mb-2">
                 <HomeIcon className="h-6 w-6 flex-shrink-0" />
                 <span className={`ml-3 whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden' : 'inline'}`}>Dashboard</span>
             </button>
             <button onClick={() => onNavigate('faq')} title="Aiuto & FAQ" className="w-full flex items-center font-bold text-gray-700 px-3 py-2 rounded-md hover:bg-gray-100 mb-4">
                 <HelpIcon className="h-6 w-6 flex-shrink-0" />
                 <span className={`ml-3 whitespace-nowrap overflow-hidden ${isCollapsed ? 'hidden' : 'inline'}`}>Aiuto & FAQ</span>
             </button>
             <h3 className={`px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : 'text-left'}`}>
                <span className={isCollapsed ? 'hidden' : 'inline'}>Eventi</span>
                <span className={isCollapsed ? 'inline text-lg' : 'hidden'}>·</span>
             </h3>
             {isLoading ? <p className="text-xs text-gray-400 px-3">...</p> : (
                <ul className="space-y-1">
                    {events.map(event => (
                        <li key={event.id}>
                            <button onClick={() => onSelectEvent(event)} title={event.name} className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors truncate ${selectedEventId === event.id ? 'bg-[#4A5B53] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <span className={`${isCollapsed ? 'hidden' : 'inline'}`}>{event.name}</span>
                                {isCollapsed && <span className="w-full text-center font-bold">{event.name.charAt(0)}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
             )}
        </nav>
        <div className="mt-4 pt-4 border-t border-gray-200">
            {user && (
                 <div className="flex items-center">
                    {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full" /> : <UserAvatarIcon className="h-10 w-10 text-gray-400" />}
                    <div className={`ml-3 overflow-hidden transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName || user.email}</p>
                        <button onClick={() => signOut(auth)} className="text-xs text-red-500 hover:underline">Logout</button>
                    </div>
                 </div>
            )}
        </div>
    </aside>
);

const LoginPage = ({ onLogin, onEmailLogin, onEmailRegister }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if(isRegister) {
            onEmailRegister(email, password, setError);
        } else {
            onEmailLogin(email, password, setError);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#F5F0E6] p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center mb-8">
                    <SeatZenLogo className="h-16 w-16" />
                    <h1 className="text-5xl text-[#333333] ml-4 flex items-baseline">
                        <span style={{ fontFamily: 'Lora, serif' }} className="font-bold">Seat</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 300 }} className="tracking-wider">ZEN</span>
                    </h1>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif' }} className="text-lg text-[#4A5B53] mb-8 text-center">Posti perfetti, stress zero.</p>
                
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full mb-4 shadow-inner appearance-none border rounded-lg py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full mb-4 shadow-inner appearance-none border rounded-lg py-2 px-3 text-[#333333] leading-tight focus:outline-none focus:ring-2 focus:ring-[#C09A50]" />
                        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                        <button type="submit" className="w-full bg-[#4A5B53] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#3a4a42] transition-colors">
                            {isRegister ? 'Registrati' : 'Accedi'}
                        </button>
                    </form>

                    <div className="my-4 flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">oppure</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div className="space-y-2">
                         <button onClick={() => onLogin('google')} className="w-full flex items-center justify-center bg-white py-2 px-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
                            <GoogleIcon className="h-5 w-5 mr-3" />
                            <span className="font-semibold text-gray-700 text-sm">Continua con Google</span>
                        </button>
                    </div>
                </div>
                <p className="text-center text-sm text-gray-600 mt-6">
                    {isRegister ? 'Hai già un account?' : 'Non hai un account?'}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="font-bold text-[#4A5B53] hover:underline ml-1">
                        {isRegister ? 'Accedi' : 'Registrati'}
                    </button>
                </p>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPALE APP ---
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

            // --- FIX ---
            // Se l'evento attualmente selezionato non esiste più nella lista
            // (perché è stato eliminato), torna alla dashboard.
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
            
            const collectionsToDelete = ['guests', 'tables', 'strictGroups'];
            for (const coll of collectionsToDelete) {
                const collRef = collection(eventRef, coll);
                const snapshot = await getDocs(query(collRef));
                snapshot.forEach(doc => batch.delete(doc.ref));
            }

            batch.delete(eventRef);
            
            await batch.commit();
            
            setDeletingEvent(null);
        } catch(e) {
            console.error("Errore durante l'eliminazione dell'evento:", e);
            setDeletingEvent(null);
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
         return <div className="flex justify-center items-center w-full h-screen bg-[#F5F0E6]"><p className="text-[#4A5B53]">Caricamento applicazione...</p></div>;
    }

    if (!user) {
        return <LoginPage onLogin={handleLogin} onEmailLogin={handleEmailLogin} onEmailRegister={handleEmailRegister} />;
    }

    return (
        <div className="flex h-screen bg-[#F5F0E6]">
             {deletingEvent && <DeleteConfirmationModal title="Conferma Eliminazione Evento" message={`Sei sicuro di voler eliminare permanentemente l'evento <strong class="font-bold">${deletingEvent.name}</strong>?<br/><span class="font-bold text-red-500">Tutti gli invitati e i tavoli associati verranno cancellati. Questa azione è irreversibile.</span>`} onConfirm={handleDeleteEvent} onCancel={() => setDeletingEvent(null)} isDeleting={isDeleting} />}
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
            <div className="flex flex-col flex-grow">
                <main className="flex-grow overflow-y-auto">
                    {renderContent()}
                </main>
                <footer className="w-full text-center p-4 text-xs text-gray-500 flex items-center justify-center bg-[#FDFBF7] border-t border-gray-200">
                    Made with <span className="text-red-500 mx-1">❤️</span> by 
                    <a href="https://www.iluminari3d.com" target="_blank" rel="noopener noreferrer" className="ml-1">
                        <IluminariLogo className="h-4 fill-current text-gray-800" />
                    </a>
                </footer>
            </div>
        </div>
    );
}

export default App;
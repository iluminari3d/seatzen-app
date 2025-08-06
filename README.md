# SeatZen 💍

> Posti perfetti, stress zero.

SeatZen è un'applicazione web moderna e intuitiva progettata per semplificare drasticamente la gestione dei posti a sedere per eventi, come matrimoni e grandi cerimonie. Attraverso un'interfaccia pulita e reattiva, l'app trasforma un compito complesso e stressante in un processo semplice e controllato.

---

## ✨ Caratteristiche Principali

SeatZen è ricco di funzionalità pensate per dare il massimo controllo agli organizzatori di eventi:

* **🗂️ Gestione Multi-Evento**: Crea e gestisci più eventi contemporaneamente dal tuo account personale.
* ** sala separata**: Organizza gli invitati e lo staff (fotografi, musicisti, etc.) in due sale distinte, ognuna con la propria disposizione dei tavoli.
* **✍️ Aggiunta Intelligente**: Inserisci persone singolarmente o aggiungi intere famiglie/gruppi in un solo colchpo, definendo da subito i legami.
* **📊 Importazione da File**: Carica centinaia di invitati in pochi secondi da file `.csv` o `.txt`. L'app è in grado di riconoscere automaticamente nomi, fasce d'età e gruppi.
* **🪄 Auto-Disposizione Avanzata**: Un potente algoritmo che crea una disposizione dei tavoli ottimale in un click, con opzioni per:
    * Creare un tavolo d'onore per gli **Sposi**.
    * Raggruppare automaticamente tutti i **bambini** in un tavolo dedicato.
    * Definire **Tavoli Speciali** con capacità personalizzate per gruppi specifici (es. Testimoni, Parenti).
* **✏️ Gestione Completa dei Tavoli**: Crea tavoli, definisci il nome, la capacità e la forma (rotondi o imperiali).
* **🗺️ Visualizzazione Mappa**: Ottieni una visione d'insieme della sala con una mappa grafica e interattiva dei tavoli e dei loro occupanti.
* **🤝 Preferenze degli Invitati**: Assegna preferenze e vincoli a ogni invitato (chi deve sedersi vicino a chi, e chi *non* deve).
* **📄 Esportazione PDF**: Genera e scarica PDF professionali con la lista completa degli invitati o con la disposizione dettagliata dei tavoli.
* **🎨 Tema Chiaro/Scuro**: Scegli il tema che preferisci o imposta quello di sistema per un comfort visivo ottimale.
* **🔐 Autenticazione Sicura**: Accesso protetto tramite email/password o account Google, basato su Firebase Authentication.

---

## 💻 Stack Tecnologico

* **Frontend**: [React.js](https://reactjs.org/)
* **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Generazione PDF**: [jsPDF](https://github.com/parallax/jsPDF) con [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)

---

## 🚀 Installazione e Avvio

Per eseguire il progetto in locale, segui questi passaggi:

1.  **Clona il repository**
    ```bash
    git clone <URL_DEL_TUO_REPOSITORY>
    cd nome-cartella-progetto
    ```

2.  **Installa le dipendenze**
    ```bash
    npm install
    ```

3.  **Configura le variabili d'ambiente di Firebase** (vedi sezione successiva)

4.  **Avvia l'applicazione**
    ```bash
    npm start
    ```
    L'applicazione sarà visibile su `http://localhost:3000`.

---

## 🔧 Configurazione Firebase

Per connettere l'applicazione al tuo backend Firebase, è necessario creare un file di configurazione.

1.  Nella cartella principale del progetto, crea un file chiamato `.env`.
2.  All'interno di questo file, aggiungi la seguente variabile d'ambiente, incollando l'oggetto di configurazione del tuo progetto Firebase:

    ```env
    REACT_APP_FIREBASE_CONFIG={"apiKey":"AIza...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
    ```

    Puoi trovare questo oggetto di configurazione nella console del tuo progetto Firebase, andando su **Impostazioni progetto > Generali > Le tue app > Configurazione SDK**.

---

## 📄 Formato d'Importazione CSV

Per sfruttare al massimo l'importazione intelligente, si consiglia di utilizzare un file `.csv` strutturato con le seguenti colonne, in questo esatto ordine:
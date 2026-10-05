# 🍽️ Sapore & Note - Social Ricettario Digitale

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend%20Cloud-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)

**Sapore & Note** è una web app culinaria full-stack elegante, intuitiva e reattiva, pensata per creare, collezionare e consultare ricette gastronomiche. Offre una suddivisione chiara tra l'esplorazione pubblica della community e la gestione del proprio ricettario personale, con integrazione cloud su **Supabase**, autenticazione **Google OAuth** e calcolo nutrizionale automatico.

---

## 📑 Indice

1. [Caratteristiche Principali](#-caratteristiche-principali)
2. [Tecnologie Utilizzate](#-tecnologie-utilizzate)
3. [Guida all'Installazione Locale](#-guida-allinstallazione-locale)
4. [Configurazione Backend con Supabase](#-configurazione-backend-con-supabase)
5. [Guida: Autenticazione Google OAuth con Supabase](#-guida-autenticazione-google-oauth-con-supabase)
6. [Architettura del Progetto](#-architettura-del-progetto)
7. [Script Disponibili](#-script-disponibili)

---

## ✨ Caratteristiche Principali

### 🌐 1. Esplora Community & Creator Gastronomici (Home)
- **Feed Globale**: Consulta le ricette pubblicate dalla community suddivise per portate (*Antipasti*, *Primi*, *Secondi*, *Dolci*).
- **Ricerca Unificata**: Filtra istantaneamente per titolo ricetta, singoli ingredienti o per `@username` dell'autore.
- **Sezione Creator**: Visualizza le schede sintetiche dei cuochi della community con avatar, biografia, categorie preferite e contatore delle ricette pubblicate, con pulsante rapido per visitare il loro profilo pubblico.
- **Card Interattive**: Badge autore cliccabile, tempi di preparazione, porzioni, stima calorie e badge "Tua Ricetta" per i piatti creati dall'utente connesso.

### 📖 2. "Il Mio Ricettario" (Area Personale Riservata)
- **Isolamento dei Contenuti**: Accesso immediato con tasto prominente nella barra di navigazione post-login. Mostra esclusivamente le ricette create e custodite dall'utente.
- **Pulsante "+ Crea" / Nuova Ricetta**: Accessibile ovunque; se cliccato da un visitatore ospite apre una modale con invito ad accedere o registrarsi.
- **Gestione Completa Ricette**: Comandi dedicati di *Modifica* ed *Eliminazione* (con conferma) attivi sulle proprie creazioni.
- **Empty State Accogliente**: Guida visiva e invito all'azione con pulsante diretto quando non sono ancora state aggiunte ricette.

### 👤 3. Profili Esclusivamente Pubblici & Configurazione
- **Trasparenza e Condivisione**: Tutti i profili e i ricettari sono configurati come pubblici per favorire l'ispirazione gastronomica nella community.
- **Personalizzazione del Profilo**:
  - **Nome Completo / Nome Chef**: Visibile sopra ogni ricetta pubblicata.
  - **Descrizione (Biografia)**: Spazio per presentarsi e condividere la propria passione culinaria.
  - **Foto Profilo (Avatar)**: Caricamento e anteprima in tempo reale sia su Supabase Storage (`avatars`) che in locale.
- **Badge "Profilo Pubblico"**: Distintivo con icona verde che certifica la visibilità del profilo.

### 🗑️ 4. Eliminazione Definitiva del Profilo
- Pulsante dedicato **"Elimina Profilo e Ricettario"** all'interno del pannello di configurazione profilo.
- **Modale di Sicurezza con Avviso di Irreversibilità**: Notifica chiaramente che l'operazione cancellerà in modo permanente dati personali, foto profilo e **tutte le ricette create dall'utente**.
- **Cancellazione Persistente a Cascata**: Elimina i dati sia dal database cloud Supabase (`public.recipes`, `public.profiles` e `auth.users` via RPC) sia dal LocalStorage del browser.

### 🥗 5. Calcolo Nutrizionale Dinamico
- Dashboard nutrizionale interattiva con ripartizione calorie, macronutrienti (*proteine*, *carboidrati*, *grassi*, *fibre*) e micronutrienti essenziali.
- Integrazione con le API di **Open Food Facts** e stima volumetrica automatica delle dosi.

### 🤖 6. Importazione AI da Instagram Reel e Web (Opzionale)
- Possibilità di importare ricette incollando il link di un Instagram Reel o di un articolo web, con estrazione automatica di ingredienti e passaggi tramite Gemini AI.

---

## 🛠️ Tecnologie Utilizzate

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (icone), [Motion](https://motion.dev/) (animazioni)
- **Backend & Database**: [Express](https://expressjs.com/), [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Auth OAuth, Storage)
- **Nutrizione & Dati**: [Open Food Facts API](https://world.openfoodfacts.org/)
- **AI Engine**: Google Gemini API (`@google/genai`)

---

## 💻 Guida all'Installazione Locale

Se vuoi clonare e avviare questo repository sul tuo computer, segui questi passaggi:

### 1. Prerequisiti
- **Node.js**: versione `20.11.0` o superiore (consigliata `20.18+` o `22+`).
- **npm** (incluso in Node) oppure **bun**.
- Git installato sul proprio computer.

### 2. Clonazione del Repository
```bash
git clone https://github.com/DevMarzia/Sapore-e-Note.git
cd Sapore-e-Note
```

### 3. Installazione delle Dipendenze
```bash
npm install
```
*(Se riscontri conflitti con peer dependencies su versioni precedenti di Node, usa `npm install --legacy-peer-deps`)*.

### 4. Configurazione delle Variabili d'Ambiente (`.env`)
Crea un file `.env` nella cartella principale del progetto prendendo spunto da `.env.example`:

```env
# Configurazione Supabase (Opzionale ma consigliata per la persistenza cloud)
VITE_SUPABASE_URL="https://tuo-progetto.supabase.co"
VITE_SUPABASE_ANON_KEY="tua-chiave-anon-public-supabase"

# Chiave Gemini AI (Opzionale per l'estrazione intelligente da Reel e siti web)
GEMINI_API_KEY="la-tua-chiave-gemini"

# Porta del server (opzionale, default: 3000)
PORT=3000
```

> **Nota**: Se non configuri le credenziali Supabase, la web app funzionerà automaticamente in **Modalità Locale (LocalStorage)**, permettendoti comunque di testare tutte le funzionalità e le ricette demo.

### 5. Avvio del Server di Sviluppo
```bash
npm run dev
```

L'applicazione sarà attiva e raggiungibile nel browser all'indirizzo:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🗄️ Configurazione Backend con Supabase

Per collegare la web app a un database PostgreSQL gestito su Supabase:

1. Crea un nuovo progetto su [Supabase](https://supabase.com/).
2. Dal menu laterale del progetto, vai in **SQL Editor**.
3. Apri il file [`supabase_setup.sql`](./supabase_setup.sql) contenuto in questo repository, copia l'intero contenuto e incollalo nell'editor di Supabase.
4. Clicca su **Run** (o premi `Ctrl + Enter`).

Lo script è completamente idempotente e configurerà in automatico:
- **Tabella `public.profiles`**: Informazioni utente collegate ad `auth.users` con cancellazione a cascata (`ON DELETE CASCADE`).
- **Tabella `public.recipes`**: Ricettario con campi per ingredienti e passaggi in formato JSONB, categorie e nutrizione.
- **Trigger `handle_new_user`**: Creazione automatica del profilo chef al momento della registrazione o del primo accesso con Google OAuth.
- **Storage Buckets**: `recipe-images` e `avatars` con policy pubbliche per upload e lettura.
- **Policy di Sicurezza RLS**: Permessi granulari di `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- **Funzione RPC `delete_user_account()`**: Funzione con privilegi elevati (`SECURITY DEFINER`) che permette all'utente di eliminare definitivamente il proprio profilo, le ricette personali e il record di sistema.

---

## 🔐 Guida: Autenticazione Google OAuth con Supabase

Ecco i passaggi dettagliati eseguiti per abilitare il login con Google tramite Supabase:

### Fase 1: Creazione Credenziali su Google Cloud Console
1. Accedi alla [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuovo progetto (es. *Sapore e Note*).
3. Vai nel menu **API e servizi** > **Schermata di consenso OAuth** (*OAuth consent screen*):
   - Tipo di utente: seleziona **Esterno** (*External*).
   - Inserisci il nome dell'app (*Sapore & Note*), l'email di supporto sviluppatore e salva.
   - Sotto **Ambiti** (*Scopes*), aggiungi: `.../auth/userinfo.email`, `.../auth/userinfo.profile` e `openid`.
4. Vai in **API e servizi** > **Credenziali** (*Credentials*):
   - Clicca su **+ Crea credenziali** > **ID client OAuth**.
   - Tipo di applicazione: **Applicazione Web** (*Web application*).
   - Nome: *Client Web Sapore e Note*.

### Fase 2: Configurazione dell'URI di Reindirizzamento
1. Apri la dashboard del tuo progetto su **Supabase**.
2. Vai in **Authentication** > **Providers** e individua la riga **Google**.
3. Copia l'**URL di Callback (Redirect URL)** mostrato da Supabase. Il formato è:
   ```text
   https://<tuo-project-id>.supabase.co/auth/v1/callback
   ```
4. Torna nella Google Cloud Console, nella schermata di configurazione del Client OAuth appena creato:
   - Sotto **Origini JavaScript autorizzate**, inserisci l'origine della tua app (es. `http://localhost:3000` o l'URL di produzione).
   - Sotto **URI di reindirizzamento autorizzati**, incolla l'URL di callback di Supabase appena copiato.
5. Clicca su **Crea**: Google ti mostrerà il **Client ID** e il **Client Secret**.

### Fase 3: Abilitazione di Google su Supabase
1. Torna nella dashboard di Supabase in **Authentication** > **Providers** > **Google**.
2. Attiva lo switch **Enable Google**.
3. Incolla il **Client ID** e il **Client Secret** ottenuti da Google.
4. Clicca su **Save**.

### Fase 4: Configurazione URL del Sito in Supabase
1. Nella dashboard di Supabase, vai in **Authentication** > **URL Configuration**.
2. Imposta il **Site URL** sul tuo dominio o indirizzo locale:
   ```text
   http://localhost:3000
   ```
3. Sotto **Redirect URLs**, aggiungi:
   ```text
   http://localhost:3000/**
   ```
4. Clicca su **Save**.

A questo punto, avviando la web app e cliccando su **"Accedi con Google"**, si aprirà la finestra di autenticazione per consentire all'utente di scegliere il proprio account Google reale e registrare automaticamente il proprio profilo in Supabase.

---

## 📂 Architettura del Progetto

```
Sapore-e-Note/
├── .env.example                     # Modello per variabili d'ambiente
├── index.html                       # Entry point HTML dell'applicazione
├── package.json                     # Dipendenze e script npm
├── server.ts                        # Server Express full-stack e middleware Vite
├── supabase_setup.sql               # Script SQL idempotente per setup DB e Storage
├── tsconfig.json                    # Configurazione TypeScript
├── vite.config.ts                   # Configurazione Vite e Tailwind CSS
└── src/
    ├── App.tsx                      # Componente radice, routing viste e orchestrazione
    ├── main.tsx                     # Mount dell'applicazione React
    ├── components/
    │   ├── auth/                    # Modali di login, registrazione e Google OAuth
    │   ├── community/               # Sezione creator e schede cuochi della community
    │   ├── layout/                  # Navbar dinamica (ospite/loggato) e Footer
    │   ├── profile/                 # Vista "Il Mio Ricettario", EditProfile e DeleteConfirm
    │   ├── recipes/                 # Card ricetta, griglia, dettaglio, aggiunta e filtri
    │   └── ui/                      # Modale configurazione Supabase e Toast notifiche
    ├── context/
    │   └── AuthContext.tsx          # Gestione stato utente, sessione, OAuth e cancellazione
    ├── lib/
    │   ├── demoData.ts              # Ricette dimostrative iniziali con autori community
    │   └── supabase.ts              # Inizializzazione e validazione client Supabase
    ├── services/
    │   ├── nutritionService.ts      # Calcolo nutrizionale con Open Food Facts
    │   └── recipeService.ts         # Operazioni CRUD ricette (Supabase + LocalStorage)
    └── types/
        └── recipe.ts                # Interfacce TypeScript (Recipe, UserProfile, Nutrienti)
```

---

## 📜 Script Disponibili

Nel file `package.json` sono configurati i seguenti script:

- `npm run dev`: Avvia il server Express e Vite in modalità sviluppo con HMR sulla porta `3000`.
- `npm run build`: Compila il bundle React ottimizzato per la produzione in `dist/`.
- `npm run start`: Esegue il server in ambiente di produzione.
- `npm run lint`: Esegue la verifica dei tipi TypeScript (`tsc --noEmit`) senza generare output.
- `npm run preview`: Avvia l'anteprima locale della build di produzione.

---

## 🤝 Contribuire

I contributi sono sempre i benvenuti! Per proporre modifiche:
1. Effettua un fork del repository.
2. Crea un branch dedicato alla tua funzionalità (`git checkout -b feature/nuova-funzionalita`).
3. Effettua il commit delle modifiche (`git commit -m "feat: aggiunta nuova funzionalita"`).
4. Esegui il push sul tuo branch (`git push origin feature/nuova-funzionalita`).
5. Apri una **Pull Request**.

---

## 📄 Licenza

Progetto rilasciato ad uso didattico e dimostrativo. Sviluppato con passione per la buona cucina italiana! 🇮🇹🍝

# Miu.

An ultra-private, aesthetic 2-person messenger hidden behind an intelligent AI chatbot decoy.

## Overview

Miu is designed for two people who want absolute privacy.
To the outside world and casual glance, the app opens as **Miu AI**, a sleek AI assistant with explore topics and conversation sessions.
Entering the secret local command `/qupa` instantly opens **Magic Layer**, establishing a private, real-time encrypted communication channel with your single authorized partner.

## Key Features

- **AI Chatbot Decoy**: Authentic AI conversational experience with horizontal explore marquees and persistent session history.
- **Magic Layer Secret Interception**: The secret command `/qupa` is handled locally, never sent to any server or logged in chat history.
- **Single-Pair Architecture**: Enforces exactly two authorized users per connection with atomic pairing via single-use invite tokens or 6-character codes.
- **Discreet Privacy Exits**: Instant return to chatbot on <kbd>Esc</kbd> or header double-tap; app-switcher privacy blur shield.
- **Rich Media & Controls**: View-once self-destructing media, voice messages, real-time typing indicators, read receipts, and reactions.
- **Passcode & Biometrics**: Optional PIN or biometric lock before accessing the private space.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Row-Level Security, Realtime, Storage)
- **Deployment**: Vercel / Firebase Hosting

## Project Structure

```text
miu/
├── public/                 # Static assets and SPA redirects
├── src/
│   ├── components/
│   │   ├── chat/           # Chatbot decoy & private messaging components
│   │   └── common/         # Core reusable UI modals and inputs
│   ├── context/            # Auth, Chat, and Theme React contexts
│   ├── data/               # Default state initializers
│   ├── lib/                # Supabase client configuration
│   ├── pages/              # Primary route pages (Chat, Auth, Join, Profile, Splash)
│   ├── types/              # Clean TypeScript interfaces
│   ├── utils/              # Image processing and privacy utilities
│   ├── App.tsx             # Root layout and route configuration
│   ├── index.css           # Global Tailwind and viewport styles
│   └── main.tsx            # Application entry point
└── supabase/
    ├── schema.sql          # Complete production database schema & RLS policies
    └── migrate_cleanup.sql # One-click database optimization & cleanup migration
```

## Database Setup

1. Create a project in [Supabase](https://supabase.com).
2. Open **SQL Editor** in the Supabase Dashboard.
3. Paste and run the contents of `supabase/schema.sql`.
4. Ensure the storage buckets `chat-media`, `voice-messages`, and `avatars` exist in Supabase Storage.
5. Create a `.env` file with your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

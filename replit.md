# HIPAA Privacy Guardian: Interactive Training Game

## Overview

You are a Privacy Guardian. Your role is not to check compliance boxes—it's to protect something sacred: the trust patients place in your organization when they share their most vulnerable information.

This is a mission-driven game about protecting patient trust, not checking compliance boxes. The reward for completing scenarios is seeing who you protected through patient stories. Built with a retro 16-bit pixel art aesthetic, the game transforms compliance training into an engaging, emotionally resonant experience.

Every principle learned, every scenario completed, every room cleared represents lives quietly protected. Patients who will never know your name, but whose trust you've honored.

## Core Gameplay Features

**Educational Item Collection System:**
- Players discover HIPAA educational items placed throughout hospital rooms
- Items include: patient rights posters, training manuals, compliance computers, and whiteboards
- Each item displays detailed HIPAA facts with Out-of-Pocket conversational tone when clicked
- Collected items are visually dimmed (opacity 0.4) with smooth transition to indicate completion
- React key management (`${item.id}-${isCollected}`) ensures proper remounting and attribute updates
- Progress persists across room navigation and page refreshes via localStorage
- Encourages exploration while providing authentic compliance training
- Updated content: "Patient Rights 101", "Minimum Necessary: It's Not a Suggestion", "When You CAN Share PHI", "So You're Responsible for PHI Now", "The Art of the HIPAA Shutdown"

**Knowledge Tracker:**
- Visual progress bar showing "Privacy Principles Learned: X/4"
- Displays 4 Privacy Rule principles with icons: Patient Rights, Minimum Necessary, PHI Identifiers, Safeguards
- Icons transition from gray to pink (#FF6B9D) when their associated educational items are collected
- Updates in real-time as players collect items across different rooms
- Provides clear sense of progression and completion status
- IT Office item serves as transitional content for future security-focused game sections (not tracked)

**Hallway Hub (Visual Map):**
- Visual grid-based room selection map with spatial layout
- Rooms arranged as: IT Office (top), Break Room/Medical Records (middle), Reception/ER/Laboratory (bottom)
- Room status indicators: Locked (gray + lock icon), Available (pulsing animation), Cleared (green checkmark)
- Thematic subtitles for each room:
  - Reception: "The Entry Point"
  - Emergency Room: "The Edge Cases"
  - Laboratory: "The Source"
  - Medical Records: "The Archive"
  - IT Office: "The Vault"
  - Break Room: "The Human Factor" (always unlocked)
- Room unlock progression: Reception → ER → Lab → Medical Records → IT Office
- Patient Story collection gallery showing earned stories from cleared rooms

**Exploration Mode:**
- 32x32 pixel grid-based movement system (WASD/Arrow keys)
- Each room contains NPCs, interaction zones, and educational items
- NPCs and interaction zones are clickable (direct interaction) or activatable via Space key when nearby
- Collision detection for realistic navigation
- Room transitions maintain game state
- Z-index layering ensures interaction zones (bouncing stars) are clickable above other elements

**Pokémon-Style Dialogue System:**
- Text box appears at bottom of screen with NPC portrait on left
- Character-by-character typing animation (30ms per character)
- Spacebar to skip typing or advance dialogue
- Click dialogue box to skip/advance
- Three-phase flow: dialogue → choices → feedback
- Character portraits displayed in retro pixel style

**Community Trust Meter (0-100):**
- Not your score—*theirs*. Represents community/patient trust in the organization.
- 100: Warm, connected. Patients share openly, seek care freely.
- 70-99: Healthy. Small lapses happen but trust holds.
- 40-69: Eroding. Hesitation creeps in. Some avoid care.
- Below 40: Breaking. People hide symptoms, skip treatment, suffer alone.
- Drops quickly with mistakes. Rebuilds slowly with sustained good practice.
- Dynamic status text: "Patients trust freely" / "Trust is eroding..." / "Trust is breaking!"

**Quiz & Decision Making:**
- Interactive multiple choice scenarios (2-4 options)
- Click buttons or press number keys (1-4) to select answers
- Trust impacts based on choices:
  - Correct answers (+5 trust points)
  - Wrong answers (deduct points based on severity)
- Visual feedback with retro styling:
  - Correct: Green border, pink screen flash, +points display
  - Incorrect: Pink border, explanation shown, -points display
  - Partial: Orange border for partial credit
- Educational feedback on each choice with Out-of-Pocket tone
- Scene progression based on player decisions
- Session tracking of all choices and outcomes

**Patient Story Collection:**
- The true reward. Not badges—lives protected.
- When a room is cleared, a patient story is earned showing who was protected
- Each story is a specific person whose trust was honored
- Stories collected in the Hallway Hub for viewing
- Example: "Because you secured that sign-in sheet, Elena felt safe seeking treatment. Her employer in the waiting room never knew why she was there."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as the build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for state management
- Tailwind CSS for styling with shadcn/ui component library

**Component Structure:**
The application follows a component-based architecture with clear separation of concerns:
- **Game Components**: 
  - DialogueBox (Pokémon-style with typing animation, spacebar advance)
  - PrivacyMeter (visual score starting at 100, depletes with wrong answers)
  - ChoiceButton (number key support 1-4, retro styling)
  - FeedbackDisplay (pink flash on correct, score change display)
  - CharacterPortrait, SceneCounter
  - GameContainer (orchestrates dialogue → choices → feedback flow)
- **Exploration Components**: HospitalHub (room selection), RoomExploration (2D tile-based movement), ExplorationGame (orchestrates game modes), EducationalItemModal (HIPAA fact display), KnowledgeTracker (Privacy Rule progress visualization)
- **UI Components**: Comprehensive shadcn/ui library providing accessible, styled primitives

**State Management:**
- React Query handles server state (though currently minimal API usage)
- Local component state (useState, useEffect) for game progress
- LocalStorage persistence for:
  - Save/resume functionality and progress tracking
  - Session logging for user decisions and scoring
  - Educational items collection tracking (visual dimming after reading)
- Component remounting via key prop ensures proper state initialization across room changes

**Design System:**
- Custom "Out-of-Pocket" retro color palette defined in CSS variables
- Press Start 2P font loaded from Google Fonts for authentic retro feel
- Pixel-perfect rendering with `imageRendering: 'pixelated'`
- Fixed 640px desktop width mimicking classic game resolutions
- Responsive mobile design with full-width layout

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Hot Module Replacement (HMR) via Vite in development
- Static file serving in production

**Current Implementation:**
The backend is minimal by design, currently providing:
- Basic routing structure in `server/routes.ts`
- In-memory storage interface (`MemStorage`) with user CRUD operations
- Middleware for request logging and error handling
- Development-only Vite integration for seamless DX

**Rationale:**
The application is primarily client-side driven with game data stored in JSON files. The backend is architected to easily scale when server-side features are needed (user authentication, progress synchronization, analytics, etc.).

### Data Storage Solutions

**Client-Side Storage:**
- Game data (scenes, dialogue, choices) stored in static JSON files (`gameData.json`, `roomData.json`)
- LocalStorage for:
  - Game progress (current scene, score, session log)
  - Exploration progress (completed rooms, visited scenes)
  - Educational items collection (`collectedEducationalItems` array tracking item IDs)
  - Resume game state

**Schema Validation:**
- Zod schemas in `shared/schema.ts` define data contracts
- Type-safe data structures for scenes, choices, rooms, NPCs, interaction zones, and educational items
- Educational item schema includes: id, title, type (enum: poster, manual, computer, whiteboard), position (x, y), and fact content
- Drizzle-zod integration prepared for future database usage

**Database Architecture (Prepared but Not Active):**
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Schema definitions ready in `shared/schema.ts`
- Migration configuration in `drizzle.config.ts`
- Currently using in-memory storage; database can be activated by running migrations and updating storage layer

**Design Decision:**
Static JSON files were chosen for Phase 1 to enable rapid iteration on game content without database complexity. The architecture allows seamless transition to database storage when multi-user features, leaderboards, or administrative content management are required.

### External Dependencies

**UI Framework:**
- **Radix UI**: Headless component primitives (@radix-ui/*) providing accessible, unstyled components
- **shadcn/ui**: Pre-styled component library built on Radix UI and Tailwind CSS
- **Tailwind CSS**: Utility-first CSS framework with custom configuration for retro aesthetic

**Game Assets:**
- **Google Fonts**: Press Start 2P font for authentic pixel typography
- **Generated Images**: Character portraits and backgrounds stored in `attached_assets/generated_images/`
- **Lucide React**: Icon library for UI elements

**Development Tools:**
- **Vite**: Build tool with plugins for React, runtime error overlay, and Replit-specific tooling
- **TypeScript**: Type safety across client and server
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Server bundling for production

**Third-Party Services:**
- **Neon Database**: Serverless PostgreSQL (configured but not currently active)
- **Replit Platform**: Development environment with custom Vite plugins for error handling, cartography, and dev banners

**Package Management:**
- npm with package-lock.json for deterministic builds
- Shared TypeScript paths for cross-boundary imports (@/, @shared/, @assets/)

**Architectural Benefits:**
- Modular component library allows rapid UI development
- Type-safe schemas prevent runtime errors
- Development tools provide immediate feedback
- Database abstraction layer enables easy backend scaling
- Asset organization supports content expansion
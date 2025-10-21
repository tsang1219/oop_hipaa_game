# HIPAA Privacy Rule Interactive Training Game

## Overview

An interactive HIPAA Privacy Rule training game built with a retro 16-bit pixel art aesthetic. The application transforms compliance training into an engaging experience through dialogue-based gameplay where users interact with healthcare characters (like Nurse Nina) to make HIPAA-related decisions. Each choice impacts scoring and provides educational feedback, making regulatory compliance training both effective and enjoyable.

The game features both linear dialogue sequences and an explorable hospital environment with multiple rooms and NPCs, allowing users to discover compliance scenarios organically while tracking their progress.

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

**Exploration Mode:**
- 32x32 pixel grid-based movement system (WASD/Arrow keys)
- Multiple hospital rooms: Reception Area, Medical Records Room, Nurse Station, Billing Office, IT Department, Break Room
- NPCs and interaction zones are clickable (direct interaction) or activatable via Space key when nearby
- Collision detection for realistic navigation
- Room transitions maintain game state
- Z-index layering ensures interaction zones (bouncing stars) are clickable above other elements

**Dialogue & Decision Making:**
- Interactive conversations with healthcare characters
- Multiple choice decisions affecting HIPAA compliance scores
- Educational feedback on each choice with Out-of-Pocket tone
- Scene progression based on player decisions
- Session tracking of all choices and outcomes
- New scenarios: Chatty Cathy (cafeteria gossip), Concerned Husband (family requests), Fax Machine Freddy (breach response), Boss Man Brad (employer requests), Celebrity Crisis (VIP privacy)

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
- **Game Components**: CharacterPortrait, DialogueBox, ChoiceButton, ScoreMeter, FeedbackDisplay, SceneCounter
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
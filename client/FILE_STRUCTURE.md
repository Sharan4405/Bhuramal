# Frontend File Structure

## Organized Component-Based Architecture

```
client/
├── app/                                 # Next.js app directory
│   ├── page.tsx                        # Login page
│   ├── globals.css                     # Tailwind CSS configuration and utilities
│   ├── layout.tsx                      # Root layout
│   └── dashboard/
│       ├── page.tsx                    # Conversations list
│       └── chat/
│           └── [id]/
│               └── page.tsx            # Chat interface
│
├── components/                          # Reusable components
│   ├── ui/                             # Basic UI components
│   │   ├── Button.tsx                  # Reusable button component
│   │   ├── Input.tsx                   # Reusable input component
│   │   ├── Card.tsx                    # Reusable card component
│   │   └── Badge.tsx                   # Status badge component
│   │
│   ├── dashboard/                      # Dashboard-specific components
│   │   ├── Header.tsx                  # Dashboard header with logout
│   │   ├── ConversationCard.tsx        # Individual conversation card
│   │   └── FilterButtons.tsx           # Filter buttons (ALL/OPEN/RESOLVED)
│   │
│   └── chat/                           # Chat-specific components
│       ├── ChatHeader.tsx              # Chat header with back button and resolve
│       ├── ChatInput.tsx               # Message input form
│       └── MessageBubble.tsx           # Individual message bubble
│
├── lib/
│   └── api.ts                          # API client and authentication utilities
│
├── .env.local                          # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Component Organization

### UI Components (`components/ui/`)
- **Button.tsx**: Primary and success button variants
- **Input.tsx**: Text input with optional label
- **Card.tsx**: Container card with optional hover effect
- **Badge.tsx**: Status badges for OPEN/RESOLVED states

### Dashboard Components (`components/dashboard/`)
- **Header.tsx**: Top navigation bar with branding and logout
- **ConversationCard.tsx**: Displays conversation summary with user, status, last message
- **FilterButtons.tsx**: Toggle between ALL/OPEN/RESOLVED conversations

### Chat Components (`components/chat/`)
- **ChatHeader.tsx**: Navigation and resolve button
- **ChatInput.tsx**: Message composition form
- **MessageBubble.tsx**: Individual message display with timestamp

## Design System

### Tailwind CSS Utilities (in `globals.css`)
- `.btn-primary`: Orange button with hover effects
- `.btn-success`: Green button for success actions
- `.card`: White container with shadow
- `.input`: Text input with focus states
- `.badge-open`: Green badge for open conversations
- `.badge-resolved`: Gray badge for resolved conversations
- `.message-in`: White bubble for incoming messages
- `.message-out`: Orange bubble for outgoing messages

### Color Theme
- **Orange**: `rgb(255 107 53)` - Primary brand color
- **Green**: `rgb(16 185 129)` - Success and active states
- **White/Gray**: Background and text colors

## Benefits of This Structure

1. **Reusability**: UI components can be used across different pages
2. **Maintainability**: Each component has a single responsibility
3. **Scalability**: Easy to add new features without cluttering existing files
4. **Type Safety**: All components use TypeScript interfaces
5. **Tailwind First**: All styling uses Tailwind utility classes
6. **Organized**: Clear separation between UI, dashboard, and chat components

## Import Patterns

```typescript
// UI Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// Dashboard Components
import { DashboardHeader } from '@/components/dashboard/Header';
import { ConversationCard } from '@/components/dashboard/ConversationCard';
import { FilterButtons } from '@/components/dashboard/FilterButtons';

// Chat Components
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';

// Utilities
import { api, auth } from '@/lib/api';
```

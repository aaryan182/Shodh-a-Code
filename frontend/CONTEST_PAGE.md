# Contest Page Implementation

This document describes the implementation of the contest page (`/contest/[contestId]`) and its components.

## Overview

The contest page provides a comprehensive interface for participating in coding contests with the following layout:

1. **Header**: Contest information, countdown timer, and user info
2. **Left Panel**: Problem list and descriptions
3. **Center Panel**: Code editor with Monaco Editor
4. **Right Panel**: Live leaderboard
5. **Bottom Panel**: Submission status (collapsible)

## Components

### 1. ContestHeader (`/components/contest/ContestHeader.tsx`)

**Features:**
- Real-time countdown timer showing time until contest start/end
- Contest status indicators (UPCOMING, ACTIVE, ENDED)
- Contest metadata (name, description, schedule)
- User information display
- Responsive design with proper mobile layout

**Props:**
- `contest`: Contest data
- `user`: Current user information
- `className`: Optional styling

### 2. ProblemPanel (`/components/contest/ProblemPanel.tsx`)

**Features:**
- Expandable problem list with difficulty indicators
- Problem status tracking (solved, attempted, not attempted)
- Detailed problem descriptions with formatting
- Input/output format specifications
- Constraints and success rate display
- Problem statistics (submissions, acceptance rate)

**Props:**
- `problems`: Array of problem summaries
- `selectedProblemId`: Currently selected problem
- `onProblemSelect`: Problem selection callback
- `problemDetails`: Detailed problem information
- `solvedProblems`: Set of solved problem IDs
- `attemptedProblems`: Set of attempted problem IDs

### 3. CodeEditor (`/components/contest/CodeEditor.tsx`)

**Features:**
- Monaco Editor integration with full IDE features
- Multiple programming language support (Java, Python, C++, C, JavaScript, Go, Rust)
- Language-specific templates and syntax highlighting
- Fullscreen mode support
- File upload/download functionality
- Customizable themes (light/dark)
- Configurable font size
- Keyboard shortcuts (Ctrl+Enter to submit, Ctrl+R to run)
- Code templates for each language

**Props:**
- `value`: Current code content
- `onChange`: Code change callback
- `language`: Selected programming language
- `onLanguageChange`: Language change callback
- `onSubmit`: Code submission callback
- `onRun`: Code execution callback (optional)
- `isSubmitting`: Loading state for submissions
- `readOnly`: Whether editor is read-only

### 4. Leaderboard (`/components/contest/Leaderboard.tsx`)

**Features:**
- Live rankings with auto-refresh capability
- Participant statistics (score, problems solved, submissions)
- Success rate calculations
- Current user highlighting
- Rank-based styling (gold, silver, bronze)
- Compact mode for smaller displays
- Manual refresh functionality

**Props:**
- `contestId`: Contest identifier
- `currentUserId`: Current user ID for highlighting
- `onRefresh`: Manual refresh callback
- `autoRefreshInterval`: Auto-refresh interval in seconds
- `compact`: Whether to use compact display mode

### 5. SubmissionStatus (`/components/contest/SubmissionStatus.tsx`)

**Features:**
- Real-time submission status tracking with polling
- Status-specific icons and colors
- Execution metrics (time, memory usage, score)
- Detailed error messages and compilation errors
- Auto-refresh for processing submissions
- Submission details modal
- Status history and timestamps

**Props:**
- `submission`: Current submission data
- `onStatusChange`: Status change callback
- `onRefresh`: Refresh callback
- `autoRefresh`: Whether to auto-refresh
- `autoRefreshInterval`: Refresh interval in seconds
- `showDetails`: Whether to show detailed information

## Main Contest Page (`/pages/contest/[contestId].tsx`)

### Layout Structure

The page uses a flexible layout system that adapts to different screen sizes:

**Desktop Layout:**
```
┌─────────────────────────────────────────────────┐
│                Contest Header                    │
├──────────┬─────────────────────────┬─────────────┤
│ Problems │     Code Editor         │ Leaderboard │
│   Panel  │                         │    Panel    │
│          ├─────────────────────────┤             │
│          │   Submission Status     │             │
└──────────┴─────────────────────────┴─────────────┘
```

**Mobile Layout:**
- Collapsible panels with overlay system
- Mobile-specific controls and navigation
- Touch-friendly interface elements
- Responsive panel sizing

### State Management

The page manages complex state including:
- Contest and problem data
- Code editor content and language selection
- Submission status and polling
- Layout panel visibility
- User progress tracking (solved/attempted problems)
- Error handling and loading states

### Key Features

1. **Responsive Design**: Adapts to tablets and desktops with appropriate panel management
2. **Real-time Updates**: Auto-refreshing leaderboard and submission status
3. **Persistent State**: Code and settings preserved during navigation
4. **Error Handling**: Comprehensive error boundaries and user feedback
5. **Performance**: Optimized rendering and efficient polling mechanisms

## API Integration

The contest page integrates with the backend through:

- `contestAPI.getContest()`: Fetch contest details
- `contestAPI.getContestProblems()`: Get problem list
- `contestAPI.getLeaderboard()`: Retrieve rankings
- `submissionAPI.submitCode()`: Submit solutions
- `submissionAPI.getSubmissionStatus()`: Poll submission status
- `apiUtils.pollSubmissionStatus()`: Automated status polling

## Responsive Behavior

### Desktop (≥1024px)
- Three-panel layout with resizable panels
- Full-featured code editor with all controls
- Comprehensive leaderboard with detailed statistics
- Bottom submission status panel

### Tablet (768px - 1023px)
- Collapsible side panels
- Simplified mobile controls
- Optimized touch interactions
- Overlay-based panel system

### Mobile (<768px)
- Single-panel view with navigation controls
- Compact component variants
- Touch-optimized interface
- Modal-based detail views

## Usage

To navigate to a contest page:

```typescript
// Direct navigation
router.push('/contest/123');

// From home page
<Link href="/contest/1">View Demo Contest</Link>

// With user context
const contestUrl = `/contest/${contestId}`;
```

## Development Notes

1. **Monaco Editor**: Requires proper webpack configuration for Next.js
2. **Real-time Updates**: Uses polling mechanism with configurable intervals
3. **State Persistence**: Consider implementing local storage for code preservation
4. **Performance**: Large contests may require pagination or virtualization
5. **Accessibility**: All components include proper ARIA labels and keyboard navigation

## Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time WebSocket updates
2. **Code Collaboration**: Multi-user editing capabilities
3. **Advanced Debugging**: Integrated debugging tools and test case runners
4. **Contest Analytics**: Detailed performance metrics and insights
5. **Mobile App**: React Native implementation for mobile platforms

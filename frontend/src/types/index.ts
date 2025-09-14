// Core Entity Types (based on backend entities)

export interface User {
  id: number
  username: string
  email: string
  createdAt: string
}

export interface Contest {
  id: number
  name: string
  description?: string
  startTime: string
  endTime: string
  createdAt: string
  status: ContestStatus
  problems?: ProblemSummary[]
}

export interface Problem {
  id: number
  contestId: number
  title: string
  description: string
  difficulty: ProblemDifficulty
  timeLimit: number // in seconds
  memoryLimit: number // in MB
  inputFormat?: string
  outputFormat?: string
  constraints?: string
  totalSubmissions?: number
  acceptedSubmissions?: number
}

export interface TestCase {
  id: number
  problemId: number
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface TestCaseResult {
  testCaseId: number
  passed: boolean
  input: string
  expectedOutput: string
  actualOutput?: string
  executionTime?: number // in milliseconds
  memoryUsed?: number // in KB
  error?: string
}

export interface Submission {
  id: number
  userId: number
  problemId: number
  contestId: number
  code: string
  language: ProgrammingLanguage
  status: SubmissionStatus
  result?: string
  score?: number
  executionTime?: number // in milliseconds
  memoryUsed?: number // in KB
  submittedAt: string
}

// Enums matching backend
export type ProgrammingLanguage =
  | 'JAVA'
  | 'PYTHON'
  | 'CPP'
  | 'C'
  | 'JAVASCRIPT'
  | 'GO'
  | 'RUST'

export type SubmissionStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'PRESENTATION_ERROR'
  | 'SYSTEM_ERROR'

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type ContestStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED'

// DTO Types (based on backend DTOs)

export interface UserRegistrationRequest {
  username: string
  email: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
  createdAt: string
}

export interface SubmissionRequest {
  userId: number
  problemId: number
  contestId: number
  code: string
  language: ProgrammingLanguage
}

export interface SubmissionResponse {
  submissionId: number
  status: SubmissionStatus
  result?: string
  score?: number
  executionTime?: number // in milliseconds
  memoryUsed?: number // in KB
  userId?: number
  problemId?: number
  contestId?: number
  language?: ProgrammingLanguage
  submittedAt?: string
  code?: string
  testCaseResults?: TestCaseResult[]
}

export interface SubmissionStatusResponse {
  id: number
  status: SubmissionStatus
  result?: string
  createdAt: string
  updatedAt: string
}

export interface ContestDetailsResponse {
  id: number
  name: string
  description?: string
  startTime: string
  endTime: string
  createdAt: string
  problems: ProblemSummaryResponse[]
  status: ContestStatus
}

export interface ProblemSummaryResponse {
  id: number
  title: string
  difficulty: ProblemDifficulty
  timeLimit: number
  memoryLimit: number
  totalSubmissions?: number
  acceptedSubmissions?: number
}

export interface ProblemDetailResponse {
  id: number
  title: string
  description: string
  difficulty: ProblemDifficulty
  timeLimit: number
  memoryLimit: number
  inputFormat?: string
  outputFormat?: string
  constraints?: string
  totalSubmissions?: number
  acceptedSubmissions?: number
}

export interface LeaderboardResponse {
  contestId: number
  contestName: string
  entries: LeaderboardEntry[]
  totalParticipants: number
}

export interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  totalScore: number
  problemsSolved: number
  totalSubmissions: number
  lastSubmissionTime?: string
  problemStatus?: ProblemStatus[]
}

export interface ProblemStatus {
  problemId: number
  status: 'solved' | 'failed' | 'pending' | 'not_attempted'
  attempts: number
  bestScore?: number
  lastAttemptTime?: string
}

// Convenience type aliases
export type ProblemSummary = ProblemSummaryResponse
export type ProblemDetail = ProblemDetailResponse

// API Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  status?: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  hasNext: boolean
  hasPrevious: boolean
}

// Form types
export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password?: string
  confirmPassword?: string
}

export interface ContestForm {
  name: string
  description?: string
  startTime: string
  endTime: string
}

export interface ProblemForm {
  title: string
  description: string
  difficulty: ProblemDifficulty
  timeLimit: number
  memoryLimit: number
  inputFormat?: string
  outputFormat?: string
  constraints?: string
}

export interface SubmissionForm {
  code: string
  language: ProgrammingLanguage
}

export interface JoinContestForm {
  contestId: string
  username: string
}

// UI Component types (based on existing components)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Layout Component Props
export interface HeaderProps {
  user?: User | null
  onLogout?: () => void
}

export interface FooterProps {
  className?: string
}

// Contest-related Component Props
export interface ContestCardProps {
  contest: Contest
  onJoin?: (contestId: number) => void
  onView?: (contestId: number) => void
}

export interface ProblemCardProps {
  problem: ProblemSummary | ProblemDetail
  onSelect?: (problemId: number) => void
  showStats?: boolean
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: number
  loading?: boolean
}

export interface SubmissionListProps {
  submissions: SubmissionResponse[]
  loading?: boolean
  onViewDetails?: (submissionId: number) => void
}

export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: ProgrammingLanguage
  onLanguageChange?: (language: ProgrammingLanguage) => void
  readOnly?: boolean
  height?: string
}

export interface SubmissionStatusProps {
  submission: SubmissionResponse | SubmissionStatusResponse
  autoRefresh?: boolean
  onStatusChange?: (status: SubmissionStatus) => void
}

export interface SubmissionHistoryProps {
  problemId?: number
  userId?: number
  submissions: SubmissionResponse[]
  loading?: boolean
  onViewCode?: (submission: SubmissionResponse) => void
  onResubmit?: (code: string, language: ProgrammingLanguage) => void
  className?: string
}

export interface TestCaseResultsProps {
  testCaseResults: TestCaseResult[]
  loading?: boolean
  showDetails?: boolean
  className?: string
}

export interface CodeViewerProps {
  code: string
  language: ProgrammingLanguage
  readOnly?: boolean
  showLineNumbers?: boolean
  theme?: 'light' | 'dark'
  className?: string
}

// Error handling types
export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

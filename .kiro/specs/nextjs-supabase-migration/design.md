# Design Document: Next.js Supabase Migration

## Overview

This design outlines the complete migration of a Next.js job application tracker from MongoDB + Better Auth to Supabase for both database and authentication. The migration addresses current authentication issues while maintaining all existing functionality and improving system reliability.

**Key Design Principles:**
- **Zero Data Loss**: All existing user data, boards, columns, and job applications must be preserved
- **Feature Parity**: All current features must work identically after migration
- **Improved Reliability**: Replace problematic authentication system with Supabase's proven solution
- **Simplified Architecture**: Consolidate database and authentication into a single platform
- **Seamless User Experience**: Users should not notice any functional differences

## Architecture

### Current Architecture
```
Next.js App Router
├── Better Auth (Authentication)
├── MongoDB (Database)
│   ├── User Collection
│   ├── Board Collection  
│   ├── Column Collection
│   └── JobApplication Collection
└── Mongoose ODM (Data Access)
```

### Target Architecture
```
Next.js App Router
├── Supabase Auth (Authentication)
├── Supabase PostgreSQL (Database)
│   ├── auth.users (Built-in)
│   ├── public.user_profiles
│   ├── public.boards
│   ├── public.columns
│   └── public.job_applications
└── Supabase Client (Data Access)
```

### Migration Strategy

**Phase 1: Database Schema Creation**
- Create PostgreSQL tables matching MongoDB collections
- Establish foreign key relationships
- Set up Row Level Security (RLS) policies

**Phase 2: Authentication System Replacement**
- Replace Better Auth with Supabase Auth
- Update all authentication components
- Implement OAuth providers (Google, GitHub)
- Add 2FA support using Supabase MFA

**Phase 3: Data Migration**
- Export all MongoDB data
- Transform and import to Supabase
- Validate data integrity

**Phase 4: Code Refactoring**
- Replace Mongoose queries with Supabase queries
- Update all data access patterns
- Test all functionality

## Components and Interfaces

### Database Schema Design

#### User Profiles Table
```sql
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  profile_picture_data TEXT, -- Base64 encoded image
  profile_picture_updated_at TIMESTAMPTZ,
  theme TEXT DEFAULT 'system',
  accent_color TEXT DEFAULT 'blue',
  notifications JSONB DEFAULT '{}',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_backup_codes TEXT[],
  auth_providers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Boards Table
```sql
CREATE TABLE public.boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Columns Table
```sql
CREATE TABLE public.columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Job Applications Table
```sql
CREATE TABLE public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  status TEXT,
  column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  notes TEXT,
  salary TEXT,
  job_url TEXT,
  applied_date DATE,
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Authentication Components

#### Supabase Auth Configuration
```typescript
// lib/supabase/config.ts
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
}
```

#### Authentication Service Interface
```typescript
// lib/auth/types.ts
export interface AuthService {
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signInWithOAuth(provider: 'google' | 'github'): Promise<AuthResult>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateProfile(updates: ProfileUpdates): Promise<void>
  resetPassword(email: string): Promise<void>
  enrollMFA(): Promise<MFAEnrollment>
  verifyMFA(code: string, challengeId: string): Promise<void>
}
```

#### Session Management
```typescript
// lib/auth/session.ts
export interface SessionManager {
  getSession(): Promise<Session | null>
  refreshSession(): Promise<Session | null>
  onAuthStateChange(callback: (event: AuthEvent, session: Session | null) => void): void
  getAssuranceLevel(): Promise<{ currentLevel: AAL, nextLevel: AAL }>
}
```

### Data Access Layer

#### Repository Pattern Implementation
```typescript
// lib/repositories/base.ts
export abstract class BaseRepository<T> {
  constructor(protected supabase: SupabaseClient) {}
  
  abstract create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>
  abstract findById(id: string): Promise<T | null>
  abstract update(id: string, data: Partial<T>): Promise<T>
  abstract delete(id: string): Promise<void>
  abstract findByUserId(userId: string): Promise<T[]>
}
```

#### Specific Repository Implementations
```typescript
// lib/repositories/board.ts
export class BoardRepository extends BaseRepository<Board> {
  async create(data: CreateBoardData): Promise<Board> {
    const { data: board, error } = await this.supabase
      .from('boards')
      .insert(data)
      .select()
      .single()
    
    if (error) throw new DatabaseError(error.message)
    return board
  }
  
  async findWithColumns(boardId: string): Promise<BoardWithColumns> {
    const { data, error } = await this.supabase
      .from('boards')
      .select(`
        *,
        columns (
          *,
          job_applications (*)
        )
      `)
      .eq('id', boardId)
      .single()
    
    if (error) throw new DatabaseError(error.message)
    return data
  }
}
```

## Data Models

### User Profile Model
```typescript
export interface UserProfile {
  id: string // UUID from auth.users
  name: string | null
  email: string
  profilePictureData: string | null
  profilePictureUpdatedAt: string | null
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  notifications: NotificationSettings
  twoFactorEnabled: boolean
  twoFactorBackupCodes: string[]
  authProviders: AuthProvider[]
  createdAt: string
  updatedAt: string
}
```

### Board Model
```typescript
export interface Board {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithApplications[]
}
```

### Column Model
```typescript
export interface Column {
  id: string
  name: string
  boardId: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface ColumnWithApplications extends Column {
  jobApplications: JobApplication[]
}
```

### Job Application Model
```typescript
export interface JobApplication {
  id: string
  company: string
  position: string
  location: string | null
  status: string | null
  columnId: string
  boardId: string
  userId: string
  orderIndex: number
  notes: string | null
  salary: string | null
  jobUrl: string | null
  appliedDate: string | null
  tags: string[]
  description: string | null
  createdAt: string
  updatedAt: string
}
```

### Migration Data Models
```typescript
export interface MigrationRecord {
  id: string
  type: 'user' | 'board' | 'column' | 'job_application'
  mongoId: string
  supabaseId: string
  status: 'pending' | 'completed' | 'failed'
  error: string | null
  migratedAt: string
}

export interface MigrationSummary {
  totalRecords: number
  migratedRecords: number
  failedRecords: number
  errors: MigrationError[]
  startTime: string
  endTime: string | null
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Migration Data Preservation
*For any* MongoDB document (user, board, column, or job application), migrating it to Supabase should preserve all field values, relationships, and metadata without data loss
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3**

### Property 2: Migration Referential Integrity
*For any* set of related MongoDB documents, migrating them to Supabase should maintain all foreign key relationships and referential constraints
**Validates: Requirements 1.2, 1.5, 7.4**

### Property 3: Data Type Conversion Accuracy
*For any* MongoDB data type (ObjectId, Date, Array), converting it to the equivalent PostgreSQL type should preserve the data's semantic meaning and precision
**Validates: Requirements 1.5, 1.6, 1.7**

### Property 4: Authentication Round Trip
*For any* valid email/password combination, signing up then signing in should result in successful authentication with the same user identity
**Validates: Requirements 2.1, 2.2**

### Property 5: Session Management Consistency
*For any* authenticated user, session operations (create, refresh, terminate) should maintain consistent authentication state without conflicts
**Validates: Requirements 2.4, 2.5, 8.1, 8.2, 8.3, 8.4**

### Property 6: Authentication Error Handling
*For any* invalid authentication attempt, the system should return appropriate error messages without exposing sensitive information
**Validates: Requirements 2.6, 5.4**

### Property 7: 2FA Enrollment and Verification
*For any* user enabling 2FA, the TOTP secret generation, backup code creation, and verification process should work correctly and securely
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: 2FA Backup Code Consumption
*For any* valid backup code, using it for authentication should succeed once and then invalidate the code for future use
**Validates: Requirements 4.4**

### Property 9: 2FA Cleanup on Disable
*For any* user with 2FA enabled, disabling 2FA should remove all related authentication factors and backup codes
**Validates: Requirements 4.5**

### Property 10: Password Reset Flow
*For any* valid user account, the password reset process should generate secure tokens, allow password changes, and invalidate existing sessions
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 11: Password Reset Rate Limiting
*For any* user account, multiple password reset requests should be rate limited to prevent abuse
**Validates: Requirements 5.5**

### Property 12: Profile Update Persistence
*For any* user profile change, the update should be stored correctly in Supabase user metadata and be retrievable
**Validates: Requirements 6.4, 10.4**

### Property 13: Database CRUD Operations
*For any* entity type (board, column, job application), all CRUD operations should work correctly using Supabase client methods with proper joins and filtering
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 14: Migration Script Completeness
*For any* MongoDB database, the migration script should export all data, create the target schema, import all records, and provide a comprehensive migration report
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 15: Feature Parity Validation
*For any* core job tracking operation (board creation, column management, job application CRUD, search/filter), the post-migration system should behave identically to the pre-migration system
**Validates: Requirements 12.1, 12.2, 12.4**

## Error Handling

### Authentication Errors
- **Invalid Credentials**: Return clear error messages without exposing user existence
- **Session Expiration**: Gracefully prompt for reauthentication with context preservation
- **OAuth Failures**: Provide fallback options and clear error messaging
- **2FA Errors**: Handle invalid codes, expired challenges, and backup code issues
- **Rate Limiting**: Implement progressive delays for repeated failed attempts

### Database Errors
- **Connection Failures**: Implement retry logic with exponential backoff
- **Constraint Violations**: Provide meaningful error messages for referential integrity issues
- **Query Timeouts**: Handle long-running queries gracefully
- **Transaction Failures**: Ensure atomic operations with proper rollback

### Migration Errors
- **Data Validation Failures**: Log detailed errors and continue processing other records
- **Schema Conflicts**: Handle existing data conflicts during migration
- **Network Interruptions**: Implement resumable migration with checkpoints
- **Memory Limitations**: Process large datasets in batches

### Error Recovery Strategies
```typescript
// lib/errors/recovery.ts
export class ErrorRecoveryService {
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    // Exponential backoff implementation
  }
  
  async handleMigrationError(
    error: MigrationError,
    context: MigrationContext
  ): Promise<void> {
    // Log error, update status, continue processing
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples and edge cases
- Integration points between components
- Error conditions and boundary cases
- UI component behavior with mocked dependencies

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Data integrity and consistency across operations
- Migration accuracy and completeness

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing
**Test Configuration**: Minimum 100 iterations per property test
**Tagging Format**: Each property test must reference its design document property

Example property test structure:
```typescript
// tests/properties/migration.test.ts
import fc from 'fast-check'

describe('Migration Properties', () => {
  test('Property 1: Migration Data Preservation', async () => {
    // Feature: nextjs-supabase-migration, Property 1: Migration Data Preservation
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.string(),
        email: fc.emailAddress(),
        theme: fc.constantFrom('light', 'dark', 'system'),
        // ... other user fields
      }),
      async (userData) => {
        const migrated = await migrationService.migrateUser(userData)
        expect(migrated.name).toBe(userData.name)
        expect(migrated.email).toBe(userData.email)
        expect(migrated.theme).toBe(userData.theme)
        // ... verify all fields preserved
      }
    ), { numRuns: 100 })
  })
})
```

### Test Categories

**Migration Tests**:
- Data export accuracy from MongoDB
- Schema creation in Supabase
- Data import with type conversion
- Referential integrity preservation
- Migration reporting and error handling

**Authentication Tests**:
- Email/password signup and signin flows
- Session management and expiration
- 2FA enrollment, verification, and backup codes
- Password reset functionality
- Error handling for invalid credentials

**Database Operation Tests**:
- CRUD operations for all entity types
- Query performance with joins
- Data filtering and sorting
- Concurrent operation handling
- Transaction integrity

**Integration Tests**:
- End-to-end user workflows
- Cross-component data flow
- Real-time updates and synchronization
- Error propagation and recovery

### Test Data Management

**Test Database Setup**:
- Use Supabase local development environment
- Seed test data with realistic relationships
- Clean up test data between test runs
- Use database transactions for test isolation

**Mock Strategy**:
- Mock external OAuth providers for unit tests
- Use real Supabase instance for integration tests
- Mock network calls for offline testing
- Stub time-dependent operations for consistency
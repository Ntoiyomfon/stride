export interface UserProfile {
  id: string // UUID from auth.users
  name: string | null
  email: string
  profilePictureData: string | null
  profilePictureUpdatedAt: string | null
  theme: 'light' | 'dark' | 'system'
  accentColor: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
  notifications: NotificationSettings
  twoFactorEnabled: boolean
  twoFactorBackupCodes: string[]
  authProviders: AuthProvider[]
  createdAt: string
  updatedAt: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  weeklySummary: boolean
  defaultBoardView: string
}

export interface AuthProvider {
  provider: 'google' | 'github' | 'email'
  providerUserId: string
  connectedAt: string
}

export interface CreateUserProfileData {
  id: string
  name?: string
  email: string
  theme?: 'light' | 'dark' | 'system'
  accentColor?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
  notifications?: Partial<NotificationSettings>
}

export interface UpdateUserProfileData {
  name?: string
  profilePictureData?: string
  profilePictureUpdatedAt?: string
  theme?: 'light' | 'dark' | 'system'
  accentColor?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink'
  notifications?: Partial<NotificationSettings>
  twoFactorEnabled?: boolean
  twoFactorBackupCodes?: string[]
  authProviders?: AuthProvider[]
}
export interface Board {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateBoardData {
  name: string
  user_id: string
}

export interface UpdateBoardData {
  name?: string
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithApplications[]
}

// Forward declaration - will be defined in column.ts
export interface ColumnWithApplications {
  id: string
  name: string
  board_id: string
  order_index: number
  job_applications: any[] // Will be properly typed in job-application.ts
  created_at: string
  updated_at: string
}
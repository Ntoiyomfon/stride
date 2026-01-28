export interface Column {
  id: string
  name: string
  board_id: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateColumnData {
  name: string
  board_id: string
  order_index: number
}

export interface UpdateColumnData {
  name?: string
  order_index?: number
}

export interface ColumnWithApplications extends Column {
  job_applications: JobApplication[]
}

// Forward declaration - will be defined in job-application.ts
export interface JobApplication {
  id: string
  company: string
  position: string
  location: string | null
  status: string | null
  column_id: string
  board_id: string
  user_id: string
  order_index: number
  notes: string | null
  salary: string | null
  job_url: string | null
  applied_date: string | null
  tags: string[]
  description: string | null
  created_at: string
  updated_at: string
}
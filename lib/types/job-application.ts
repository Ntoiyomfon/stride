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

export interface CreateJobApplicationData {
  company: string
  position: string
  location?: string
  status?: string
  column_id: string
  board_id: string
  user_id: string
  order_index: number
  notes?: string
  salary?: string
  job_url?: string
  applied_date?: string
  tags?: string[]
  description?: string
}

export interface UpdateJobApplicationData {
  company?: string
  position?: string
  location?: string
  status?: string
  column_id?: string
  order_index?: number
  notes?: string
  salary?: string
  job_url?: string
  applied_date?: string
  tags?: string[]
  description?: string
}
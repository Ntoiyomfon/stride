"use server";

import { revalidatePath } from "next/cache";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/utils";

interface JobApplicationData {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  columnId: string;
  boardId: string;
  tags?: string[];
  description?: string;
}

export async function createJobApplication(data: JobApplicationData) {
  const sessionResult = await AuthService.validateServerSession();

  if (!sessionResult.user) {
    return { error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description,
  } = data;

  if (!company || !position || !columnId || !boardId) {
    return { error: "Missing required fields" };
  }

  // Verify board ownership
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('user_id', sessionResult.user.id)
    .single();

  if (boardError || !board) {
    return { error: "Board not found" };
  }

  // Verify column belongs to board
  const { data: column, error: columnError } = await supabase
    .from('columns')
    .select('id')
    .eq('id', columnId)
    .eq('board_id', boardId)
    .single();

  if (columnError || !column) {
    return { error: "Column not found" };
  }

  // Get max order for new job application
  const { data: maxOrderResult } = await supabase
    .from('job_applications')
    .select('order_index')
    .eq('column_id', columnId)
    .order('order_index', { ascending: false })
    .limit(1);

  const maxOrder = (maxOrderResult as any)?.[0]?.order_index || 0;

  const { data: jobApplication, error } = await (supabase
    .from('job_applications')
    .insert({
      company,
      position,
      location,
      notes,
      salary,
      job_url: jobUrl,
      column_id: columnId,
      board_id: boardId,
      user_id: sessionResult.user.id,
      tags: tags || [],
      description,
      status: 'applied',
      order_index: maxOrder + 1,
    } as any)
    .select()
    .single() as any);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");

  return { data: jobApplication };
}

export async function updateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  }
) {
  const sessionResult = await AuthService.validateServerSession();

  if (!sessionResult.user) {
    return { error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  // Get current job application
  const { data: jobApplication, error: fetchError } = await supabase
    .from('job_applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', sessionResult.user.id)
    .single();

  if (fetchError || !jobApplication) {
    return { error: "Job application not found" };
  }

  const { columnId, order, jobUrl, ...otherUpdates } = updates;

  const updatesToApply: any = {
    ...otherUpdates,
    updated_at: new Date().toISOString()
  };

  if (jobUrl !== undefined) {
    updatesToApply.job_url = jobUrl;
  }

  const currentColumnId = (jobApplication as any).column_id;
  const newColumnId = columnId;

  const isMovingToDifferentColumn = newColumnId && newColumnId !== currentColumnId;

  if (isMovingToDifferentColumn) {
    // Handle column change
    updatesToApply.column_id = newColumnId;
    
    // Get max order in target column
    const { data: maxOrderResult } = await supabase
      .from('job_applications')
      .select('order_index')
      .eq('column_id', newColumnId)
      .order('order_index', { ascending: false })
      .limit(1);

    const maxOrder = (maxOrderResult as any)?.[0]?.order_index || 0;
    updatesToApply.order_index = order !== undefined ? order : maxOrder + 1;
  } else if (order !== undefined) {
    updatesToApply.order_index = order;
  }

  const { data: updated, error } = await ((supabase as any)
    .from('job_applications')
    .update(updatesToApply)
    .eq('id', id)
    .select()
    .single());

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");

  return { data: updated };
}

export async function deleteJobApplication(id: string) {
  const sessionResult = await AuthService.validateServerSession();

  if (!sessionResult.user) {
    return { error: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  // Verify ownership and delete
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', sessionResult.user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");

  return { success: true };
}
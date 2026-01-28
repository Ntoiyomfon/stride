"use server";

import { AuthService } from "@/lib/auth/supabase-auth-service";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/utils";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";

interface UpdateProfileData {
  name?: string;
  email?: string;
  profilePictureData?: string | null;
}

interface UpdatePreferencesData {
  theme?: 'light' | 'dark' | 'system';
  accentColor?: 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'pink';
  notifications?: {
    emailNotifications?: boolean;
    weeklySummary?: boolean;
    defaultBoardView?: 'kanban' | 'list';
  };
}

export async function getUser() {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', sessionResult.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

export async function updateProfile(data: UpdateProfileData) {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createSupabaseServerClient();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.profilePictureData !== undefined) {
      updateData.profile_picture_data = data.profilePictureData;
      updateData.profile_picture_updated_at = data.profilePictureData ? new Date().toISOString() : null;
    }

    const { error } = await ((supabase as any)
      .from('user_profiles')
      .update(updateData)
      .eq('id', sessionResult.user.id));

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updatePreferences(data: UpdatePreferencesData) {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createSupabaseServerClient();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.accentColor !== undefined) updateData.accent_color = data.accentColor;
    if (data.notifications !== undefined) {
      // Get current notifications and merge
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('notifications')
        .eq('id', sessionResult.user.id)
        .single();

      const currentNotifications = ((currentProfile as any)?.notifications as any) || {};
      updateData.notifications = {
        ...currentNotifications,
        ...data.notifications
      };
    }

    const { error } = await ((supabase as any)
      .from('user_profiles')
      .update(updateData)
      .eq('id', sessionResult.user.id));

    if (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error in updatePreferences:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function updateProfilePicture(imageData: string) {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        profile_picture_data: imageData,
        profile_picture_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', sessionResult.user.id);

    if (error) {
      console.error('Error updating profile picture:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error in updateProfilePicture:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return { success: false, error: "Not authenticated" };
    }

    // First verify current password by attempting to sign in
    const authService = new AuthService();
    const signInResult = await authService.signIn({
      email: sessionResult.user.email!,
      password: currentPassword
    });

    if (!signInResult.success) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    const updateResult = await authService.updatePassword(newPassword);
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error?.message || "Failed to update password" };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in changePassword:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function deleteAccount() {
  try {
    const sessionResult = await AuthService.validateServerSession();
    if (!sessionResult.user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createSupabaseServerClient();
    const userId = sessionResult.user.id;
    
    console.log('Starting account deletion for user:', userId);
    
    // Delete in the correct order to avoid foreign key constraint violations
    // 1. Delete job applications first
    const { error: jobAppsError } = await supabase
      .from('job_applications')
      .delete()
      .eq('user_id', userId);

    if (jobAppsError) {
      console.error('Error deleting job applications:', jobAppsError);
      return { success: false, error: `Failed to delete job applications: ${jobAppsError.message}` };
    }
    console.log('✅ Job applications deleted');

    // 2. Delete columns (should cascade from boards, but let's be explicit)
    // First get the board IDs for this user
    const { data: userBoards } = await supabase
      .from('boards')
      .select('id')
      .eq('user_id', userId);

    if (userBoards && userBoards.length > 0) {
      const boardIds = userBoards.map((board: any) => board.id);
      const { error: columnsError } = await supabase
        .from('columns')
        .delete()
        .in('board_id', boardIds);

      if (columnsError) {
        console.error('Error deleting columns:', columnsError);
        return { success: false, error: `Failed to delete columns: ${columnsError.message}` };
      }
      console.log('✅ Columns deleted');
    }

    // 3. Delete boards
    const { error: boardsError } = await supabase
      .from('boards')
      .delete()
      .eq('user_id', userId);

    if (boardsError) {
      console.error('Error deleting boards:', boardsError);
      return { success: false, error: `Failed to delete boards: ${boardsError.message}` };
    }
    console.log('✅ Boards deleted');

    // 4. Delete sessions
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError);
      return { success: false, error: `Failed to delete sessions: ${sessionsError.message}` };
    }
    console.log('✅ Sessions deleted');

    // 5. Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return { success: false, error: `Failed to delete user profile: ${profileError.message}` };
    }
    console.log('✅ User profile deleted');

    // 6. Delete the user from Supabase Auth using admin API
    try {
      const supabaseAdmin = await createSupabaseServiceClient();
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        console.error('Error deleting user from auth:', authDeleteError);
        // Don't fail the operation if auth deletion fails, profile is already deleted
        console.log('⚠️ Auth user deletion failed, but continuing with sign out');
      } else {
        console.log('✅ Auth user deleted');
      }
    } catch (adminError) {
      console.error('Error with admin deletion:', adminError);
      // Continue with sign out even if admin deletion fails
      console.log('⚠️ Auth user deletion failed, but continuing with sign out');
    }

    // 7. Sign out the user
    const authService = new AuthService();
    await authService.signOut();
    console.log('✅ User signed out');

    console.log('🎉 Account deletion completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
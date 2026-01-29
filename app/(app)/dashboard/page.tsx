import KanbanBoard from "@/components/kanban-board";
import { AuthService } from "@/lib/auth/supabase-auth-service";
import { createSupabaseServerClient } from "@/lib/supabase/utils";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/actions/user";
import { AccentColorSync } from "@/components/accent-color-sync";
import { PageLoader } from "@/components/loading-spinner";
import { BoardInitializer } from "@/components/board-initializer";

async function getBoard(userId: string) {
  console.log('🔍 Fetching board for user:', userId);

  try {
    const supabase = await createSupabaseServerClient();

    // First, let's try to get the user to make sure auth is working
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Auth user check:', { user: user?.id, userError });

    const { data: board, error } = await supabase
      .from('boards')
      .select(`
        *,
        columns (
          *,
          job_applications (*)
        )
      `)
      .eq('user_id', userId)
      .eq('name', 'Job Hunt')
      .single();

    console.log('📊 Board query result:', { board, error });

    if (error) {
      console.error('❌ Board query error:', error);
      
      // If board doesn't exist, create it automatically
      if (error.code === 'PGRST116') { // No rows found
        console.log('🔧 Board not found, creating automatically...');
        
        try {
          const { initializeUserBoard } = await import('@/lib/init-user-board');
          const newBoard = await initializeUserBoard(userId);
          
          if (newBoard) {
            console.log('✅ Board created successfully, fetching with columns...');
            
            // Fetch the newly created board with columns
            const { createSupabaseServiceClient } = await import('@/lib/supabase/utils');
            const serviceSupabase = await createSupabaseServiceClient();
            
            const { data: fullBoard, error: fetchError } = await serviceSupabase
              .from('boards')
              .select(`
                *,
                columns (
                  *,
                  job_applications (*)
                )
              `)
              .eq('user_id', userId)
              .eq('name', 'Job Hunt')
              .single();
              
            if (fetchError) {
              console.error('❌ Error fetching newly created board:', fetchError);
              return null;
            }
            
            return fullBoard;
          }
        } catch (initError) {
          console.error('❌ Error initializing board:', initError);
        }
      }
      
      // If RLS is blocking, try using service role as fallback
      console.log('🔧 Trying service role fallback...');
      const { createSupabaseServiceClient } = await import('@/lib/supabase/utils');
      const serviceSupabase = await createSupabaseServiceClient();
      
      const { data: fallbackBoard, error: fallbackError } = await serviceSupabase
        .from('boards')
        .select(`
          *,
          columns (
            *,
            job_applications (*)
          )
        `)
        .eq('user_id', userId)
        .eq('name', 'Job Hunt')
        .single();

      console.log('🔧 Service role query result:', { fallbackBoard, fallbackError });
      
      if (fallbackError) {
        console.error('❌ Service role query also failed:', fallbackError);
        return null;
      }
      
      return fallbackBoard;
    }

    console.log('✅ Board found with columns:', (board as any)?.columns?.length || 0);
    return board;
  } catch (err) {
    console.error('❌ Exception in getBoard:', err);
    return null;
  }
}

// Client component for animations
function DashboardContent({ board, userId, user }: { board: any; userId: string; user: any }) {
  return (
    <div className="min-h-screen bg-background">
      <AccentColorSync user={user} />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Job Hunt</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        
        {board ? (
          <KanbanBoard board={board} user_id={userId} />
        ) : (
          <BoardInitializer />
        )}
      </div>
    </div>
  );
}

async function DashboardPage() {
  // CRITICAL: Check authentication FIRST before any data fetching
  const sessionResult = await AuthService.validateServerSession();

  if (!sessionResult.user) {
    redirect("/sign-in");
  }

  // Verify user still exists in database (in case account was deleted)
  const user = await getUser();
  if (!user) {
    // User was deleted, redirect to sign-in
    redirect("/sign-in");
  }

  // Only fetch board data after confirming user is authenticated and exists
  const board = await getBoard(sessionResult.user.id);

  return <DashboardContent board={board} userId={sessionResult.user.id} user={user} />;
}

export default async function Dashboard() {
  return (
    <Suspense fallback={<PageLoader text="Loading your dashboard..." />}>
      <DashboardPage />
    </Suspense>
  );
}
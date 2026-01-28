import { createSupabaseServerClient } from "./supabase/utils";

const DEFAULT_COLUMNS = [
  {
    name: "Wish List",
    order_index: 0,
  },
  { name: "Applied", order_index: 1 },
  { name: "Interviewing", order_index: 2 },
  { name: "Offer", order_index: 3 },
  { name: "Rejected", order_index: 4 },
];

export async function initializeUserBoard(userId: string) {
  try {
    // Use service role client to bypass RLS policies during initial setup
    const { createSupabaseServiceClient } = await import("./supabase/utils");
    const supabase = await createSupabaseServiceClient();
    
    console.log('🔍 Checking for existing board for user:', userId);
    
    // Check if board already exists
    const { data: existingBoard, error: boardCheckError } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .eq('name', 'Job Hunt')
      .single();

    if (boardCheckError && boardCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no board exists
      console.error('❌ Error checking for existing board:', boardCheckError);
      throw boardCheckError;
    }

    if (existingBoard) {
      console.log('✅ Board already exists for user:', userId);
      return existingBoard;
    }

    console.log('📝 Creating new board for user:', userId);

    // Create the board
    const { data: board, error: boardError } = await (supabase as any)
      .from('boards')
      .insert({
        name: 'Job Hunt',
        user_id: userId
      })
      .select()
      .single();

    if (boardError) {
      console.error('❌ Error creating board:', boardError);
      throw boardError;
    }

    console.log('✅ Board created:', board);

    // Create default columns
    const columnsToInsert = DEFAULT_COLUMNS.map(col => ({
      name: col.name,
      order_index: col.order_index,
      board_id: board.id
    }));

    console.log('📝 Creating columns for board:', board.id);

    const { data: columns, error: columnsError } = await (supabase as any)
      .from('columns')
      .insert(columnsToInsert)
      .select();

    if (columnsError) {
      console.error('❌ Error creating columns:', columnsError);
      throw columnsError;
    }

    console.log(`✅ Initialized board "${board.name}" with ${columns?.length || 0} columns for user ${userId}`);

    return board;
  } catch (err) {
    console.error('❌ Error initializing user board:', err);
    throw err;
  }
}
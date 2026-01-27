import connectDB from "@/lib/db";

/**
 * Clean up duplicate sessions for users
 * Keeps only the most recent session per user per device/IP
 */
export async function deduplicateSessions() {
  try {
    await connectDB();
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;

    if (!db) {
      console.error('Database connection not available for session deduplication');
      return;
    }

    // Get all active sessions grouped by user
    const activeSessions = await db.collection("session").find({
      expiresAt: { $gt: new Date() }
    }).toArray();

    // Group sessions by user
    const sessionsByUser = activeSessions.reduce((acc, session) => {
      const userId = session.userId.toString();
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    let totalCleaned = 0;

    // Process each user's sessions
    for (const [userId, userSessions] of Object.entries(sessionsByUser)) {
      if (userSessions.length <= 1) {
        continue; // No duplicates to clean
      }

      console.log(`User ${userId} has ${userSessions.length} active sessions`);

      // Group by device/IP to identify same-device sessions
      const sessionsByDevice = userSessions.reduce((acc, session) => {
        const deviceKey = `${session.userAgent || 'unknown'}_${session.ipAddress || 'unknown'}`;
        if (!acc[deviceKey]) {
          acc[deviceKey] = [];
        }
        acc[deviceKey].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      // For each device, keep only the most recent session
      for (const [deviceKey, deviceSessions] of Object.entries(sessionsByDevice)) {
        const sessions = deviceSessions as any[];
        if (sessions.length <= 1) {
          continue;
        }

        // Sort by creation date (most recent first)
        const sortedSessions = sessions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Keep the most recent, delete the rest
        const sessionsToDelete = sortedSessions.slice(1);
        
        for (const sessionToDelete of sessionsToDelete) {
          await db.collection("session").deleteOne({ _id: sessionToDelete._id });
          console.log(`Deleted duplicate session ${sessionToDelete._id} for user ${userId} on device ${deviceKey}`);
          totalCleaned++;
        }
      }

      // Also ensure no user has more than 2 total sessions (across all devices)
      const remainingSessions = await db.collection("session").find({
        userId: userSessions[0].userId,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 }).toArray();

      if (remainingSessions.length > 2) {
        const excessSessions = remainingSessions.slice(2);
        for (const excessSession of excessSessions) {
          await db.collection("session").deleteOne({ _id: excessSession._id });
          console.log(`Deleted excess session ${excessSession._id} for user ${userId}`);
          totalCleaned++;
        }
      }
    }

    if (totalCleaned > 0) {
      console.log(`Session deduplication completed: cleaned up ${totalCleaned} duplicate sessions`);
    }

    return { success: true, cleaned: totalCleaned };
  } catch (error) {
    console.error('Session deduplication error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clean up sessions for a specific user, keeping only the most recent per device
 */
export async function cleanupUserSessions(userId: string) {
  try {
    await connectDB();
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;

    if (!db) {
      console.error('Database connection not available');
      return { success: false, error: "Database connection failed" };
    }

    const { ObjectId } = await import("mongodb");
    
    // Get all active sessions for this user
    const userSessions = await db.collection("session").find({
      userId: new ObjectId(userId),
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).toArray();

    if (userSessions.length <= 1) {
      return { success: true, cleaned: 0 }; // No cleanup needed
    }

    console.log(`User ${userId} has ${userSessions.length} active sessions - cleaning up duplicates`);

    // Group by device/IP combination for more aggressive deduplication
    const sessionsByDevice = userSessions.reduce((acc, session) => {
      // Create a more specific device fingerprint
      const deviceKey = `${session.userAgent || 'unknown'}_${session.ipAddress || 'unknown'}`;
      if (!acc[deviceKey]) {
        acc[deviceKey] = [];
      }
      acc[deviceKey].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    let cleaned = 0;

    // For each device, keep only the most recent session
    for (const [deviceKey, deviceSessions] of Object.entries(sessionsByDevice)) {
      if (deviceSessions.length <= 1) continue;

      // Sort by creation date (most recent first) and keep only the first one
      const sortedSessions = deviceSessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const sessionsToDelete = sortedSessions.slice(1); // Delete all but the most recent
      
      for (const sessionToDelete of sessionsToDelete) {
        await db.collection("session").deleteOne({ _id: sessionToDelete._id });
        console.log(`Deleted duplicate session ${sessionToDelete._id} for user ${userId} on device ${deviceKey}`);
        cleaned++;
      }
    }

    // Also ensure no user has more than 2 total sessions (across all devices)
    // This is a hard limit to prevent session proliferation
    const remainingSessions = await db.collection("session").find({
      userId: new ObjectId(userId),
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).toArray();

    if (remainingSessions.length > 2) {
      const excessSessions = remainingSessions.slice(2); // Keep only 2 most recent
      for (const excessSession of excessSessions) {
        await db.collection("session").deleteOne({ _id: excessSession._id });
        console.log(`Deleted excess session ${excessSession._id} for user ${userId} (hard limit)`);
        cleaned++;
      }
    }

    console.log(`Cleaned up ${cleaned} sessions for user ${userId}`);
    return { success: true, cleaned };
  } catch (error) {
    console.error('User session cleanup error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
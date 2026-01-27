import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting cleanup of orphaned data...");
    
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;

    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get all existing user IDs
    const existingUsers = await User.find({}).select("_id email").lean();
    const existingUserIds = existingUsers.map(u => u._id.toString());
    const existingEmails = existingUsers.map(u => u.email);
    
    console.log(`Found ${existingUserIds.length} existing users`);

    const results = {
      accounts: 0,
      accountsPlural: 0,
      sessions: 0,
      verifications: 0,
      twoFactor: 0,
      backupCodes: 0,
      passkeys: 0,
      trustedDevices: 0,
      rateLimits: 0
    };

    // Clean up accounts collection (both singular and plural)
    const orphanedAccounts1 = await db.collection("account").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.accounts = orphanedAccounts1.deletedCount;
    console.log(`Deleted ${orphanedAccounts1.deletedCount} orphaned accounts (singular)`);

    const orphanedAccounts2 = await db.collection("accounts").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.accountsPlural = orphanedAccounts2.deletedCount;
    console.log(`Deleted ${orphanedAccounts2.deletedCount} orphaned accounts (plural)`);

    // Clean up sessions
    const orphanedSessions = await db.collection("session").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.sessions = orphanedSessions.deletedCount;
    console.log(`Deleted ${orphanedSessions.deletedCount} orphaned sessions`);

    // Clean up verification records - these are trickier since they don't always have userId
    // We'll clean up old verification records (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldVerifications = await db.collection("verification").deleteMany({
      createdAt: { $lt: oneDayAgo }
    });
    results.verifications = oldVerifications.deletedCount;
    console.log(`Deleted ${oldVerifications.deletedCount} old verification records`);

    // Clean up other Better Auth collections
    const orphanedTwoFactor = await db.collection("twoFactor").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.twoFactor = orphanedTwoFactor.deletedCount;
    console.log(`Deleted ${orphanedTwoFactor.deletedCount} orphaned two-factor records`);

    const orphanedBackupCodes = await db.collection("backupCode").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.backupCodes = orphanedBackupCodes.deletedCount;
    console.log(`Deleted ${orphanedBackupCodes.deletedCount} orphaned backup codes`);

    const orphanedPasskeys = await db.collection("passkey").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.passkeys = orphanedPasskeys.deletedCount;
    console.log(`Deleted ${orphanedPasskeys.deletedCount} orphaned passkey records`);

    const orphanedTrustedDevices = await db.collection("trustedDevice").deleteMany({
      userId: { $nin: existingUserIds }
    });
    results.trustedDevices = orphanedTrustedDevices.deletedCount;
    console.log(`Deleted ${orphanedTrustedDevices.deletedCount} orphaned trusted device records`);

    // Clean up rate limit records
    const orphanedRateLimits = await db.collection("rateLimit").deleteMany({
      $and: [
        { userId: { $nin: existingUserIds } },
        { identifier: { $nin: existingEmails } }
      ]
    });
    results.rateLimits = orphanedRateLimits.deletedCount;
    console.log(`Deleted ${orphanedRateLimits.deletedCount} orphaned rate limit records`);

    console.log("Cleanup completed successfully!");
    
    return NextResponse.json({ 
      success: true, 
      message: "Cleanup completed successfully",
      results 
    });
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json({ 
      error: "Cleanup failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
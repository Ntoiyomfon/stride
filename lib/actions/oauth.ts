"use server";

import connectDB from "@/lib/db";
import User from "@/lib/models/user";
import { getSession } from "@/lib/auth/auth";
import { ObjectId } from "mongodb";

export async function getConnectedProviders() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }
    
    await connectDB();
    
    // Get user's auth providers from our custom field
    const user = await User.findById(session.user.id).select('authProviders email');
    
    if (!user) {
      return { error: "User not found" };
    }
    
    // Also get OAuth accounts from BetterAuth's account collection
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;
    
    if (!db) {
      console.error('Database connection not available');
      return { error: "Database connection failed" };
    }
    
    // Query accounts using ObjectId (BetterAuth stores userId as ObjectId)
    const { ObjectId } = await import("mongodb");
    const oauthAccounts = await db.collection("account").find({ 
      userId: new ObjectId(session.user.id)
    }).toArray();
    
    // Combine providers from both sources
    const providers: Array<{ provider: string; connectedAt: Date }> = [];
    
    // Add OAuth providers from BetterAuth accounts first (most reliable source)
    oauthAccounts.forEach(account => {
      if (account.providerId && account.providerId !== 'credential') {
        providers.push({
          provider: account.providerId,
          connectedAt: account.createdAt || new Date()
        });
      }
    });
    
    // Add email provider if user has email and password (credential account exists)
    const credentialAccount = oauthAccounts.find(acc => acc.providerId === 'credential');
    if (user.email && credentialAccount) {
      providers.push({
        provider: 'email',
        connectedAt: user.createdAt || new Date()
      });
    }
    
    // Add providers from our custom authProviders field (fallback) - only if not already added
    if (user.authProviders) {
      user.authProviders.forEach((p: any) => {
        // Only add if not already in the list
        if (!providers.some(existing => existing.provider === p.provider)) {
          providers.push({
            provider: p.provider,
            connectedAt: p.connectedAt
          });
        }
      });
    }
    
    return { success: true, providers };
  } catch (error) {
    console.error('Get connected providers error:', error);
    return { error: "Failed to get connected providers" };
  }
}

/**
 * Disconnect OAuth provider from user account
 */
export async function disconnectProvider(provider: 'google' | 'github') {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }
    
    await connectDB();
    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;
    
    if (!db) {
      return { error: "Database connection failed" };
    }
    
    // Check how many auth methods the user has
    const { ObjectId } = await import("mongodb");
    const oauthAccounts = await db.collection("account").find({ 
      userId: new ObjectId(session.user.id)
    }).toArray();
    
    const user = await User.findById(session.user.id);
    const hasEmailAuth = user && user.email;
    
    // Count total auth methods
    const totalAuthMethods = oauthAccounts.length + (hasEmailAuth ? 1 : 0);
    
    if (totalAuthMethods <= 1) {
      return { error: "Cannot disconnect last authentication method" };
    }
    
    // Remove the OAuth account from BetterAuth
    const deleteResult = await db.collection("account").deleteMany({
      userId: new ObjectId(session.user.id),
      providerId: provider
    });
    
    // Also remove from our custom authProviders field
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { authProviders: { provider } }
    });
    
    console.log(`Disconnected ${provider} for user ${session.user.id}, deleted ${deleteResult.deletedCount} accounts`);
    
    return { success: true, message: `${provider} account disconnected` };
  } catch (error) {
    console.error('Disconnect provider error:', error);
    return { error: "Failed to disconnect provider" };
  }
}
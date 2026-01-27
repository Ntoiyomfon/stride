import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { initializeUserBoard } from "../init-user-board";
import connectDB from "../db";
import { ObjectId } from "mongodb";

const mongooseInstance = await connectDB();
const client = mongooseInstance.connection.getClient();
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    // Update session age on activity to extend existing sessions
    updateAge: 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: ["email", "profile"],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["user:email"],
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log('User created:', { userId: user.id, email: user.email });
          
          if (user.id) {
            await initializeUserBoard(user.id);
          }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          console.log('Account creation attempt:', { 
            provider: account.providerId, 
            accountId: account.accountId,
            userId: account.userId 
          });
        },
        after: async (account, context) => {
          console.log('Account created successfully:', { 
            accountId: account.id, 
            provider: account.providerId,
            userId: account.userId,
            accountIdFromProvider: account.accountId
          });
          
          // Add OAuth provider to user's authProviders array
          if (account.providerId !== 'credential' && account.userId) {
            try {
              // Try both _id and id fields since BetterAuth might use different field names
              const updateResult1 = await db.collection("user").updateOne(
                { _id: new ObjectId(account.userId) },
                {
                  $addToSet: {
                    authProviders: {
                      provider: account.providerId,
                      providerUserId: account.accountId,
                      connectedAt: new Date()
                    }
                  }
                }
              );
              
              const updateResult2 = await db.collection("user").updateOne(
                { id: account.userId },
                {
                  $addToSet: {
                    authProviders: {
                      provider: account.providerId,
                      providerUserId: account.accountId,
                      connectedAt: new Date()
                    }
                  }
                }
              );
              
              console.log(`Added ${account.providerId} provider to user ${account.userId}:`, {
                _idUpdate: updateResult1.modifiedCount,
                idUpdate: updateResult2.modifiedCount
              });
            } catch (error) {
              console.error('Failed to add OAuth provider:', error);
            }
          }
        },
      },
    },
    session: {
      create: {
        before: async (session, context) => {
          console.log('Session creation attempt:', { 
            sessionId: session.id, 
            userId: session.userId 
          });
          
          // Get request headers to identify the browser/device
          const userAgent = context?.headers?.get?.('user-agent') || '';
          const ipAddress = context?.headers?.get?.('x-forwarded-for') || 
                           context?.headers?.get?.('x-real-ip') || 
                           'unknown';
          
          // Immediately clean up ALL existing sessions for this user from the same device/IP
          // This prevents session proliferation by ensuring only one session per device
          const existingSessions = await db.collection("session").find({
            userId: session.userId,
            expiresAt: { $gt: new Date() }
          }).toArray();
          
          console.log(`Found ${existingSessions.length} existing sessions for user ${session.userId}`);
          
          if (existingSessions.length > 0) {
            // Delete ALL sessions from the same device/IP immediately
            const sameDeviceSessions = existingSessions.filter(s => 
              s.userAgent === userAgent || s.ipAddress === ipAddress
            );
            
            if (sameDeviceSessions.length > 0) {
              console.log(`Deleting ${sameDeviceSessions.length} sessions from same device/IP`);
              
              for (const oldSession of sameDeviceSessions) {
                await db.collection("session").deleteOne({ _id: oldSession._id });
                console.log(`Deleted duplicate session: ${oldSession._id}`);
              }
            }
            
            // Also limit total sessions per user to 3 (across all devices)
            const remainingSessions = await db.collection("session").find({
              userId: session.userId,
              expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 }).toArray();
            
            if (remainingSessions.length >= 3) {
              const sessionsToDelete = remainingSessions.slice(2); // Keep only 2 most recent
              
              for (const oldSession of sessionsToDelete) {
                await db.collection("session").deleteOne({ _id: oldSession._id });
                console.log(`Deleted excess session: ${oldSession._id}`);
              }
            }
          }
          
          // Store browser/device info in the session for future reference
          session.userAgent = userAgent;
          session.ipAddress = ipAddress;
        },
        after: async (session, context) => {
          console.log('Session created successfully:', { 
            sessionId: session.id, 
            userId: session.userId 
          });
          
          // Create session record for tracking
          try {
            const { createSessionRecord } = await import("../actions/session-management");
            await createSessionRecord(session.id, session.userId);
          } catch (error) {
            console.error('Failed to create session record:', error);
          }
        },
      },
      delete: {
        after: async (session) => {
          console.log('Session deleted:', { sessionId: session.id });
          
          // Clean up our custom session record
          try {
            const Session = (await import("../models/session")).default;
            await Session.deleteOne({ sessionId: session.id });
            console.log(`Cleaned up custom session record for ${session.id}`);
          } catch (error) {
            console.error('Failed to cleanup custom session record:', error);
          }
        },
      },
    },
  },
});

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  return result;
}

export async function signOut() {
  try {
    // Get current session before signing out
    const currentSession = await getSession();
    const userId = currentSession?.user?.id;
    
    // Sign out using BetterAuth
    const result = await auth.api.signOut({
      headers: await headers(),
    });

    // Clean up any remaining duplicate sessions for this user after signout
    if (userId && result.success) {
      try {
        const { cleanupUserSessions } = await import("../utils/session-deduplication");
        const cleanupResult = await cleanupUserSessions(userId);
        if (cleanupResult.success && cleanupResult.cleaned && cleanupResult.cleaned > 0) {
          console.log(`Post-logout cleanup: removed ${cleanupResult.cleaned} sessions for user ${userId}`);
        }
      } catch (error) {
        console.error('Post-logout session cleanup error:', error);
      }
    }

    if (result.success) {
      redirect("/sign-in");
    }
  } catch (error) {
    console.error('Sign out error:', error);
    redirect("/sign-in");
  }
}
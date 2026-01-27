"use server";

import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/user";
import { Board, Column, JobApplication } from "@/lib/models/index";
import Session from "@/lib/models/session";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import mongoose from "mongoose";

interface UpdateProfileData {
    name?: string;
    image?: string;
}

interface UpdatePreferencesData {
    emailNotifications?: boolean;
    weeklySummary?: boolean;
    defaultBoardView?: string;
    theme?: "light" | "dark" | "system";
    accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
}

export async function updateProfile(data: UpdateProfileData) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: data },
            { new: true }
        ).select("-password");

        revalidatePath("/settings");
        revalidatePath("/dashboard"); // To update avatar in navbar

        // Serialize to plain object
        return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
    } catch (error) {
        console.error("Failed to update profile:", error);
        return { error: "Failed to update profile" };
    }
}

export async function updateProfilePicture(base64: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        // Add timestamp for cache busting
        const timestamp = Date.now();
        const imageUrl = `/api/avatar/${session.user.id}?t=${timestamp}`;

        await User.findByIdAndUpdate(
            session.user.id,
            {
                $set: {
                    profilePictureData: base64,
                    image: imageUrl,
                    profilePictureUpdatedAt: new Date()
                }
            },
            { new: true }
        );

        revalidatePath("/settings");
        revalidatePath("/dashboard");

        return { success: true, imageUrl };
    } catch (error) {
        console.error("Failed to update profile picture:", error);
        return { error: "Failed to update profile picture" };
    }
}

export async function updatePreferences(data: UpdatePreferencesData) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        // Construct dot notation update to avoid overwriting the whole object
        const update: Record<string, any> = {};
        if (data.emailNotifications !== undefined) update["preferences.emailNotifications"] = data.emailNotifications;
        if (data.weeklySummary !== undefined) update["preferences.weeklySummary"] = data.weeklySummary;
        if (data.defaultBoardView !== undefined) update["preferences.defaultBoardView"] = data.defaultBoardView;
        if (data.theme !== undefined) update["preferences.theme"] = data.theme;
        if (data.accentColor !== undefined) update["preferences.accentColor"] = data.accentColor;

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $set: update },
            { new: true, lean: true } // Use lean() to get plain object
        ).select("-password");

        revalidatePath("/settings");
        
        // Return success without user data to avoid serialization issues
        // Client components will refetch user data through useUserPreferences hook
        return { success: true };
    } catch (error) {
        console.error("Failed to update preferences:", error);
        return { error: "Failed to update preferences" };
    }
}

export async function deleteAccount() {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    const mongooseInstance = await connectDB();
    const db = mongooseInstance.connection.db;

    try {
        console.log(`Starting account deletion for user: ${session.user.id}`);

        // 1. Delete all Job Applications owned by user
        const jobAppResult = await JobApplication.deleteMany({ userId: session.user.id });
        console.log(`Deleted ${jobAppResult.deletedCount} job applications`);

        // 2. Delete all Boards and their Columns owned by user
        const userBoards = await Board.find({ userId: session.user.id }).select("_id");
        const boardIds = userBoards.map(b => b._id);

        if (boardIds.length > 0) {
            const columnResult = await Column.deleteMany({ boardId: { $in: boardIds } });
            console.log(`Deleted ${columnResult.deletedCount} columns`);
        }

        const boardResult = await Board.deleteMany({ userId: session.user.id });
        console.log(`Deleted ${boardResult.deletedCount} boards`);

        // 3. Delete our custom session tracking records
        const sessionResult = await Session.deleteMany({ userId: session.user.id });
        console.log(`Deleted ${sessionResult.deletedCount} session tracking records`);

        // 4. Delete Better Auth internal collections (with error handling)
        if (db) {
            try {
                const betterAuthSessions = await db.collection("session").deleteMany({ userId: session.user.id });
                console.log(`Deleted ${betterAuthSessions.deletedCount} Better Auth sessions`);
                
                const betterAuthAccounts = await db.collection("account").deleteMany({ userId: session.user.id });
                console.log(`Deleted ${betterAuthAccounts.deletedCount} Better Auth accounts`);
            } catch (dbError) {
                console.error("Error deleting Better Auth collections:", dbError);
                // Continue with deletion even if this fails
            }
        }

        // 5. Delete User record (this should be last)
        const userResult = await User.findByIdAndDelete(session.user.id);
        console.log(`Deleted user record: ${userResult ? 'success' : 'failed'}`);

        console.log(`Account deletion completed for user: ${session.user.id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete account:", error);
        return { error: "Failed to delete account" };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await getSession();
    if (!session?.user) return { error: "Unauthorized" };

    await connectDB();

    try {
        const result = await auth.api.changePassword({
            body: {
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            },
            headers: await headers(),
        });

        // Better Auth returns user object on success
        if (result.user) {
            return { success: true };
        }

        return { error: "Failed to update password" };
    } catch (error: any) {
        console.error("Password change error:", error);
        
        // Handle common Better Auth error messages
        const errorMessage = error.message || error.toString();
        
        if (errorMessage.includes("Invalid password") || errorMessage.includes("incorrect")) {
            return { error: "Current password is incorrect" };
        }
        
        if (errorMessage.includes("weak") || errorMessage.includes("strength")) {
            return { error: "New password is too weak" };
        }
        
        if (errorMessage.includes("same") || errorMessage.includes("identical")) {
            return { error: "New password must be different from current password" };
        }
        
        return { error: "Failed to update password. Please try again." };
    }
}

export async function getUser() {
    const session = await getSession();
    if (!session?.user) return null;

    await connectDB();

    // Lean() for performance since we just need the data object
    const user = await User.findById(session.user.id).select("-password").lean();

    if (!user) return null;

    return JSON.parse(JSON.stringify(user));
}

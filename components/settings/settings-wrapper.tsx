"use client";

import { useState, useEffect, useCallback } from "react";
import { getUser } from "@/lib/actions/user";
import SettingsLayout from "./settings-layout";
import { UserThemeSync } from "@/components/user-theme-sync";
import { AccentColorSync } from "@/components/accent-color-sync";

interface User {
    id: string;
    name: string;
    email: string;
    profile_picture_data?: string;
    preferences?: {
        emailNotifications?: boolean;
        weeklySummary?: boolean;
        defaultBoardView?: string;
        theme?: "light" | "dark" | "system";
        accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
    };
}

interface SettingsWrapperProps {
    initialUser: User;
}

export default function SettingsWrapper({ initialUser }: SettingsWrapperProps) {
    const [user, setUser] = useState<User>(initialUser);
    const [loading, setLoading] = useState(false);

    // Listen for profile updates and refresh user data
    const handleProfileUpdate = useCallback(async () => {
        setLoading(true);
        try {
            const updatedUser = await getUser();
            if (updatedUser) {
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('profile-updated', handleProfileUpdate);
        
        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, [handleProfileUpdate]);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="p-8 text-center bg-card rounded-lg border">
                    <p className="text-foreground">Failed to load user profile.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <UserThemeSync user={user} />
            <AccentColorSync user={user} />
            <SettingsLayout user={user} />
            {loading && (
                <div className="fixed top-4 right-4 bg-background border rounded-lg p-2 shadow-lg">
                    <p className="text-sm text-muted-foreground">Refreshing profile...</p>
                </div>
            )}
        </>
    );
}
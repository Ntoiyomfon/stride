"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import SignOutButton from "./sign-out-btn";
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth";
import { FolderKanban } from 'lucide-react';
import SettingsPageBtn from "./settings-page-btn";
import { ThemeToggleButton } from "./theme-toggle-button";
import { useEffect, useCallback } from "react";
import { clearAvatarCache } from "@/lib/utils/avatar-cache";
import { useAvatarKey } from "@/lib/hooks/useAvatarKey";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";

export default function Navbar() {
    const { user, session, loading, profile, refreshProfile } = useSupabaseAuth();
    const { avatarKey, refreshAvatarKey } = useAvatarKey();
    const { user: userPreferences } = useUserPreferences();
    
    // Listen for profile updates and refresh session data
    const handleProfileUpdate = useCallback(async (event: any) => {
        // Clear avatar cache if userId is provided
        if (event.detail?.userId) {
            clearAvatarCache(event.detail.userId);
        }
        
        // Force re-render of avatar by updating key
        refreshAvatarKey();
        
        // Refresh the profile data from the database
        await refreshProfile();
        
        // Force another re-render after profile is refreshed
        setTimeout(() => refreshAvatarKey(), 100);
    }, [refreshAvatarKey, refreshProfile]);

    useEffect(() => {
        window.addEventListener('profile-updated', handleProfileUpdate);
        
        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, [handleProfileUpdate]);

    return (
        <nav className="border-b border-border bg-background">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity"
                >
                    <FolderKanban />
                </Link>
                <div className="flex items-center gap-4">
                    <ThemeToggleButton user={userPreferences || undefined} />
                    {user ? (
                        <>
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    className="text-foreground/70 hover:text-foreground transition-colors"
                                >
                                    Dashboard
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full"
                                    >
                                        <Avatar className="h-8 w-8" key={avatarKey}>
                                            <AvatarImage 
                                                src={profile?.profile_picture_data || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""} 
                                                className="object-cover" 
                                            />
                                            <AvatarFallback className="bg-primary text-white">
                                                {(profile?.name || user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {profile?.name || user?.user_metadata?.full_name || 'User'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <SettingsPageBtn />
                                    <SignOutButton />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            <Link href="/sign-in">
                                <Button
                                    variant="ghost"
                                    className="text-foreground/70 hover:text-foreground transition-colors"
                                >
                                    Log In
                                </Button>
                            </Link>
                            {/* <Link href="/sign-up">
                                <Button className="bg-primary hover:bg-primary/90 transition-colors">
                                    Start for free
                                </Button>
                            </Link> */}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
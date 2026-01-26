"use client";

import { Brackets } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { getSession, signOut } from "@/lib/auth/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import SignOutButton from "./sign-out-btn";
import { useSession } from "@/lib/auth/auth-client";
import { FolderKanban } from 'lucide-react';
import SettingsPageBtn from "./settings-page-btn";

export default function Navbar() {
    const { data: session } = useSession();
    // const session = await getSession();
    return (
        <nav className="border-b border-border bg-background">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-semibold text-primary"
                >
                    <FolderKanban />
                    Stride
                </Link>
                <div className="flex items-center gap-4">
                    {session?.user ? (
                        <>
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    className="text-foreground/70 hover:text-foreground"
                                >
                                    Dashboard
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-white">
                                                {session.user.name[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {session.user.name}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {session.user.email}
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
                                    className="text-foreground/70 hover:text-foreground"
                                >
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button className="bg-primary hover:bg-primary/90">
                                    Start for free
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
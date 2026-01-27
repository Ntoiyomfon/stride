"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User as UserIcon, Lock, Bell, Download, Trash2, Camera, Eye, EyeOff, Palette, Menu } from "lucide-react";
import SettingsTabs from "./settings-tabs";

interface User {
    _id: string;
    name: string;
    email: string;
    image?: string;
    preferences?: {
        emailNotifications?: boolean;
        weeklySummary?: boolean;
        defaultBoardView?: string;
        theme?: "light" | "dark" | "system";
        accentColor?: "red" | "blue" | "green" | "yellow" | "gray" | "pink";
    };
}

interface SettingsLayoutProps {
    user: User;
}

const settingsTabs = [
    {
        value: "account",
        label: "Account",
        icon: UserIcon,
    },
    {
        value: "security", 
        label: "Security",
        icon: Lock,
    },
    {
        value: "customization",
        label: "Customization", 
        icon: Palette,
    },
    {
        value: "preferences",
        label: "Preferences",
        icon: Bell,
    },
    {
        value: "data",
        label: "Data",
        icon: Download,
    },
];

export default function SettingsLayout({ user }: SettingsLayoutProps) {
    const [activeTab, setActiveTab] = useState("account");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <nav className="flex-1 p-4">
                <div className="space-y-1">
                    {settingsTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setActiveTab(tab.value);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                                    activeTab === tab.value
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-4 md:p-6 md:py-10">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-6 md:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your account settings and preferences.
                        </p>
                    </div>
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-64 flex-shrink-0">
                        <div className="bg-card rounded-lg border p-4">
                            <nav className="space-y-1">
                                {settingsTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.value}
                                            onClick={() => setActiveTab(tab.value)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
                                                activeTab === tab.value
                                                    ? "bg-secondary text-foreground"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <SettingsTabs user={user} activeTab={activeTab} />
                    </main>
                </div>
            </div>
        </div>
    );
}
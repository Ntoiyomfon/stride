import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/user";
import { getSession } from "@/lib/auth/auth";
import SettingsWrapper from "@/components/settings/settings-wrapper";
import { PageLoader } from "@/components/loading-spinner";
import { Suspense } from "react";

async function SettingsContent() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/sign-in");
    }

    const user = await getUser();

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="p-8 text-center bg-card rounded-lg border">
                    <p className="text-foreground">Failed to load user profile.</p>
                </div>
            </div>
        );
    }

    return <SettingsWrapper initialUser={user} />;
}

export default async function SettingsPage() {
    return (
        <Suspense fallback={<PageLoader text="Loading settings..." />}>
            <SettingsContent />
        </Suspense>
    );
}
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/user";
import { getSession } from "@/lib/auth/auth";
import SettingsLayout from "@/components/settings/settings-layout";
import { UserThemeSync } from "@/components/user-theme-sync";
import { AccentColorSync } from "@/components/accent-color-sync";

export default async function SettingsPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/sign-in");
    }

    const user = await getUser();

    return (
        <>
            {user ? (
                <>
                    <UserThemeSync user={user} />
                    <AccentColorSync user={user} />
                    <SettingsLayout user={user} />
                </>
            ) : (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="p-8 text-center bg-card rounded-lg border">
                        <p className="text-foreground">Failed to load user profile.</p>
                    </div>
                </div>
            )}
        </>
    );
}
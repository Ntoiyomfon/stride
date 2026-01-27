"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserSessions, revokeSession, revokeAllOtherSessions } from "@/lib/actions/session-management";
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { SessionInfo } from "@/lib/types/session";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



export function SessionManager() {
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [cleaningUp, setCleaningUp] = useState(false);

    const loadSessions = async () => {
        try {
            const result = await getUserSessions();
            if (result.sessions) {
                setSessions(result.sessions);
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error('Failed to load sessions:', error);
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        setRevoking(sessionId);
        try {
            const result = await revokeSession(sessionId);
            if (result.success) {
                toast.success('Session revoked successfully');
                await loadSessions(); // Refresh the list
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error('Failed to revoke session:', error);
            toast.error('Failed to revoke session');
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAllOther = async () => {
        setRevokingAll(true);
        try {
            const result = await revokeAllOtherSessions();
            if (result.success) {
                toast.success('All other sessions revoked successfully');
                await loadSessions(); // Refresh the list
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error('Failed to revoke other sessions:', error);
            toast.error('Failed to revoke other sessions');
        } finally {
            setRevokingAll(false);
        }
    };

    const handleCleanupSessions = async () => {
        setCleaningUp(true);
        try {
            const response = await fetch('/api/auth/cleanup-sessions?userOnly=true', {
                method: 'POST',
            });
            const result = await response.json();
            
            if (result.success) {
                toast.success(`Cleaned up ${result.cleaned} duplicate sessions`);
                await loadSessions(); // Refresh the list
            } else {
                toast.error(result.error || 'Failed to cleanup sessions');
            }
        } catch (error) {
            console.error('Failed to cleanup sessions:', error);
            toast.error('Failed to cleanup sessions');
        } finally {
            setCleaningUp(false);
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone className="h-4 w-4" />;
            case 'tablet':
                return <Tablet className="h-4 w-4" />;
            default:
                return <Monitor className="h-4 w-4" />;
        }
    };

    const formatLastActive = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                        Manage your active sessions across all devices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentSession = sessions.find(s => s.isCurrent);
    const otherSessions = sessions.filter(s => !s.isCurrent);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Sessions ({sessions.length})
                </CardTitle>
                <CardDescription>
                    Manage your active sessions across all devices. You can revoke access from any device.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Session */}
                {currentSession && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">Current Session</h4>
                            <Badge variant="secondary" className="text-xs">
                                This device
                            </Badge>
                        </div>
                        <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {getDeviceIcon(currentSession.deviceType)}
                                        <span className="font-medium text-sm">
                                            {currentSession.browser} on {currentSession.os}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {currentSession.location.city}, {currentSession.location.country}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatLastActive(currentSession.lastActiveAt)}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        IP: {currentSession.ipAddress}
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                                    Active
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                {/* Other Sessions */}
                {otherSessions.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Other Sessions ({otherSessions.length})</h4>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCleanupSessions}
                                        disabled={cleaningUp}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        {cleaningUp && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        <Shield className="mr-2 h-3 w-3" />
                                        Cleanup Duplicates
                                    </Button>
                                    {otherSessions.length > 1 && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={revokingAll}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    {revokingAll && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                    <LogOut className="mr-2 h-3 w-3" />
                                                    Revoke All
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will sign you out from all other devices. You will need to sign in again on those devices.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleRevokeAllOther}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Revoke All
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {otherSessions.map((session) => (
                                    <div key={session.sessionId} className="rounded-lg border p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {getDeviceIcon(session.deviceType)}
                                                    <span className="font-medium text-sm">
                                                        {session.browser} on {session.os}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {session.location.city}, {session.location.country}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatLastActive(session.lastActiveAt)}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    IP: {session.ipAddress}
                                                </div>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={revoking === session.sessionId}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        {revoking === session.sessionId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                        <LogOut className="mr-2 h-3 w-3" />
                                                        Revoke
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will sign out the session on {session.browser} ({session.os}) from {session.location.city}. 
                                                            The user will need to sign in again on that device.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleRevokeSession(session.sessionId)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Revoke Session
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* No other sessions */}
                {otherSessions.length === 0 && currentSession && (
                    <>
                        <Separator />
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                                No other active sessions found.
                            </p>
                        </div>
                    </>
                )}

                {/* No sessions at all */}
                {sessions.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                            No active sessions found.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
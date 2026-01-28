"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/auth/supabase-auth-service";
import { 
  Loader2, 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Calendar,
  Shield,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
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

interface SessionInfo {
  sessionId: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: { city?: string; country?: string };
  ipAddress: string;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch('/api/sessions', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId)
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Convert date strings back to Date objects
        const sessionsWithDates = data.sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastActiveAt: new Date(session.lastActiveAt)
        }));
        setSessions(sessionsWithDates);
      } else {
        console.error('Failed to load sessions:', data.error);
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
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
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'revoke',
          sessionId
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Session revoked successfully');
        await loadSessions(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'revokeAllOthers'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const count = data.revokedCount || 0;
        toast.success(`${count} session${count !== 1 ? 's' : ''} revoked successfully`);
        await loadSessions(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      toast.error('Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLocation = (location: { city?: string; country?: string }) => {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    } else if (location.country) {
      return location.country;
    } else if (location.city) {
      return location.city;
    }
    return 'Unknown location';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across all devices. You can revoke access from any device.
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
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No active sessions found. This might indicate a session tracking issue.
            </p>
          </div>
        ) : (
          <>
            {/* Current Session */}
            {sessions.filter(s => s.isCurrent).map((session) => (
              <div key={session.sessionId} className="space-y-2">
                <h4 className="text-sm font-medium">Current Session</h4>
                <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getDeviceIcon(session.deviceType)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {session.browser} on {session.os}
                          </span>
                          <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                            Current
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatLocation(session.location)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last active: {formatDate(session.lastActiveAt)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          IP: {session.ipAddress}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Other Sessions */}
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Other Sessions ({sessions.filter(s => !s.isCurrent).length})
                    </h4>
                    {sessions.filter(s => !s.isCurrent).length > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={revokingAll}
                            className="text-destructive hover:text-destructive"
                          >
                            {revokingAll ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <LogOut className="mr-2 h-3 w-3" />
                            )}
                            Revoke All Others
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Revoke All Other Sessions?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will sign you out from all other devices and browsers. 
                              You will need to sign in again on those devices.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleRevokeAllOtherSessions}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke All Others
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <div className="space-y-3">
                    {sessions.filter(s => !s.isCurrent).map((session) => (
                      <div key={session.sessionId} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getDeviceIcon(session.deviceType)}
                            <div className="space-y-1">
                              <span className="font-medium text-sm">
                                {session.browser} on {session.os}
                              </span>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {formatLocation(session.location)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Last active: {formatDate(session.lastActiveAt)}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                IP: {session.ipAddress}
                              </p>
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
                                {revoking === session.sessionId ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <LogOut className="mr-2 h-3 w-3" />
                                )}
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will sign out this device/browser. You will need to sign in again on that device.
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

            {/* Session Info */}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Sessions are automatically cleaned up after 90 days of inactivity.</p>
              <p>Revoked sessions are permanently deleted after 30 days.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
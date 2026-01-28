"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUser } from "@/lib/actions/user";
import { authService } from "@/lib/auth/supabase-auth-service";
import { Loader2, Link as LinkIcon, Unlink, Shield } from "lucide-react";
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

interface ConnectedProvider {
  provider: string;
  connectedAt: Date;
}

export function ConnectedAccounts() {
  const [providers, setProviders] = useState<ConnectedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      // Get user profile to check connected providers
      const user = await getUser();
      if (!user) {
        console.error('No user found');
        setProviders([]);
        return;
      }

      const connectedProviders: ConnectedProvider[] = [];
      
      // Add OAuth providers from user profile
      if (user.auth_providers && Array.isArray(user.auth_providers)) {
        user.auth_providers.forEach((provider: string) => {
          connectedProviders.push({
            provider,
            connectedAt: new Date(user.created_at) // Use account creation date as fallback
          });
        });
      }

      // If no providers found, default to email
      if (connectedProviders.length === 0) {
        connectedProviders.push({
          provider: 'email',
          connectedAt: new Date(user.created_at)
        });
      }

      setProviders(connectedProviders);
    } catch (error) {
      console.error('Failed to load connected providers:', error);
      // Don't show toast error to avoid spam
      setProviders([{ provider: 'email', connectedAt: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
    
    // Check for linking success/error messages
    const urlParams = new URLSearchParams(window.location.search);
    const linkedProvider = urlParams.get('linked');
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (linkedProvider && success) {
      toast.success(`${getProviderName(linkedProvider)} account linked successfully!`);
      // Clean up URL parameters
      window.history.replaceState({}, '', '/settings?tab=security');
    } else if (error === 'linking_failed') {
      toast.error('Failed to link account. Please try again.');
      // Clean up URL parameters
      window.history.replaceState({}, '', '/settings?tab=security');
    }
  }, []);

  const handleConnect = async (provider: 'google' | 'github') => {
    setConnecting(provider);
    
    try {
      // Use Supabase OAuth linking
      const result = await authService.signInWithOAuth(provider);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to connect account');
      }
      
      // Refresh providers list after successful linking
      setTimeout(() => {
        loadProviders();
        setConnecting(null);
      }, 1000);
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
      toast.error(`Failed to connect ${provider} account`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'github') => {
    setDisconnecting(provider);
    
    try {
      // This will be implemented when we add OAuth provider management
      toast.info(`${getProviderName(provider)} disconnect functionality will be available soon`);
    } catch (error) {
      console.error(`Failed to disconnect ${provider}:`, error);
      toast.error(`Failed to disconnect ${provider} account`);
    } finally {
      setDisconnecting(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case 'github':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      case 'email':
        return <Shield className="h-4 w-4" />;
      default:
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'github':
        return 'GitHub';
      case 'email':
        return 'Email & Password';
      default:
        return provider;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Manage your connected social accounts and authentication methods.
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

  const connectedProviders = providers.slice(1); // All providers except the first one
  const primaryProvider = providers[0]; // First provider is primary
  const availableProviders = ['google', 'github'].filter(
    p => !providers.some(cp => cp.provider === p)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Connected Accounts ({providers.length})
        </CardTitle>
        <CardDescription>
          Manage your connected social accounts and authentication methods. You can sign in with any connected account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Authentication */}
        {primaryProvider && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Primary Authentication</h4>
            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getProviderIcon(primaryProvider.provider)}
                  <div>
                    <span className="font-medium text-sm">{getProviderName(primaryProvider.provider)}</span>
                    <p className="text-xs text-muted-foreground">
                      Connected {formatDate(primaryProvider.connectedAt)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                  Primary
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Connected Additional Accounts */}
        {connectedProviders.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Additional Accounts ({connectedProviders.length})</h4>
              <div className="space-y-3">
                {connectedProviders.map((provider) => (
                  <div key={provider.provider} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(provider.provider)}
                        <div>
                          <span className="font-medium text-sm">
                            {getProviderName(provider.provider)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Connected {formatDate(provider.connectedAt)}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={disconnecting === provider.provider}
                            className="text-destructive hover:text-destructive"
                          >
                            {disconnecting === provider.provider ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Unlink className="mr-2 h-3 w-3" />
                            )}
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect {getProviderName(provider.provider)}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will no longer be able to sign in using your {getProviderName(provider.provider)} account. 
                              You can reconnect it later if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(provider.provider as 'google' | 'github')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Disconnect
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

        {/* Available Providers to Connect */}
        {availableProviders.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Connect Additional Accounts</h4>
              <p className="text-xs text-muted-foreground">
                Add more sign-in options to your account for convenience.
              </p>
              <div className="space-y-2">
                {availableProviders.map((provider) => (
                  <Button
                    key={provider}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleConnect(provider as 'google' | 'github')}
                    disabled={connecting === provider}
                  >
                    {connecting === provider ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      getProviderIcon(provider)
                    )}
                    <span className="ml-2">Connect {getProviderName(provider)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No additional providers available */}
        {availableProviders.length === 0 && connectedProviders.length > 0 && (
          <>
            <Separator />
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                All available social accounts are connected.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
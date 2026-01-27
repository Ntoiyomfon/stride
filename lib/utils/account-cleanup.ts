/**
 * Utility functions for complete account cleanup and session invalidation
 */

/**
 * Completely clear all client-side data and cookies
 */
export function clearAllClientData() {
    if (typeof window === 'undefined') return;
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies aggressively
    document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        
        // Clear for multiple path and domain combinations
        const domains = [window.location.hostname, `.${window.location.hostname}`, ''];
        const paths = ['/', '/dashboard', '/settings'];
        
        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domain ? `;domain=${domain}` : ''}`;
            });
        });
    });
    
    // Clear any cached data
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name);
            });
        });
    }
}

/**
 * Force immediate redirect with cleanup
 */
export function forceRedirectToSignIn() {
    clearAllClientData();
    
    // Multiple redirect attempts for reliability
    window.location.replace("/sign-in");
    
    setTimeout(() => {
        if (window.location.pathname !== "/sign-in") {
            window.location.href = "/sign-in";
        }
    }, 100);
    
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

/**
 * Invalidate user sessions via API
 */
export async function invalidateUserSessions(userId: string): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/invalidate-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Failed to invalidate sessions:', error);
        return false;
    }
}
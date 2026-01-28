/**
 * Utilities for preventing hydration mismatches in Next.js
 */

import { useState, useEffect } from 'react';
import React from 'react';

/**
 * Hook to safely use values that differ between server and client
 * Returns the server value during SSR and client value after hydration
 */
export function useHydrationSafeValue<T>(serverValue: T, clientValue: T): T {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true);
    }, []);

    return isClient ? clientValue : serverValue;
}

/**
 * Hook to safely generate timestamps without hydration issues
 */
export function useHydrationSafeTimestamp(): number {
    const [timestamp, setTimestamp] = useState(0);

    useEffect(() => {
        setTimestamp(Date.now());
    }, []);

    return timestamp;
}

/**
 * Hook to check if component is running on client side
 */
export function useIsClient(): boolean {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
}

/**
 * Component wrapper to only render children on client side
 */
export function ClientOnly({ children }: { children: React.ReactNode }): React.ReactElement | null {
    const isClient = useIsClient();
    
    if (!isClient) {
        return null;
    }
    
    return React.createElement(React.Fragment, null, children);
}
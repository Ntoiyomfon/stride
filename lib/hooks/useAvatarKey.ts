import { useState, useEffect } from 'react';

/**
 * Custom hook for managing avatar keys to prevent hydration issues
 * Returns a key that's safe to use for forcing avatar re-renders
 */
export function useAvatarKey() {
    const [avatarKey, setAvatarKey] = useState(0);
    const [isClient, setIsClient] = useState(false);

    // Initialize after component mounts to avoid hydration mismatch
    useEffect(() => {
        setIsClient(true);
        setAvatarKey(Date.now());
    }, []);

    // Function to refresh the avatar key
    const refreshAvatarKey = () => {
        if (isClient) {
            setAvatarKey(Date.now());
        }
    };

    return {
        avatarKey: isClient ? avatarKey : 0,
        refreshAvatarKey,
        isClient
    };
}
/**
 * Utility functions for managing avatar image caching
 */

/**
 * Force refresh all avatar images in the DOM to bypass browser cache
 * @param newImageUrl - The new image URL with cache buster
 */
export function refreshAvatarImages(newImageUrl: string) {
    if (typeof window === 'undefined') return;
    
    // Find all avatar images in the DOM
    const avatarImages = document.querySelectorAll('img[src*="/api/avatar/"]');
    
    avatarImages.forEach((img: any) => {
        // Update the src to the new URL with timestamp
        img.src = newImageUrl;
        
        // Force reload by temporarily changing src
        const originalSrc = img.src;
        img.src = '';
        setTimeout(() => {
            img.src = originalSrc;
        }, 10);
    });
}

/**
 * Generate a cache-busted avatar URL
 * @param userId - User ID
 * @returns Avatar URL with timestamp parameter
 */
export function generateAvatarUrl(userId: string): string {
    const timestamp = Date.now();
    return `/api/avatar/${userId}?t=${timestamp}`;
}

/**
 * Clear avatar cache by updating all avatar images with new timestamps
 * @param userId - User ID
 */
export function clearAvatarCache(userId: string) {
    const newUrl = generateAvatarUrl(userId);
    refreshAvatarImages(newUrl);
    
    // Also clear service worker cache if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_AVATAR_CACHE',
            userId: userId
        });
    }
    
    // Clear browser cache for avatar URLs
    if ('caches' in window) {
        caches.open('avatar-cache-v1').then(cache => {
            cache.keys().then(keys => {
                keys.forEach(key => {
                    if (key.url.includes(`/api/avatar/${userId}`)) {
                        cache.delete(key);
                    }
                });
            });
        });
    }
}
// Simple service worker for avatar cache management
const CACHE_NAME = 'avatar-cache-v1';

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_AVATAR_CACHE') {
        const userId = event.data.userId;
        
        // Clear avatar cache for specific user
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(keys => {
                keys.forEach(key => {
                    if (key.url.includes(`/api/avatar/${userId}`)) {
                        cache.delete(key);
                    }
                });
            });
        });
    }
});

self.addEventListener('fetch', (event) => {
    // Handle avatar requests with cache-first strategy but respect cache-control headers
    if (event.request.url.includes('/api/avatar/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    if (response) {
                        // Check if we should revalidate
                        const cacheControl = response.headers.get('cache-control');
                        if (cacheControl && cacheControl.includes('must-revalidate')) {
                            // Fetch fresh version
                            return fetch(event.request).then(fetchResponse => {
                                cache.put(event.request, fetchResponse.clone());
                                return fetchResponse;
                            }).catch(() => response);
                        }
                        return response;
                    }
                    
                    // Not in cache, fetch and cache
                    return fetch(event.request).then(fetchResponse => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
    }
});
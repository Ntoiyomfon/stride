export interface ParsedDevice {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
}

export function parseUserAgent(userAgent: string): ParsedDevice {
    const ua = userAgent.toLowerCase();
    
    // Parse browser
    let browser = 'Unknown';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';
    
    // Parse OS
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
    
    // Parse device type
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
    }
    
    return { browser, os, deviceType };
}

export async function getLocationFromIP(ip: string): Promise<{ city?: string; country?: string }> {
    // For development, return mock data
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return { city: 'Local', country: 'Development' };
    }
    
    try {
        // Using a free IP geolocation service
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country`);
        if (response.ok) {
            const data = await response.json();
            return {
                city: data.city || 'Unknown',
                country: data.country || 'Unknown'
            };
        }
    } catch (error) {
        console.error('Failed to get location from IP:', error);
    }
    
    return { city: 'Unknown', country: 'Unknown' };
}
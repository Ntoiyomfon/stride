export interface SessionInfo {
    sessionId: string;
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    location: {
        city?: string;
        country?: string;
    };
    ipAddress: string;
    createdAt: Date;
    lastActiveAt: Date;
    isCurrent: boolean;
}
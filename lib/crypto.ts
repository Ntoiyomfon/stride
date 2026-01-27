import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.BETTER_AUTH_SECRET || 'fallback-key';

export function encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
}

export function decryptSecret(encryptedSecret: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

export function hashBackupCode(code: string): string {
    return CryptoJS.SHA256(code).toString();
}

export function generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        // Generate 8-character alphanumeric codes
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
}
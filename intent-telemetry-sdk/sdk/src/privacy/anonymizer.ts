/**
 * Anonymization utilities for user data
 */

/**
 * Generate anonymous session ID
 * Uses crypto.randomUUID for strong randomness
 */
export function generateSessionId(): string {
    return crypto.randomUUID();
}

/**
 * Anonymize IP address by zeroing last octet
 */
export function anonymizeIPAddress(ip: string): string {
    // IPv4
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        const parts = ip.split('.');
        parts[3] = '0';
        return parts.join('.');
    }

    // IPv6 - zero last segment
    if (ip.includes(':')) {
        const parts = ip.split(':');
        parts[parts.length - 1] = '0';
        return parts.join(':');
    }

    return '[REDACTED_IP]';
}

/**
 * Anonymize user agent by removing specific version numbers
 * Keeps general browser/OS info for analytics
 */
export function anonymizeUserAgent(userAgent: string): string {
    // Remove specific version numbers while keeping general info
    return userAgent
        .replace(/\d+\.\d+\.\d+\.\d+/g, 'x.x.x.x') // Remove detailed versions
        .replace(/\b([A-Z][a-z]+)\/[\d.]+/g, '$1/x.x'); // Simplify app versions
}

/**
 * Hash a value for consistent anonymization
 * Uses SHA-256 if available, otherwise simple hash
 */
export async function hashValue(value: string, salt: string = ''): Promise<string> {
    const text = value + salt;

    // Use SubtleCrypto if available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback to simple hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Create fingerprint from device characteristics (non-identifying)
 * Used for session continuity without tracking
 */
export function createDeviceFingerprint(): string {
    const components = [
        navigator.language || 'unknown',
        screen.colorDepth || 0,
        screen.width || 0,
        screen.height || 0,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
    ];

    // Simple hash of components
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
}

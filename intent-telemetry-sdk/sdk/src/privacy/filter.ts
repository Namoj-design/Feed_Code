/**
 * PII (Personally Identifiable Information) detection and filtering
 */

/**
 * PII filter configuration
 */
export interface PIIFilterConfig {
    /** Patterns to redact */
    patterns: PIIPattern[];
    /** Custom field names to redact */
    sensitiveFields?: string[];
    /** Replacement text */
    redactionText?: string;
}

/**
 * Built-in PII patterns
 */
export enum PIIPattern {
    EMAIL = 'email',
    PHONE = 'phone',
    CREDIT_CARD = 'credit_card',
    SSN = 'ssn',
    IP_ADDRESS = 'ip_address',
    URL_PARAM = 'url_param',
}

/**
 * Regex patterns for PII detection
 */
const PII_PATTERNS: Record<PIIPattern, RegExp> = {
    [PIIPattern.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    [PIIPattern.PHONE]: /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    [PIIPattern.CREDIT_CARD]: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    [PIIPattern.SSN]: /\b\d{3}-\d{2}-\d{4}\b/g,
    [PIIPattern.IP_ADDRESS]: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    [PIIPattern.URL_PARAM]:
        /([?&])(email|token|key|password|secret|api_key|auth)=([^&\s]+)/gi,
};

/**
 * Redaction replacement text by pattern
 */
const REDACTION_TEXT: Record<PIIPattern, string> = {
    [PIIPattern.EMAIL]: '[REDACTED_EMAIL]',
    [PIIPattern.PHONE]: '[REDACTED_PHONE]',
    [PIIPattern.CREDIT_CARD]: '[REDACTED_CC]',
    [PIIPattern.SSN]: '[REDACTED_SSN]',
    [PIIPattern.IP_ADDRESS]: '[REDACTED_IP]',
    [PIIPattern.URL_PARAM]: '$1$2=[REDACTED]',
};

/**
 * Default PII filter configuration
 */
export const DEFAULT_PII_CONFIG: PIIFilterConfig = {
    patterns: [
        PIIPattern.EMAIL,
        PIIPattern.PHONE,
        PIIPattern.CREDIT_CARD,
        PIIPattern.SSN,
        PIIPattern.IP_ADDRESS,
        PIIPattern.URL_PARAM,
    ],
    sensitiveFields: ['password', 'ssn', 'creditCard', 'token', 'apiKey'],
};

/**
 * Filter PII from a string
 */
export function filterPIIFromString(
    input: string,
    config: PIIFilterConfig = DEFAULT_PII_CONFIG
): string {
    let filtered = input;

    for (const pattern of config.patterns) {
        const regex = PII_PATTERNS[pattern];
        const replacement = config.redactionText || REDACTION_TEXT[pattern];
        filtered = filtered.replace(regex, replacement);
    }

    return filtered;
}

/**
 * Filter PII from an object (recursive)
 */
export function filterPIIFromObject<T extends Record<string, any>>(
    obj: T,
    config: PIIFilterConfig = DEFAULT_PII_CONFIG
): T {
    const filtered: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
        // Check if this is a sensitive field name
        if (config.sensitiveFields?.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
            filtered[key] = '[REDACTED]';
            continue;
        }

        // Recursively filter objects and arrays
        if (value && typeof value === 'object') {
            filtered[key] = filterPIIFromObject(value, config);
        }
        // Filter strings
        else if (typeof value === 'string') {
            filtered[key] = filterPIIFromString(value, config);
        }
        // Pass through other types
        else {
            filtered[key] = value;
        }
    }

    return filtered as T;
}

/**
 * Sanitize URL by removing sensitive parameters and filtering PII
 */
export function sanitizeURL(url: string): string {
    try {
        const urlObj = new URL(url);

        // Remove sensitive query parameters
        const sensitiveParams = ['token', 'key', 'password', 'secret', 'api_key', 'auth', 'session'];
        sensitiveParams.forEach((param) => {
            urlObj.searchParams.delete(param);
        });

        // Filter PII from remaining URL
        return filterPIIFromString(urlObj.toString());
    } catch {
        // If URL parsing fails, just filter PII from the string
        return filterPIIFromString(url);
    }
}

/**
 * Sanitize element selector by removing IDs and specific attributes
 */
export function sanitizeSelector(selector: string): string {
    // Remove IDs (could be user-specific)
    let sanitized = selector.replace(/#[\w-]+/g, '');

    // Remove data attributes that might contain PII
    sanitized = sanitized.replace(/\[data-[\w-]+=["'][^"']*["']\]/g, '');

    // Keep only tag names and generic classes
    sanitized = sanitized.replace(/\[[\w-]+=/g, '[');

    return sanitized || 'unknown';
}

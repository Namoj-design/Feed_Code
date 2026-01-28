/**
 * Core event collector - asynchronous, non-blocking event capture
 */

import type {
    TelemetryEvent,
    EventType,
    EventContext,
    BaseEvent,
} from '../types/events';
import { EVENT_SCHEMA_VERSION } from '../types/events';
import { validateEvent } from '../types/schema';
import { filterPIIFromObject, sanitizeURL, sanitizeSelector } from '../privacy/filter';
import { generateSessionId, anonymizeUserAgent } from '../privacy/anonymizer';

/**
 * Event collector configuration
 */
export interface CollectorConfig {
    /** Session ID (generated if not provided) */
    sessionId?: string;
    /** Enable debug logging */
    debug?: boolean;
    /** Enable strict privacy mode (additional PII filtering) */
    strictPrivacy?: boolean;
    /** Custom PII patterns */
    customPIIPatterns?: RegExp[];
}

/**
 * Event collector class
 */
export class EventCollector {
    private sessionId: string;
    private sequenceNumber: number = 0;
    private config: CollectorConfig;
    private sessionStartTime: number;

    constructor(config: CollectorConfig = {}) {
        this.config = config;
        this.sessionId = config.sessionId || generateSessionId();
        this.sessionStartTime = Date.now();

        if (this.config.debug) {
            console.log('[IntentSDK] Event collector initialized', { sessionId: this.sessionId });
        }
    }

    /**
     * Get current session ID
     */
    getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Get session duration
     */
    getSessionDuration(): number {
        return Date.now() - this.sessionStartTime;
    }

    /**
     * Collect and enrich an event
     */
    async collectEvent<T extends TelemetryEvent>(
        type: EventType,
        data: T['data']
    ): Promise<TelemetryEvent | null> {
        try {
            // Create base event
            const event: BaseEvent = {
                schemaVersion: EVENT_SCHEMA_VERSION,
                type,
                eventId: crypto.randomUUID(),
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                sequenceNumber: this.sequenceNumber++,
                context: this.captureContext(),
            };

            // Merge with event-specific data
            const fullEvent = {
                ...event,
                data,
            } as TelemetryEvent;

            // Apply privacy filters
            const filtered = this.applyPrivacyFilters(fullEvent);

            // Validate event
            if (!validateEvent(filtered)) {
                if (this.config.debug) {
                    console.warn('[IntentSDK] Event validation failed', filtered);
                }
                return null;
            }

            if (this.config.debug) {
                console.log('[IntentSDK] Event collected', filtered);
            }

            return filtered;
        } catch (error) {
            if (this.config.debug) {
                console.error('[IntentSDK] Error collecting event', error);
            }
            return null;
        }
    }

    /**
     * Capture current event context
     */
    private captureContext(): EventContext {
        const viewport = this.getViewport();
        const device = this.getDeviceInfo();

        return {
            url: sanitizeURL(window.location.href),
            pageTitle: document.title,
            viewport,
            device,
            userAgent: this.config.strictPrivacy
                ? anonymizeUserAgent(navigator.userAgent)
                : navigator.userAgent,
        };
    }

    /**
     * Get viewport dimensions
     */
    private getViewport(): { width: number; height: number } {
        return {
            width: window.innerWidth || document.documentElement.clientWidth,
            height: window.innerHeight || document.documentElement.clientHeight,
        };
    }

    /**
     * Get device information (non-identifying)
     */
    private getDeviceInfo(): EventContext['device'] {
        const width = window.innerWidth;
        const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        let type: EventContext['device']['type'] = 'desktop';
        if (width < 768) {
            type = 'mobile';
        } else if (width < 1024) {
            type = 'tablet';
        }

        return {
            type,
            touchEnabled,
        };
    }

    /**
     * Apply privacy filters to event
     */
    private applyPrivacyFilters(event: TelemetryEvent): TelemetryEvent {
        // Deep clone and filter PII
        const filtered = filterPIIFromObject(JSON.parse(JSON.stringify(event)));

        // Additional sanitization for specific fields
        if (filtered.context?.url) {
            filtered.context.url = sanitizeURL(filtered.context.url);
        }

        // Sanitize selectors in click/interaction events
        if ('target' in filtered.data && typeof filtered.data.target === 'string') {
            filtered.data.target = sanitizeSelector(filtered.data.target);
        }

        return filtered;
    }

    /**
     * Reset session (generates new session ID)
     */
    resetSession(): void {
        this.sessionId = generateSessionId();
        this.sequenceNumber = 0;
        this.sessionStartTime = Date.now();

        if (this.config.debug) {
            console.log('[IntentSDK] Session reset', { sessionId: this.sessionId });
        }
    }
}

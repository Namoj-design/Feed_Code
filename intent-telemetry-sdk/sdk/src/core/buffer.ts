/**
 * Event buffer with local persistence and batching
 */

import type { TelemetryEvent } from '../types/events';

/**
 * Buffer configuration
 */
export interface BufferConfig {
    /** Maximum batch size (number of events) */
    maxBatchSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
    /** Maximum storage size in bytes */
    maxStorageSize?: number;
    /** Enable persistence across page loads */
    enablePersistence?: boolean;
    /** Storage key for persisted events */
    storageKey?: string;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Default buffer configuration
 */
const DEFAULT_CONFIG: Required<BufferConfig> = {
    maxBatchSize: 50,
    flushInterval: 30000, // 30 seconds
    maxStorageSize: 1024 * 1024, // 1MB
    enablePersistence: true,
    storageKey: 'intent-sdk-buffer',
    debug: false,
};

/**
 * Flush callback type
 */
export type FlushCallback = (events: TelemetryEvent[]) => Promise<void>;

/**
 * Event buffer class
 */
export class EventBuffer {
    private config: Required<BufferConfig>;
    private buffer: TelemetryEvent[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private flushCallback: FlushCallback | null = null;

    constructor(config: BufferConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Load persisted events
        if (this.config.enablePersistence) {
            this.loadPersistedEvents();
        }

        // Start flush timer
        this.startFlushTimer();

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flush());
            window.addEventListener('pagehide', () => this.flush());
        }
    }

    /**
     * Add event to buffer
     */
    add(event: TelemetryEvent): void {
        this.buffer.push(event);

        if (this.config.debug) {
            console.log('[IntentSDK Buffer] Event added', { bufferSize: this.buffer.length });
        }

        // Persist if enabled
        if (this.config.enablePersistence) {
            this.persistEvents();
        }

        // Auto-flush if batch size reached
        if (this.buffer.length >= this.config.maxBatchSize) {
            this.flush();
        }
    }

    /**
     * Set flush callback
     */
    onFlush(callback: FlushCallback): void {
        this.flushCallback = callback;
    }

    /**
     * Manually flush buffer
     */
    async flush(): Promise<void> {
        if (this.buffer.length === 0) {
            return;
        }

        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        if (this.config.debug) {
            console.log('[IntentSDK Buffer] Flushing events', { count: eventsToFlush.length });
        }

        // Clear persisted events
        if (this.config.enablePersistence) {
            this.clearPersistedEvents();
        }

        // Call flush callback
        if (this.flushCallback) {
            try {
                await this.flushCallback(eventsToFlush);
            } catch (error) {
                if (this.config.debug) {
                    console.error('[IntentSDK Buffer] Flush failed, re-buffering events', error);
                }
                // Re-add events to buffer on failure
                this.buffer.unshift(...eventsToFlush);
                if (this.config.enablePersistence) {
                    this.persistEvents();
                }
            }
        }
    }

    /**
     * Get current buffer size
     */
    size(): number {
        return this.buffer.length;
    }

    /**
     * Clear buffer
     */
    clear(): void {
        this.buffer = [];
        this.clearPersistedEvents();
    }

    /**
     * Start flush timer
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Stop flush timer
     */
    stopFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Persist events to localStorage
     */
    private persistEvents(): void {
        try {
            const serialized = JSON.stringify(this.buffer);

            // Check storage size
            if (serialized.length > this.config.maxStorageSize) {
                if (this.config.debug) {
                    console.warn('[IntentSDK Buffer] Buffer exceeds max storage size, truncating');
                }
                // Keep only recent events that fit
                const halfSize = Math.floor(this.buffer.length / 2);
                this.buffer = this.buffer.slice(halfSize);
                this.persistEvents(); // Retry with smaller buffer
                return;
            }

            localStorage.setItem(this.config.storageKey, serialized);
        } catch (error) {
            if (this.config.debug) {
                console.error('[IntentSDK Buffer] Failed to persist events', error);
            }
        }
    }

    /**
     * Load persisted events from localStorage
     */
    private loadPersistedEvents(): void {
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            if (stored) {
                this.buffer = JSON.parse(stored);
                if (this.config.debug) {
                    console.log('[IntentSDK Buffer] Loaded persisted events', {
                        count: this.buffer.length,
                    });
                }
            }
        } catch (error) {
            if (this.config.debug) {
                console.error('[IntentSDK Buffer] Failed to load persisted events', error);
            }
        }
    }

    /**
     * Clear persisted events
     */
    private clearPersistedEvents(): void {
        try {
            localStorage.removeItem(this.config.storageKey);
        } catch (error) {
            // Ignore errors
        }
    }

    /**
     * Destroy buffer and cleanup
     */
    destroy(): void {
        this.stopFlushTimer();
        this.flush();
        this.buffer = [];
    }
}

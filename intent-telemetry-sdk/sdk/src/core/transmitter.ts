/**
 * Network transmitter with retry logic and resilience
 */

import type { TelemetryEvent } from '../types/events';
import { createEventBatch } from '../types/schema';

/**
 * Transmitter configuration
 */
export interface TransmitterConfig {
    /** API endpoint URL */
    endpoint: string;
    /** Enable gzip compression */
    compression?: boolean;
    /** Max retry attempts */
    maxRetries?: number;
    /** Initial retry delay (ms) */
    retryDelay?: number;
    /** Retry backoff multiplier */
    retryBackoff?: number;
    /** Request timeout (ms) */
    timeout?: number;
    /** Additional headers */
    headers?: Record<string, string>;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Default transmitter configuration
 */
const DEFAULT_CONFIG: Omit<TransmitterConfig, 'endpoint'> = {
    compression: true,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    retryBackoff: 2, // Exponential backoff
    timeout: 10000, // 10 seconds
    headers: {},
    debug: false,
};

/**
 * Network transmitter class
 */
export class NetworkTransmitter {
    private config: Required<TransmitterConfig>;

    constructor(config: TransmitterConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config } as Required<TransmitterConfig>;

        if (this.config.debug) {
            console.log('[IntentSDK Transmitter] Initialized', { endpoint: this.config.endpoint });
        }
    }

    /**
     * Send events to server
     */
    async send(events: TelemetryEvent[]): Promise<boolean> {
        if (events.length === 0) {
            return true;
        }

        const batch = createEventBatch(events);

        if (this.config.debug) {
            console.log('[IntentSDK Transmitter] Sending batch', {
                batchId: batch.batchId,
                eventCount: events.length,
            });
        }

        return this.sendWithRetry(batch);
    }

    /**
     * Send with exponential backoff retry
     */
    private async sendWithRetry(batch: ReturnType<typeof createEventBatch>): Promise<boolean> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                await this.transmit(batch);

                if (this.config.debug) {
                    console.log('[IntentSDK Transmitter] Batch sent successfully', {
                        batchId: batch.batchId,
                        attempt: attempt + 1,
                    });
                }

                return true;
            } catch (error) {
                lastError = error as Error;

                if (this.config.debug) {
                    console.warn('[IntentSDK Transmitter] Transmission failed', {
                        attempt: attempt + 1,
                        error: lastError.message,
                    });
                }

                // Don't retry on final attempt
                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, attempt);
                    await this.sleep(delay);
                }
            }
        }

        if (this.config.debug) {
            console.error('[IntentSDK Transmitter] Max retries exceeded', {
                batchId: batch.batchId,
                error: lastError?.message,
            });
        }

        return false;
    }

    /**
     * Transmit batch to server
     */
    private async transmit(batch: ReturnType<typeof createEventBatch>): Promise<void> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const body = JSON.stringify(batch);

            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.config.headers,
                },
                body,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Update endpoint URL
     */
    setEndpoint(endpoint: string): void {
        this.config.endpoint = endpoint;
    }

    /**
     * Update headers
     */
    setHeaders(headers: Record<string, string>): void {
        this.config.headers = { ...this.config.headers, ...headers };
    }
}

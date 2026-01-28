/**
 * IntentSDK - Main SDK interface
 * Privacy-preserving telemetry for intent-aware user interaction tracking
 */

import { EventCollector } from './core/collector';
import { EventBuffer } from './core/buffer';
import { NetworkTransmitter } from './core/transmitter';
import { SessionTracker } from './trackers/session';
import { NavigationTracker } from './trackers/navigation';
import { InteractionTracker } from './trackers/interactions';
import { PerformanceTracker } from './trackers/performance';

/**
 * SDK configuration
 */
export interface IntentSDKConfig {
    /** API endpoint for telemetry data */
    endpoint: string;

    /** Event batching configuration */
    batchSize?: number;
    flushInterval?: number;

    /** Privacy configuration */
    strictPrivacy?: boolean;
    enableOptOut?: boolean;

    /** Auto-tracking configuration */
    enableAutoTracking?: boolean;
    trackSession?: boolean;
    trackNavigation?: boolean;
    trackInteractions?: boolean;
    trackPerformance?: boolean;

    /** Session timeout (ms) */
    sessionTimeout?: number;

    /** Debug mode */
    debug?: boolean;
}

/**
 * Default SDK configuration
 */
const DEFAULT_CONFIG: Partial<IntentSDKConfig> = {
    batchSize: 50,
    flushInterval: 30000,
    strictPrivacy: true,
    enableOptOut: true,
    enableAutoTracking: true,
    trackSession: true,
    trackNavigation: true,
    trackInteractions: true,
    trackPerformance: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    debug: false,
};

/**
 * IntentSDK class
 */
export class IntentSDK {
    private static instance: IntentSDK | null = null;

    private config: Required<IntentSDKConfig>;
    private collector: EventCollector;
    private buffer: EventBuffer;
    private transmitter: NetworkTransmitter;

    private sessionTracker: SessionTracker | null = null;
    private navigationTracker: NavigationTracker | null = null;
    private interactionTracker: InteractionTracker | null = null;
    private performanceTracker: PerformanceTracker | null = null;

    private isInitialized: boolean = false;

    private constructor(config: IntentSDKConfig) {
        this.config = { ...DEFAULT_CONFIG, ...config } as Required<IntentSDKConfig>;

        // Check for opt-out
        if (this.config.enableOptOut && this.checkOptOut()) {
            if (this.config.debug) {
                console.log('[IntentSDK] User has opted out, SDK disabled');
            }
            // Create dummy instances that do nothing
            this.collector = {} as EventCollector;
            this.buffer = {} as EventBuffer;
            this.transmitter = {} as NetworkTransmitter;
            return;
        }

        // Initialize core components
        this.collector = new EventCollector({
            debug: this.config.debug,
            strictPrivacy: this.config.strictPrivacy,
        });

        this.buffer = new EventBuffer({
            maxBatchSize: this.config.batchSize,
            flushInterval: this.config.flushInterval,
            enablePersistence: true,
            debug: this.config.debug,
        });

        this.transmitter = new NetworkTransmitter({
            endpoint: this.config.endpoint,
            debug: this.config.debug,
        });

        // Connect buffer to transmitter
        this.buffer.onFlush(async (events) => {
            await this.transmitter.send(events);
        });

        // Initialize auto-trackers
        if (this.config.enableAutoTracking) {
            this.initializeTrackers();
        }

        this.isInitialized = true;

        if (this.config.debug) {
            console.log('[IntentSDK] Initialized', {
                sessionId: this.collector.getSessionId(),
            });
        }
    }

    /**
     * Initialize SDK (singleton pattern)
     */
    static init(config: IntentSDKConfig): IntentSDK {
        if (IntentSDK.instance) {
            console.warn('[IntentSDK] SDK already initialized, returning existing instance');
            return IntentSDK.instance;
        }

        IntentSDK.instance = new IntentSDK(config);
        return IntentSDK.instance;
    }

    /**
     * Get SDK instance
     */
    static getInstance(): IntentSDK | null {
        return IntentSDK.instance;
    }

    /**
     * Initialize auto-trackers
     */
    private initializeTrackers(): void {
        if (this.config.trackSession) {
            this.sessionTracker = new SessionTracker(this.collector, {
                sessionTimeout: this.config.sessionTimeout,
                debug: this.config.debug,
            });
        }

        if (this.config.trackNavigation) {
            this.navigationTracker = new NavigationTracker(this.collector, {
                debug: this.config.debug,
            });
        }

        if (this.config.trackInteractions) {
            this.interactionTracker = new InteractionTracker(this.collector, {
                debug: this.config.debug,
            });
        }

        if (this.config.trackPerformance) {
            this.performanceTracker = new PerformanceTracker(this.collector, {
                debug: this.config.debug,
            });
        }
    }

    /**
     * Check if user has opted out
     */
    private checkOptOut(): boolean {
        try {
            return localStorage.getItem('intent-sdk-opt-out') === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Opt out of tracking
     */
    optOut(): void {
        try {
            localStorage.setItem('intent-sdk-opt-out', 'true');
            this.destroy();

            if (this.config.debug) {
                console.log('[IntentSDK] User opted out');
            }
        } catch (e) {
            console.error('[IntentSDK] Failed to set opt-out flag', e);
        }
    }

    /**
     * Opt back in to tracking
     */
    optIn(): void {
        try {
            localStorage.removeItem('intent-sdk-opt-out');

            if (this.config.debug) {
                console.log('[IntentSDK] User opted in');
            }
        } catch (e) {
            console.error('[IntentSDK] Failed to remove opt-out flag', e);
        }
    }

    /**
     * Get current session ID
     */
    getSessionId(): string {
        return this.collector.getSessionId();
    }

    /**
     * Manually flush events
     */
    async flush(): Promise<void> {
        await this.buffer.flush();
    }

    /**
     * Track custom event (for manual tracking)
     */
    async trackEvent(eventType: string, data: Record<string, any>): Promise<void> {
        if (!this.isInitialized) {
            return;
        }

        const event = await this.collector.collectEvent(eventType as any, data as any);
        if (event) {
            this.buffer.add(event);
        }
    }

    /**
     * Destroy SDK and cleanup
     */
    destroy(): void {
        this.sessionTracker?.destroy();
        this.navigationTracker?.destroy();
        this.interactionTracker?.destroy();
        this.performanceTracker?.destroy();

        this.buffer?.destroy();

        this.isInitialized = false;
        IntentSDK.instance = null;

        if (this.config.debug) {
            console.log('[IntentSDK] SDK destroyed');
        }
    }
}

/**
 * Export types
 */
export * from './types/events';
export * from './types/schema';

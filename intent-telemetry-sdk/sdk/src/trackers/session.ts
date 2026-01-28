/**
 * Session lifecycle tracker
 */

import { EventCollector } from '../core/collector';
import { EventType } from '../types/events';

/**
 * Session tracker configuration
 */
export interface SessionTrackerConfig {
    /** Track visibility changes */
    trackVisibility?: boolean;
    /** Track page blur/focus */
    trackFocus?: boolean;
    /** Session timeout (ms) */
    sessionTimeout?: number;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Session lifecycle tracker
 */
export class SessionTracker {
    private collector: EventCollector;
    private config: SessionTrackerConfig;
    private sessionActive: boolean = false;
    private lastActivityTime: number = Date.now();
    private sessionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(collector: EventCollector, config: SessionTrackerConfig = {}) {
        this.collector = collector;
        this.config = {
            trackVisibility: true,
            trackFocus: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            debug: false,
            ...config,
        };

        this.init();
    }

    /**
     * Initialize session tracking
     */
    private init(): void {
        // Start session immediately
        this.startSession();

        // Track visibility changes
        if (this.config.trackVisibility) {
            document.addEventListener('visibilitychange', this.handleVisibilityChange);
        }

        // Track window focus/blur
        if (this.config.trackFocus) {
            window.addEventListener('blur', this.handleBlur);
            window.addEventListener('focus', this.handleFocus);
        }

        // Track page unload
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        window.addEventListener('pagehide', this.handleBeforeUnload);

        // Start session timeout monitor
        this.startSessionTimeoutMonitor();
    }

    /**
     * Start session
     */
    private startSession = async (): Promise<void> => {
        if (this.sessionActive) {
            return;
        }

        this.sessionActive = true;
        this.lastActivityTime = Date.now();

        await this.collector.collectEvent(EventType.SESSION_START, {
            entryPoint: document.referrer || 'direct',
            landingPage: window.location.href,
        });

        if (this.config.debug) {
            console.log('[IntentSDK Session] Session started');
        }
    };

    /**
     * Resume session
     */
    private resumeSession = async (pauseDuration: number): Promise<void> => {
        this.sessionActive = true;
        this.lastActivityTime = Date.now();

        await this.collector.collectEvent(EventType.SESSION_RESUME, {
            pauseDuration,
        });

        if (this.config.debug) {
            console.log('[IntentSDK Session] Session resumed', { pauseDuration });
        }
    };

    /**
     * Pause session
     */
    private pauseSession = async (
        reason: 'visibility' | 'blur' | 'beforeunload'
    ): Promise<void> => {
        if (!this.sessionActive) {
            return;
        }

        this.sessionActive = false;

        await this.collector.collectEvent(EventType.SESSION_PAUSE, {
            reason,
        });

        if (this.config.debug) {
            console.log('[IntentSDK Session] Session paused', { reason });
        }
    };

    /**
     * End session
     */
    private endSession = async (): Promise<void> => {
        if (!this.sessionActive) {
            return;
        }

        this.sessionActive = false;

        await this.collector.collectEvent(EventType.SESSION_END, {
            duration: this.collector.getSessionDuration(),
            eventCount: this.collector.getSessionId().length, // Approx, would need tracking
        });

        if (this.config.debug) {
            console.log('[IntentSDK Session] Session ended');
        }
    };

    /**
     * Handle visibility change
     */
    private handleVisibilityChange = async (): Promise<void> => {
        const pauseTime = this.lastActivityTime;

        if (document.hidden) {
            await this.pauseSession('visibility');
        } else {
            const pauseDuration = Date.now() - pauseTime;
            await this.resumeSession(pauseDuration);
        }
    };

    /**
     * Handle window blur
     */
    private handleBlur = async (): Promise<void> => {
        await this.pauseSession('blur');
    };

    /**
     * Handle window focus
     */
    private handleFocus = async (): Promise<void> => {
        const pauseDuration = Date.now() - this.lastActivityTime;
        await this.resumeSession(pauseDuration);
    };

    /**
     * Handle page unload
     */
    private handleBeforeUnload = async (): Promise<void> => {
        await this.endSession();
    };

    /**
     * Start session timeout monitor
     */
    private startSessionTimeoutMonitor(): void {
        this.sessionTimeoutTimer = setInterval(() => {
            const inactiveDuration = Date.now() - this.lastActivityTime;

            if (this.sessionActive && inactiveDuration > this.config.sessionTimeout!) {
                this.endSession();
            }
        }, 60000); // Check every minute
    }

    /**
     * Record user activity (reset timeout)
     */
    recordActivity(): void {
        this.lastActivityTime = Date.now();
    }

    /**
     * Cleanup
     */
    destroy(): void {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.removeEventListener('pagehide', this.handleBeforeUnload);

        if (this.sessionTimeoutTimer) {
            clearInterval(this.sessionTimeoutTimer);
        }
    }
}

/**
 * Navigation and view transition tracker
 */

import { EventCollector } from '../core/collector';
import { EventType } from '../types/events';

/**
 * Navigation tracker configuration
 */
export interface NavigationTrackerConfig {
    /** Track hash changes */
    trackHashChanges?: boolean;
    /** Track back/forward navigation */
    trackHistoryNavigation?: boolean;
    /** Minimum time on page to detect reversals (ms) */
    reversalThreshold?: number;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Navigation history entry
 */
interface HistoryEntry {
    url: string;
    timestamp: number;
}

/**
 * Navigation tracker
 */
export class NavigationTracker {
    private collector: EventCollector;
    private config: NavigationTrackerConfig;
    private currentUrl: string;
    private previousUrl: string | null = null;
    private navigationHistory: HistoryEntry[] = [];
    private lastNavigationTime: number = Date.now();

    constructor(collector: EventCollector, config: NavigationTrackerConfig = {}) {
        this.collector = collector;
        this.config = {
            trackHashChanges: true,
            trackHistoryNavigation: true,
            reversalThreshold: 3000, // 3 seconds
            debug: false,
            ...config,
        };

        this.currentUrl = window.location.href;
        this.init();
    }

    /**
     * Initialize navigation tracking
     */
    private init(): void {
        // Track popstate (back/forward)
        if (this.config.trackHistoryNavigation) {
            window.addEventListener('popstate', this.handlePopState);
        }

        // Track hash changes
        if (this.config.trackHashChanges) {
            window.addEventListener('hashchange', this.handleHashChange);
        }

        // Intercept pushState and replaceState
        this.interceptHistoryAPI();

        // Record initial page
        this.recordNavigation(this.currentUrl);
    }

    /**
     * Handle popstate event (back/forward navigation)
     */
    private handlePopState = async (): Promise<void> => {
        const newUrl = window.location.href;
        const timeOnPage = Date.now() - this.lastNavigationTime;

        // Check for navigation reversal
        if (this.previousUrl && newUrl === this.previousUrl) {
            await this.detectNavigationReversal(this.currentUrl, timeOnPage, newUrl);
        }

        // Track back/forward navigation
        const direction = this.detectNavigationDirection(newUrl);
        if (direction === 'back') {
            await this.collector.collectEvent(EventType.NAVIGATION_BACK, {
                from: this.currentUrl,
                to: newUrl,
            });
        } else if (direction === 'forward') {
            await this.collector.collectEvent(EventType.NAVIGATION_FORWARD, {
                from: this.currentUrl,
                to: newUrl,
            });
        }

        this.updateNavigation(newUrl, 'popState');
    };

    /**
     * Handle hash change
     */
    private handleHashChange = async (): Promise<void> => {
        const newUrl = window.location.href;
        this.updateNavigation(newUrl, 'hashchange');
    };

    /**
     * Intercept history.pushState and history.replaceState
     */
    private interceptHistoryAPI(): void {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.updateNavigation(window.location.href, 'pushState');
        };

        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.updateNavigation(window.location.href, 'replaceState');
        };
    }

    /**
     * Update navigation state and collect event
     */
    private async updateNavigation(
        newUrl: string,
        method: 'pushState' | 'replaceState' | 'popState' | 'hashchange'
    ): Promise<void> {
        if (newUrl === this.currentUrl) {
            return;
        }

        await this.collector.collectEvent(EventType.VIEW_TRANSITION, {
            from: this.currentUrl,
            to: newUrl,
            method: method === 'hashchange' ? 'navigation' : method,
        });

        this.previousUrl = this.currentUrl;
        this.currentUrl = newUrl;
        this.lastNavigationTime = Date.now();
        this.recordNavigation(newUrl);

        if (this.config.debug) {
            console.log('[IntentSDK Navigation] View transition', { from: this.previousUrl, to: newUrl });
        }
    }

    /**
     * Record navigation in history
     */
    private recordNavigation(url: string): void {
        this.navigationHistory.push({
            url,
            timestamp: Date.now(),
        });

        // Keep history limited
        if (this.navigationHistory.length > 50) {
            this.navigationHistory = this.navigationHistory.slice(-50);
        }
    }

    /**
     * Detect navigation direction (back/forward)
     */
    private detectNavigationDirection(newUrl: string): 'back' | 'forward' | 'unknown' {
        // Find in history
        for (let i = this.navigationHistory.length - 2; i >= 0; i--) {
            if (this.navigationHistory[i].url === newUrl) {
                return 'back';
            }
        }

        return 'unknown';
    }

    /**
     * Detect and report navigation reversal (friction indicator)
     */
    private async detectNavigationReversal(
        navigatedTo: string,
        timeOnPage: number,
        returnedTo: string
    ): Promise<void> {
        // Only count as reversal if time on page was short
        if (timeOnPage < this.config.reversalThreshold!) {
            await this.collector.collectEvent(EventType.FRICTION_NAVIGATION_REVERSAL, {
                navigatedTo,
                timeOnPage,
                returnedTo,
            });

            if (this.config.debug) {
                console.log('[IntentSDK Navigation] Reversal detected', {
                    navigatedTo,
                    timeOnPage,
                    returnedTo,
                });
            }
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('hashchange', this.handleHashChange);
    }
}

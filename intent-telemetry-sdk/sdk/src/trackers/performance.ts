/**
 * Performance measurement tracker
 */

import { EventCollector } from '../core/collector';
import { EventType } from '../types/events';

/**
 * Performance tracker configuration
 */
export interface PerformanceTrackerConfig {
    /** Track page load metrics */
    trackPageLoad?: boolean;
    /** Track interaction latency */
    trackLatency?: boolean;
    /** Latency threshold (ms) */
    latencyThreshold?: number;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Performance tracker
 */
export class PerformanceTracker {
    private collector: EventCollector;
    private config: PerformanceTrackerConfig;
    private hasTrackedPageLoad: boolean = false;

    constructor(collector: EventCollector, config: PerformanceTrackerConfig = {}) {
        this.collector = collector;
        this.config = {
            trackPageLoad: true,
            trackLatency: true,
            latencyThreshold: 1000, // 1 second
            debug: false,
            ...config,
        };

        this.init();
    }

    /**
     * Initialize performance tracking
     */
    private init(): void {
        if (this.config.trackPageLoad) {
            // Wait for page load to complete
            if (document.readyState === 'complete') {
                this.trackPageLoad();
            } else {
                window.addEventListener('load', this.trackPageLoad);
            }
        }

        if (this.config.trackLatency) {
            // Use PerformanceObserver for interaction latency
            this.observeInteractionLatency();
        }
    }

    /**
     * Track page load metrics
     */
    private trackPageLoad = async (): Promise<void> => {
        if (this.hasTrackedPageLoad) return;
        this.hasTrackedPageLoad = true;

        // Use Performance API
        const perfData = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');

        const loadTime = perfData
            ? (perfData as PerformanceNavigationTiming).loadEventEnd -
            (perfData as PerformanceNavigationTiming).fetchStart
            : 0;

        const domContentLoaded = perfData
            ? (perfData as PerformanceNavigationTiming).domContentLoadedEventEnd -
            (perfData as PerformanceNavigationTiming).fetchStart
            : 0;

        const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
        const lcp = this.getLargestContentfulPaint();

        await this.collector.collectEvent(EventType.PERFORMANCE_LOAD, {
            loadTime,
            domContentLoaded,
            firstContentfulPaint: fcp?.startTime,
            largestContentfulPaint: lcp,
        });

        if (this.config.debug) {
            console.log('[IntentSDK Performance] Page load tracked', {
                loadTime,
                domContentLoaded,
                fcp: fcp?.startTime,
                lcp,
            });
        }
    };

    /**
     * Get Largest Contentful Paint
     */
    private getLargestContentfulPaint(): number | undefined {
        if (!('PerformanceObserver' in window)) {
            return undefined;
        }

        let lcp: number | undefined;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                lcp = lastEntry.startTime;
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });

            // Disconnect after short delay
            setTimeout(() => observer.disconnect(), 0);
        } catch (e) {
            // PerformanceObserver not supported
        }

        return lcp;
    }

    /**
     * Observe interaction latency
     */
    private observeInteractionLatency(): void {
        if (!('PerformanceObserver' in window)) {
            return;
        }

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const eventEntry = entry as PerformanceEventTiming;
                    const latency = eventEntry.processingEnd - eventEntry.startTime;

                    if (latency > this.config.latencyThreshold!) {
                        this.trackLatency(eventEntry.name, latency);
                    }
                }
            });

            observer.observe({ entryTypes: ['event'] });
        } catch (e) {
            // Event timing not supported
        }
    }

    /**
     * Track high latency event
     */
    private async trackLatency(operation: string, latency: number): Promise<void> {
        await this.collector.collectEvent(EventType.PERFORMANCE_LATENCY, {
            operation,
            latency,
            threshold: this.config.latencyThreshold!,
        });

        if (this.config.debug) {
            console.log('[IntentSDK Performance] High latency detected', { operation, latency });
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        window.removeEventListener('load', this.trackPageLoad);
    }
}

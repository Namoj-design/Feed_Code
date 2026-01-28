/**
 * User interaction tracker (clicks, forms, inputs)
 */

import { EventCollector } from '../core/collector';
import { EventType, ActionOutcome } from '../types/events';

/**
 * Interaction tracker configuration
 */
export interface InteractionTrackerConfig {
    /** Track click events */
    trackClicks?: boolean;
    /** Track form submissions */
    trackForms?: boolean;
    /** Track focus events */
    trackFocus?: boolean;
    /** Track input events */
    trackInput?: boolean;
    /** Rapid click threshold (ms) */
    rapidClickThreshold?: number;
    /** Rapid click count threshold */
    rapidClickCount?: number;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Click tracking data
 */
interface ClickData {
    target: Element;
    timestamp: number;
    count: number;
}

/**
 * Interaction tracker
 */
export class InteractionTracker {
    private collector: EventCollector;
    private config: InteractionTrackerConfig;
    private lastClick: ClickData | null = null;
    private formStartTimes: WeakMap<HTMLFormElement, number> = new WeakMap();
    private inputStartTimes: WeakMap<HTMLInputElement | HTMLTextAreaElement, number> =
        new WeakMap();

    constructor(collector: EventCollector, config: InteractionTrackerConfig = {}) {
        this.collector = collector;
        this.config = {
            trackClicks: true,
            trackForms: true,
            trackFocus: true,
            trackInput: true,
            rapidClickThreshold: 500, // 500ms
            rapidClickCount: 3, // 3 clicks
            debug: false,
            ...config,
        };

        this.init();
    }

    /**
     * Initialize interaction tracking
     */
    private init(): void {
        if (this.config.trackClicks) {
            document.addEventListener('click', this.handleClick, true);
        }

        if (this.config.trackForms) {
            document.addEventListener('submit', this.handleSubmit, true);
            // Track form field focus for time tracking
            document.addEventListener('focusin', this.handleFormFieldFocus, true);
        }

        if (this.config.trackFocus) {
            document.addEventListener('focusin', this.handleFocus, true);
        }

        if (this.config.trackInput) {
            document.addEventListener('input', this.handleInput, true);
            document.addEventListener('focusin', this.handleInputFocus, true);
        }
    }

    /**
     * Handle click events
     */
    private handleClick = async (event: MouseEvent): Promise<void> => {
        const target = event.target as Element;
        if (!target) return;

        const now = Date.now();

        // Detect rapid clicks
        if (this.lastClick && target === this.lastClick.target) {
            const timeSinceLastClick = now - this.lastClick.timestamp;

            if (timeSinceLastClick < this.config.rapidClickThreshold!) {
                this.lastClick.count++;

                // Report rapid click friction
                if (this.lastClick.count >= this.config.rapidClickCount!) {
                    await this.collector.collectEvent(EventType.FRICTION_RAPID_CLICK, {
                        target: this.getElementSelector(target),
                        clickCount: this.lastClick.count,
                        timeWindow: timeSinceLastClick * this.lastClick.count,
                    });

                    if (this.config.debug) {
                        console.log('[IntentSDK Interaction] Rapid click detected', {
                            target: this.getElementSelector(target),
                            count: this.lastClick.count,
                        });
                    }

                    this.lastClick.count = 0; // Reset to avoid multiple reports
                }
            } else {
                this.lastClick.count = 1;
                this.lastClick.timestamp = now;
            }
        } else {
            this.lastClick = { target, timestamp: now, count: 1 };
        }

        // Collect click event
        await this.collector.collectEvent(EventType.ACTION_CLICK, {
            target: this.getElementSelector(target),
            targetText: this.getElementText(target),
            coordinates: {
                x: event.clientX,
                y: event.clientY,
            },
            outcome: this.detectClickOutcome(target),
        });
    };

    /**
     * Handle form submission
     */
    private handleSubmit = async (event: SubmitEvent): Promise<void> => {
        const form = event.target as HTMLFormElement;
        if (!form) return;

        const startTime = this.formStartTimes.get(form) || Date.now();
        const timeSpent = Date.now() - startTime;

        const fields = form.querySelectorAll('input, select, textarea');
        const fieldCount = fields.length;

        await this.collector.collectEvent(EventType.ACTION_SUBMIT, {
            formId: form.id || form.name || undefined,
            fieldCount,
            timeSpent,
            outcome: ActionOutcome.SUCCESS, // Assume success, would need error tracking
        });

        if (this.config.debug) {
            console.log('[IntentSDK Interaction] Form submitted', {
                formId: form.id,
                fieldCount,
                timeSpent,
            });
        }
    };

    /**
     * Handle form field focus (for time tracking)
     */
    private handleFormFieldFocus = (event: FocusEvent): void => {
        const target = event.target as HTMLElement;
        const form = target.closest('form');

        if (form && !this.formStartTimes.has(form)) {
            this.formStartTimes.set(form, Date.now());
        }
    };

    /**
     * Handle focus events
     */
    private handleFocus = async (event: FocusEvent): Promise<void> => {
        const target = event.target as HTMLElement;
        if (!target) return;

        await this.collector.collectEvent(EventType.ACTION_FOCUS, {
            elementType: target.tagName.toLowerCase(),
            method: 'click', // Would need to detect tab/programmatic
        });
    };

    /**
     * Handle input focus (for time tracking)
     */
    private handleInputFocus = (event: FocusEvent): void => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;

        if (
            target &&
            (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
            !this.inputStartTimes.has(target)
        ) {
            this.inputStartTimes.set(target, Date.now());
        }
    };

    /**
     * Handle input events
     */
    private handleInput = async (event: Event): Promise<void> => {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        if (!target) return;

        const startTime = this.inputStartTimes.get(target) || Date.now();
        const duration = Date.now() - startTime;

        await this.collector.collectEvent(EventType.ACTION_INPUT, {
            fieldType: target instanceof HTMLInputElement ? target.type : 'textarea',
            characterCount: target.value.length,
            duration,
        });
    };

    /**
     * Get element selector (simplified, class-based)
     */
    private getElementSelector(element: Element): string {
        const tag = element.tagName.toLowerCase();
        const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
        return `${tag}${classes}`.slice(0, 100); // Limit length
    }

    /**
     * Get element text content (sanitized)
     */
    private getElementText(element: Element): string | undefined {
        const text = element.textContent?.trim().slice(0, 50); // Limit length
        return text || undefined;
    }

    /**
     * Detect click outcome based on element behavior
     */
    private detectClickOutcome(element: Element): ActionOutcome {
        // This is a simplified heuristic
        // In production, would need more sophisticated detection

        const tag = element.tagName.toLowerCase();

        // Links and buttons typically have effects
        if (tag === 'a' || tag === 'button') {
            return ActionOutcome.SUCCESS;
        }

        // Check for disabled state
        if (
            element.hasAttribute('disabled') ||
            element.getAttribute('aria-disabled') === 'true'
        ) {
            return ActionOutcome.NO_EFFECT;
        }

        return ActionOutcome.UNKNOWN;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        document.removeEventListener('click', this.handleClick, true);
        document.removeEventListener('submit', this.handleSubmit, true);
        document.removeEventListener('focusin', this.handleFormFieldFocus, true);
        document.removeEventListener('focusin', this.handleFocus, true);
        document.removeEventListener('input', this.handleInput, true);
        document.removeEventListener('focusin', this.handleInputFocus, true);
    }
}

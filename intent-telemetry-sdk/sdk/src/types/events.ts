/**
 * Standardized telemetry event types
 * All events follow a versioned schema for forward compatibility
 */

export const EVENT_SCHEMA_VERSION = '1.0.0';

/**
 * Base event structure shared by all event types
 */
export interface BaseEvent {
    /** Event schema version (semver) */
    schemaVersion: string;
    /** Event type identifier */
    type: EventType;
    /** Client-generated event ID (UUID v4) */
    eventId: string;
    /** Anonymous session identifier */
    sessionId: string;
    /** Event timestamp (ISO 8601) */
    timestamp: string;
    /** Sequence number within session */
    sequenceNumber: number;
    /** Client context at time of event */
    context: EventContext;
}

/**
 * Contextual metadata captured with every event
 */
export interface EventContext {
    /** Current URL (sanitized) */
    url?: string;
    /** Current page title */
    pageTitle?: string;
    /** Viewport dimensions */
    viewport: {
        width: number;
        height: number;
    };
    /** Device capabilities (non-identifying) */
    device: {
        type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
        touchEnabled: boolean;
    };
    /** User agent (anonymized) */
    userAgent?: string;
}

/**
 * All supported event types
 */
export enum EventType {
    // Session lifecycle
    SESSION_START = 'session.start',
    SESSION_RESUME = 'session.resume',
    SESSION_PAUSE = 'session.pause',
    SESSION_END = 'session.end',

    // Navigation
    VIEW_TRANSITION = 'view.transition',
    NAVIGATION_BACK = 'navigation.back',
    NAVIGATION_FORWARD = 'navigation.forward',

    // User interactions
    ACTION_CLICK = 'action.click',
    ACTION_SUBMIT = 'action.submit',
    ACTION_FOCUS = 'action.focus',
    ACTION_INPUT = 'action.input',

    // Performance
    PERFORMANCE_LOAD = 'performance.load',
    PERFORMANCE_LATENCY = 'performance.latency',

    // Friction indicators
    FRICTION_RAPID_CLICK = 'friction.rapid_click',
    FRICTION_NAVIGATION_REVERSAL = 'friction.navigation_reversal',
    FRICTION_ERROR = 'friction.error',
    FRICTION_FORM_ABANDONMENT = 'friction.form_abandonment',
}

/**
 * Session lifecycle events
 */
export interface SessionStartEvent extends BaseEvent {
    type: EventType.SESSION_START;
    data: {
        /** Entry point (referrer, direct, etc.) */
        entryPoint?: string;
        /** Landing page */
        landingPage: string;
    };
}

export interface SessionResumeEvent extends BaseEvent {
    type: EventType.SESSION_RESUME;
    data: {
        /** Duration of pause in ms */
        pauseDuration: number;
    };
}

export interface SessionPauseEvent extends BaseEvent {
    type: EventType.SESSION_PAUSE;
    data: {
        /** Reason for pause (visibility, blur, etc.) */
        reason: 'visibility' | 'blur' | 'beforeunload';
    };
}

export interface SessionEndEvent extends BaseEvent {
    type: EventType.SESSION_END;
    data: {
        /** Total session duration in ms */
        duration: number;
        /** Number of events in session */
        eventCount: number;
    };
}

/**
 * Navigation events
 */
export interface ViewTransitionEvent extends BaseEvent {
    type: EventType.VIEW_TRANSITION;
    data: {
        /** Previous URL/route */
        from: string;
        /** New URL/route */
        to: string;
        /** Transition method */
        method: 'pushState' | 'replaceState' | 'popState' | 'navigation';
    };
}

export interface NavigationBackEvent extends BaseEvent {
    type: EventType.NAVIGATION_BACK;
    data: {
        /** URL navigated back from */
        from: string;
        /** URL navigated back to */
        to: string;
    };
}

export interface NavigationForwardEvent extends BaseEvent {
    type: EventType.NAVIGATION_FORWARD;
    data: {
        from: string;
        to: string;
    };
}

/**
 * User interaction events
 */
export interface ActionClickEvent extends BaseEvent {
    type: EventType.ACTION_CLICK;
    data: {
        /** Target element selector (simplified, no IDs) */
        target: string;
        /** Target element text content (sanitized) */
        targetText?: string;
        /** Click coordinates (relative to viewport) */
        coordinates: { x: number; y: number };
        /** Outcome of action */
        outcome: ActionOutcome;
    };
}

export interface ActionSubmitEvent extends BaseEvent {
    type: EventType.ACTION_SUBMIT;
    data: {
        /** Form identifier (sanitized) */
        formId?: string;
        /** Number of fields in form */
        fieldCount: number;
        /** Time spent on form (ms) */
        timeSpent: number;
        /** Submission outcome */
        outcome: ActionOutcome;
    };
}

export interface ActionFocusEvent extends BaseEvent {
    type: EventType.ACTION_FOCUS;
    data: {
        /** Focused element type */
        elementType: string;
        /** Focus method */
        method: 'click' | 'tab' | 'programmatic';
    };
}

export interface ActionInputEvent extends BaseEvent {
    type: EventType.ACTION_INPUT;
    data: {
        /** Input field type (text, email, etc.) */
        fieldType: string;
        /** Character count (no actual content) */
        characterCount: number;
        /** Input duration (ms) */
        duration: number;
    };
}

/**
 * Action outcome classification
 */
export enum ActionOutcome {
    /** Action completed successfully */
    SUCCESS = 'success',
    /** Action resulted in error */
    ERROR = 'error',
    /** Action had no visible effect */
    NO_EFFECT = 'no_effect',
    /** Outcome unknown */
    UNKNOWN = 'unknown',
}

/**
 * Performance events
 */
export interface PerformanceLoadEvent extends BaseEvent {
    type: EventType.PERFORMANCE_LOAD;
    data: {
        /** Page load time (ms) */
        loadTime: number;
        /** DOM content loaded time (ms) */
        domContentLoaded: number;
        /** First contentful paint (ms) */
        firstContentfulPaint?: number;
        /** Largest contentful paint (ms) */
        largestContentfulPaint?: number;
    };
}

export interface PerformanceLatencyEvent extends BaseEvent {
    type: EventType.PERFORMANCE_LATENCY;
    data: {
        /** Operation that was slow */
        operation: string;
        /** Latency duration (ms) */
        latency: number;
        /** Threshold that was exceeded (ms) */
        threshold: number;
    };
}

/**
 * Friction indicator events
 */
export interface FrictionRapidClickEvent extends BaseEvent {
    type: EventType.FRICTION_RAPID_CLICK;
    data: {
        /** Target element */
        target: string;
        /** Number of rapid clicks */
        clickCount: number;
        /** Time window of clicks (ms) */
        timeWindow: number;
    };
}

export interface FrictionNavigationReversalEvent extends BaseEvent {
    type: EventType.FRICTION_NAVIGATION_REVERSAL;
    data: {
        /** Page navigated to */
        navigatedTo: string;
        /** Time before returning (ms) */
        timeOnPage: number;
        /** Page returned to */
        returnedTo: string;
    };
}

export interface FrictionErrorEvent extends BaseEvent {
    type: EventType.FRICTION_ERROR;
    data: {
        /** Error type (sanitized) */
        errorType: string;
        /** Error message (sanitized, no stack traces) */
        message?: string;
        /** Context where error occurred */
        errorContext: string;
    };
}

export interface FrictionFormAbandonmentEvent extends BaseEvent {
    type: EventType.FRICTION_FORM_ABANDONMENT;
    data: {
        /** Form identifier */
        formId?: string;
        /** Fields completed count */
        fieldsCompleted: number;
        /** Total field count */
        totalFields: number;
        /** Time spent before abandonment (ms) */
        timeSpent: number;
    };
}

/**
 * Union type of all possible events
 */
export type TelemetryEvent =
    | SessionStartEvent
    | SessionResumeEvent
    | SessionPauseEvent
    | SessionEndEvent
    | ViewTransitionEvent
    | NavigationBackEvent
    | NavigationForwardEvent
    | ActionClickEvent
    | ActionSubmitEvent
    | ActionFocusEvent
    | ActionInputEvent
    | PerformanceLoadEvent
    | PerformanceLatencyEvent
    | FrictionRapidClickEvent
    | FrictionNavigationReversalEvent
    | FrictionErrorEvent
    | FrictionFormAbandonmentEvent;

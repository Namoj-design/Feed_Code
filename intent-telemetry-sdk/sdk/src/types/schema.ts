/**
 * Event schema versioning and validation utilities
 */

import { TelemetryEvent, EVENT_SCHEMA_VERSION } from './events';

/**
 * Schema version comparison result
 */
export enum VersionCompatibility {
    COMPATIBLE = 'compatible',
    MINOR_UPGRADE = 'minor_upgrade',
    MAJOR_UPGRADE = 'major_upgrade',
    INCOMPATIBLE = 'incompatible',
}

/**
 * Parse semantic version string
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0,
    };
}

/**
 * Compare two schema versions for compatibility
 */
export function checkVersionCompatibility(
    eventVersion: string,
    sdkVersion: string = EVENT_SCHEMA_VERSION
): VersionCompatibility {
    const event = parseVersion(eventVersion);
    const sdk = parseVersion(sdkVersion);

    // Major version mismatch = incompatible
    if (event.major !== sdk.major) {
        return event.major > sdk.major
            ? VersionCompatibility.MAJOR_UPGRADE
            : VersionCompatibility.INCOMPATIBLE;
    }

    // Minor version difference = minor upgrade needed
    if (event.minor > sdk.minor) {
        return VersionCompatibility.MINOR_UPGRADE;
    }

    // Same major.minor or event is older = compatible
    return VersionCompatibility.COMPATIBLE;
}

/**
 * Validate event structure against schema
 */
export function validateEvent(event: unknown): event is TelemetryEvent {
    if (!event || typeof event !== 'object') {
        return false;
    }

    const e = event as Partial<TelemetryEvent>;

    // Check required base fields
    if (
        !e.schemaVersion ||
        !e.type ||
        !e.eventId ||
        !e.sessionId ||
        !e.timestamp ||
        typeof e.sequenceNumber !== 'number' ||
        !e.context
    ) {
        return false;
    }

    // Validate timestamp format (ISO 8601)
    const timestamp = new Date(e.timestamp);
    if (isNaN(timestamp.getTime())) {
        return false;
    }

    // Validate context structure
    const context = e.context;
    if (
        !context.viewport ||
        typeof context.viewport.width !== 'number' ||
        typeof context.viewport.height !== 'number' ||
        !context.device ||
        !context.device.type ||
        typeof context.device.touchEnabled !== 'boolean'
    ) {
        return false;
    }

    return true;
}

/**
 * Event batch validation
 */
export interface EventBatch {
    schemaVersion: string;
    batchId: string;
    timestamp: string;
    events: TelemetryEvent[];
}

/**
 * Validate an event batch
 */
export function validateEventBatch(batch: unknown): batch is EventBatch {
    if (!batch || typeof batch !== 'object') {
        return false;
    }

    const b = batch as Partial<EventBatch>;

    if (!b.schemaVersion || !b.batchId || !b.timestamp || !Array.isArray(b.events)) {
        return false;
    }

    // Validate all events in batch
    return b.events.every(validateEvent);
}

/**
 * Create a validated event batch
 */
export function createEventBatch(events: TelemetryEvent[]): EventBatch {
    return {
        schemaVersion: EVENT_SCHEMA_VERSION,
        batchId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        events,
    };
}

/**
 * Smoke — Feature Flag resolution (WF-02 STEP-3 Fase 3.1 DoD).
 * Eseguire: npm run platform-control:smoke
 */
import { evaluateFeatureFlag } from '../src/domain/platformControl/evaluateFeatureFlag';
import type { PlatformFeatureFlagRecord } from '../src/types/platformControl';

const baseFlag: PlatformFeatureFlagRecord = {
    key: 'feature.test.flag',
    category: 'test',
    label: 'Test Flag',
    valueType: 'boolean',
    defaultValue: true,
    supportsSchedule: true,
    supportsAudience: true,
    manualOverride: null,
    schedules: [],
    audience: ['registered'],
    blockedAudiences: [],
    messageKey: null,
    auditRequired: true,
};

const scheduleStart = '2026-07-17T10:00:00.000Z';
const scheduleEnd = '2026-07-17T12:00:00.000Z';
const duringSchedule = new Date('2026-07-17T11:00:00.000Z');
const outsideSchedule = new Date('2026-07-17T13:00:00.000Z');

const issues: string[] = [];

function assert(condition: boolean, message: string): void {
    if (!condition) issues.push(message);
}

// default
{
    const result = evaluateFeatureFlag(baseFlag, { userRole: 'user', isAuthenticated: true });
    assert(result.enabled === true && result.source === 'default', 'default should enable flag');
}

// manual_override wins over schedule
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        manualOverride: false,
        schedules: [
            { id: 's1', startsAt: scheduleStart, endsAt: scheduleEnd, value: true },
        ],
    };
    const result = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true }, duringSchedule);
    assert(result.enabled === false && result.source === 'manual_override', 'manual_override should win');
}

// schedule when no override
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        manualOverride: null,
        schedules: [
            { id: 's1', startsAt: scheduleStart, endsAt: scheduleEnd, value: false },
        ],
    };
    const active = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true }, duringSchedule);
    const inactive = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true }, outsideSchedule);
    assert(active.enabled === false && active.source === 'schedule', 'active schedule should apply');
    assert(inactive.enabled === true && inactive.source === 'default', 'outside schedule should use default');
}

// admin_all exempt from audience block
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        defaultValue: false,
        blockedAudiences: ['registered'],
    };
    const result = evaluateFeatureFlag(flag, { userRole: 'admin_all', isAuthenticated: true });
    assert(result.enabled === false && result.source === 'default', 'admin_all uses value not audience block');
    assert(result.source !== 'audience_blocked', 'admin_all must not be audience_blocked');
}

// registered user blocked
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        blockedAudiences: ['registered'],
    };
    const result = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true });
    assert(result.enabled === false && result.source === 'audience_blocked', 'registered block should apply');
}

// audience whitelist — registered user outside audience=["business"]
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        audience: ['business'],
        blockedAudiences: [],
    };
    const result = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true });
    assert(result.source === 'audience_blocked', 'audience whitelist should block registered user');
}

// number flag — defaultValue without override/schedule
{
    const flag: PlatformFeatureFlagRecord = {
        ...baseFlag,
        key: 'threshold.test.stars',
        valueType: 'number',
        defaultValue: 3,
        supportsSchedule: false,
        supportsAudience: false,
        manualOverride: null,
        schedules: [],
        audience: [],
        blockedAudiences: [],
    };
    const result = evaluateFeatureFlag(flag, { userRole: 'user', isAuthenticated: true });
    assert(result.effectiveValue === 3, 'number flag should keep defaultValue 3');
    assert(result.enabled === true, 'number flag enabled should remain true');
}

if (issues.length > 0) {
    console.error('[platform-control:smoke] FAILED');
    for (const issue of issues) console.error(' -', issue);
    process.exit(1);
}

console.log('[platform-control:smoke] OK —', 7, 'cases passed');

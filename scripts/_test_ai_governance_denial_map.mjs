/**
 * Pure unit checks for AI governance denial mapping (mirrors Edge mapConsumeDenial).
 * Run: node scripts/_test_ai_governance_denial_map.mjs
 */

function mapConsumeDenial(reason) {
  switch (reason) {
    case 'EMERGENCY_STOP':
      return 'EMERGENCY_STOP';
    case 'AI_DISABLED':
      return 'AI_DISABLED';
    case 'CREDITS_EXHAUSTED':
      return 'CREDITS_EXHAUSTED';
    case 'FORBIDDEN':
      return 'FORBIDDEN';
    case 'GUEST_ID_REQUIRED':
      return 'GUEST_ID_REQUIRED';
    case 'INVALID_GUEST_ID':
      return 'INVALID_GUEST_ID';
    case 'RATE_LIMIT_EXCEEDED':
      return 'CREDITS_EXHAUSTED';
    default:
      return reason && reason.trim() ? reason.trim() : 'CREDITS_EXHAUSTED';
  }
}

const cases = [
  ['CREDITS_EXHAUSTED', 'CREDITS_EXHAUSTED'],
  ['FORBIDDEN', 'FORBIDDEN'],
  ['GUEST_ID_REQUIRED', 'GUEST_ID_REQUIRED'],
  ['INVALID_GUEST_ID', 'INVALID_GUEST_ID'],
  ['EMERGENCY_STOP', 'EMERGENCY_STOP'],
  ['AI_DISABLED', 'AI_DISABLED'],
  ['RATE_LIMIT_EXCEEDED', 'CREDITS_EXHAUSTED'],
  [undefined, 'CREDITS_EXHAUSTED'],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = mapConsumeDenial(input);
  if (got !== expected) {
    console.error(`FAIL map(${JSON.stringify(input)}) => ${got}, expected ${expected}`);
    failed++;
  }
}

// Auth denials must never collapse to credits code
for (const reason of ['FORBIDDEN', 'GUEST_ID_REQUIRED', 'INVALID_GUEST_ID']) {
  const got = mapConsumeDenial(reason);
  if (got === 'CREDITS_EXHAUSTED' || got === 'RATE_LIMIT_EXCEEDED') {
    console.error(`FAIL auth reason ${reason} collapsed to credits`);
    failed++;
  }
}

if (failed) {
  console.error(`FAILED: ${failed}`);
  process.exit(1);
}
console.log('OK: denial map keeps auth/credits/kill-switch distinct');

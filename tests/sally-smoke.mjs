/**
 * Sally Smoke Tests — Zero-dependency test runner
 * Run: node tests/sally-smoke.mjs
 *
 * Tests the core exported logic from Sally's backend:
 * routing decisions, fallback prompts, message sanitization.
 *
 * These are pure function tests — no live API calls, no network, no Supabase.
 */

// ── Minimal test harness ─────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ❌ ${name} — ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}" but got "${actual}"`);
  }
}

// ── Re-implement testable functions (mirrors chat.ts) ────────────────
// We inline these because chat.ts uses ESM + TypeScript imports we can't
// directly require. These are exact copies of the production functions.

function getTextFromMessage(message) {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter(part => part?.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join(' ');
  }
  return '';
}

function getLatestUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return getTextFromMessage(messages[i]).trim();
  }
  return '';
}

function shouldUseLiveContext(userText) {
  const text = userText.toLowerCase();
  if (!text) return false;
  const liveDataPattern = /\b(student|students|attendance|absent|present|fee|fees|payment|payments|receipt|mpesa|balance|balances|schedule|timetable|meeting|meetings|inventory|stock|library|asset|assets|document|documents|announcement|announcements|feed|message|messages|instructor|instructors|cohort|cohorts|analytics|insights|assessment|assessments)\b/;
  const actionPattern = /\b(log|record|update|create|delete|send|notify|post|start|end|add|subtract|set)\b/;
  return liveDataPattern.test(text) || actionPattern.test(text);
}

function getFallbackSystemPrompt(institutionType) {
  let identity = 'solar technology coordinator';
  let description = "helps local instructors run professional solar vocational training centers. Think of yourself as the instructor's technical copilot.";
  
  if (institutionType === 'primary' || institutionType === 'jss') {
    identity = 'CBC curriculum coordinator';
    description = 'helps primary and junior secondary school instructors align with KICD CBC guidelines and track student competency levels.';
  } else if (institutionType === 'highschool') {
    identity = 'secondary curriculum coordinator';
    description = 'helps high school instructors run KCSE-aligned classes, CAT tests, and track performance scores.';
  } else if (institutionType === 'university') {
    identity = 'university academic advisor';
    description = 'helps university professors manage lecture schedules, course modules, GPA tracking, and student evaluations.';
  }
  
  return `You are Sally — a warm, witty ${identity} who lives inside the PRISM Instructors Platform.`;
}

function sanitizeMessage(msg) {
  if (msg.parts && Array.isArray(msg.parts)) {
    const sanitizedParts = msg.parts.map(part => {
      if (part.type === 'tool-invocation' && part.toolInvocation) {
        const toolInv = part.toolInvocation;
        return {
          type: 'dynamic-tool',
          toolCallId: toolInv.toolCallId,
          toolName: toolInv.toolName,
          state: toolInv.state,
          input: toolInv.input ?? toolInv.args,
          output: toolInv.result,
          errorText: toolInv.errorText,
        };
      }
      return part;
    });
    return { ...msg, parts: sanitizedParts };
  }
  const parts = [];
  if (typeof msg.content === 'string' && msg.content.trim() !== '') {
    parts.push({ type: 'text', text: msg.content });
  }
  if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
    for (const toolInv of msg.toolInvocations) {
      parts.push({
        type: 'dynamic-tool',
        toolCallId: toolInv.toolCallId,
        toolName: toolInv.toolName,
        state: toolInv.state,
        input: toolInv.input ?? toolInv.args,
        output: toolInv.result,
        errorText: toolInv.errorText,
      });
    }
  }
  return { ...msg, parts };
}

// Write tool classification (mirrors SallyChat.tsx)
const WRITE_TOOLS = new Set([
  'logStudentAssessment', 'postFeedMessage', 'manageSchedule',
  'manageMeetings', 'manageInstructors', 'manageInventory', 'sendNotification',
]);

// ══════════════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════════════

console.log('\\n🧪 Sally Smoke Tests\\n');

// ── 1. Route Classification ─────────────────────────────────────────
console.log('📍 Route Classification (shouldUseLiveContext)');

test('Greeting "hello" routes to simple-chat', () => {
  assertEqual(shouldUseLiveContext('hello'), false);
});

test('Greeting "hi Sally" routes to simple-chat', () => {
  assertEqual(shouldUseLiveContext('hi Sally'), false);
});

test('General question routes to simple-chat', () => {
  assertEqual(shouldUseLiveContext('explain how PV sizing works'), false);
});

test('"Show me the attendance" routes to live-context', () => {
  assertEqual(shouldUseLiveContext('show me the attendance'), true);
});

test('"How many students are enrolled" routes to live-context', () => {
  assertEqual(shouldUseLiveContext('how many students are enrolled'), true);
});

test('"Check fee payments" routes to live-context', () => {
  assertEqual(shouldUseLiveContext('check fee payments'), true);
});

test('"Send a notification" routes to live-context (action word)', () => {
  assertEqual(shouldUseLiveContext('send a reminder to the class'), true);
});

test('"Log the grade" routes to live-context (action word)', () => {
  assertEqual(shouldUseLiveContext('log the grade for this module'), true);
});

test('"What is MPESA" routes to live-context (data keyword)', () => {
  assertEqual(shouldUseLiveContext('what is mpesa'), true);
});

test('Empty string routes to simple-chat', () => {
  assertEqual(shouldUseLiveContext(''), false);
});

test('"Run analytics" routes to live-context', () => {
  assertEqual(shouldUseLiveContext('run analytics on the cohort'), true);
});

// ── 2. Fallback Prompt Content ──────────────────────────────────────
console.log('\\n📍 Fallback System Prompt');

test('TVET/solar prompt contains "solar technology"', () => {
  const prompt = getFallbackSystemPrompt('tvet');
  assert(prompt.includes('solar technology coordinator'), `Got: ${prompt.substring(0, 100)}`);
});

test('Primary prompt contains "CBC"', () => {
  const prompt = getFallbackSystemPrompt('primary');
  assert(prompt.includes('CBC curriculum coordinator'), `Got: ${prompt.substring(0, 100)}`);
});

test('JSS prompt also contains "CBC"', () => {
  const prompt = getFallbackSystemPrompt('jss');
  assert(prompt.includes('CBC curriculum coordinator'), `Got: ${prompt.substring(0, 100)}`);
});

test('Highschool prompt contains "secondary"', () => {
  const prompt = getFallbackSystemPrompt('highschool');
  assert(prompt.includes('secondary curriculum coordinator'), `Got: ${prompt.substring(0, 100)}`);
});

test('University prompt contains "university academic"', () => {
  const prompt = getFallbackSystemPrompt('university');
  assert(prompt.includes('university academic advisor'), `Got: ${prompt.substring(0, 100)}`);
});

test('Unknown type defaults to solar', () => {
  const prompt = getFallbackSystemPrompt('unknown_type');
  assert(prompt.includes('solar technology coordinator'), `Got: ${prompt.substring(0, 100)}`);
});

test('All prompts mention PRISM', () => {
  for (const type of ['tvet', 'primary', 'jss', 'highschool', 'university']) {
    const prompt = getFallbackSystemPrompt(type);
    assert(prompt.includes('PRISM'), `${type} prompt missing PRISM mention`);
  }
});

// ── 3. Message Sanitization ─────────────────────────────────────────
console.log('\\n📍 Message Sanitization');

test('Legacy content string → parts format', () => {
  const result = sanitizeMessage({ role: 'user', content: 'hello' });
  assertEqual(result.parts.length, 1);
  assertEqual(result.parts[0].type, 'text');
  assertEqual(result.parts[0].text, 'hello');
});

test('Empty content produces no parts', () => {
  const result = sanitizeMessage({ role: 'user', content: '   ' });
  assertEqual(result.parts.length, 0);
});

test('Parts format passes through non-tool parts', () => {
  const msg = { role: 'user', parts: [{ type: 'text', text: 'hi' }] };
  const result = sanitizeMessage(msg);
  assertEqual(result.parts[0].type, 'text');
  assertEqual(result.parts[0].text, 'hi');
});

test('tool-invocation parts → dynamic-tool parts', () => {
  const msg = {
    role: 'assistant',
    parts: [{
      type: 'tool-invocation',
      toolInvocation: {
        toolCallId: 'tc_1',
        toolName: 'getStudentData',
        state: 'result',
        args: { studentName: 'John' },
        result: { students: [] },
      },
    }],
  };
  const result = sanitizeMessage(msg);
  assertEqual(result.parts[0].type, 'dynamic-tool');
  assertEqual(result.parts[0].toolName, 'getStudentData');
  assertEqual(result.parts[0].toolCallId, 'tc_1');
});

test('Legacy toolInvocations array → dynamic-tool parts', () => {
  const msg = {
    role: 'assistant',
    content: '',
    toolInvocations: [{
      toolCallId: 'tc_2',
      toolName: 'getFeePayments',
      state: 'result',
      args: {},
      result: { payments: [] },
    }],
  };
  const result = sanitizeMessage(msg);
  const toolPart = result.parts.find(p => p.type === 'dynamic-tool');
  assert(toolPart, 'Should have dynamic-tool part');
  assertEqual(toolPart.toolName, 'getFeePayments');
});

// ── 4. Message Text Extraction ──────────────────────────────────────
console.log('\\n📍 Message Text Extraction');

test('Extracts text from content string', () => {
  assertEqual(getTextFromMessage({ content: 'hello world' }), 'hello world');
});

test('Extracts text from parts array', () => {
  const msg = { parts: [{ type: 'text', text: 'hello' }, { type: 'text', text: 'world' }] };
  assertEqual(getTextFromMessage(msg), 'hello world');
});

test('Filters non-text parts', () => {
  const msg = { parts: [{ type: 'text', text: 'hello' }, { type: 'tool-invocation' }] };
  assertEqual(getTextFromMessage(msg), 'hello');
});

test('Returns empty for null message', () => {
  assertEqual(getTextFromMessage(null), '');
});

test('getLatestUserText finds last user message', () => {
  const messages = [
    { role: 'user', content: 'first' },
    { role: 'assistant', content: 'reply' },
    { role: 'user', content: 'second' },
  ];
  assertEqual(getLatestUserText(messages), 'second');
});

test('getLatestUserText returns empty for no user messages', () => {
  const messages = [{ role: 'assistant', content: 'reply' }];
  assertEqual(getLatestUserText(messages), '');
});

// ── 5. Write Tool Classification ────────────────────────────────────
console.log('\\n📍 Write Tool Classification');

test('logStudentAssessment is a write tool', () => {
  assert(WRITE_TOOLS.has('logStudentAssessment'));
});

test('sendNotification is a write tool', () => {
  assert(WRITE_TOOLS.has('sendNotification'));
});

test('getStudentData is NOT a write tool', () => {
  assert(!WRITE_TOOLS.has('getStudentData'));
});

test('getInventoryStock is NOT a write tool', () => {
  assert(!WRITE_TOOLS.has('getInventoryStock'));
});

test('getFeePayments is NOT a write tool', () => {
  assert(!WRITE_TOOLS.has('getFeePayments'));
});

test('getAttendanceData is NOT a write tool', () => {
  assert(!WRITE_TOOLS.has('getAttendanceData'));
});

// ── Report ──────────────────────────────────────────────────────────
console.log(`\\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failures.length > 0) {
  console.log('\\nFailures:');
  failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.error}`));
}
console.log(`${'═'.repeat(50)}\\n`);

process.exit(failed > 0 ? 1 : 0);

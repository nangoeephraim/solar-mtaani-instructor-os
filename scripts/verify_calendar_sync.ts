
import { syncScheduleToGoogle } from '../services/calendarService';
import { ScheduleSlot } from '../types';

// Mock Fetch
const mockFetch = (url: string, options: any) => {
    // 1. GET events
    if (url.includes('/events?') && options.method !== 'POST' && options.method !== 'PATCH') {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: global.mockGoogleEvents || [] })
        });
    }

    // 2. POST event (Create)
    if (url.includes('/events') && options.method === 'POST') {
        global.postCalls.push(JSON.parse(options.body));
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'new-google-id', ...JSON.parse(options.body) })
        });
    }

    // 3. PATCH event (Update)
    if (url.includes('/events/') && options.method === 'PATCH') {
        global.patchCalls.push({ url, body: JSON.parse(options.body) });
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'updated-id' })
        });
    }

    return Promise.reject('Unknown URL');
};

// @ts-ignore
global.fetch = mockFetch;
// @ts-ignore
global.postCalls = [];
// @ts-ignore
global.patchCalls = [];
// @ts-ignore
global.mockGoogleEvents = [];

const mockSlots: ScheduleSlot[] = [
    {
        id: 'slot-1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        durationMinutes: 60,
        subject: 'Solar',
        grade: 'L3',
        status: 'Pending',
    }
];

// Week Dates: Just Monday for valid match
const monday = new Date();
// Set to a Monday
const day = monday.getDay();
const diff = monday.getDate() - day + (day == 0 ? -6 : 1);
monday.setDate(diff);
const weekDates = [monday];

async function runTests() {
    console.log('--- Verifying syncScheduleToGoogle ---');

    // Test 1: Create New Event (No Google Events exist)
    // @ts-ignore
    global.mockGoogleEvents = [];
    // @ts-ignore
    global.postCalls = [];

    await syncScheduleToGoogle(mockSlots, 'fake-token', weekDates);

    // @ts-ignore
    const posts = global.postCalls;
    console.log('Test 1 (Create New):', posts.length === 1 && posts[0].extendedProperties.private.prismSlotId === 'slot-1' ? 'PASS' : `FAIL (Expected 1 POST, got ${posts.length})`);

    // Test 2: Update Existing Event
    // @ts-ignore
    global.mockGoogleEvents = [{
        id: 'g-event-1',
        start: { dateTime: new Date(monday.setHours(9, 0, 0, 0)).toISOString() }, // Match time
        extendedProperties: { private: { prismSlotId: 'slot-1' } } // Match ID
    }];
    // @ts-ignore
    global.postCalls = [];
    // @ts-ignore
    global.patchCalls = [];

    await syncScheduleToGoogle(mockSlots, 'fake-token', weekDates);

    // @ts-ignore
    const patches = global.patchCalls;
    // @ts-ignore
    const posts2 = global.postCalls;

    console.log('Test 2 (Update Existing):',
        patches.length === 1 && posts2.length === 0 ? 'PASS' :
            `FAIL (Expected 1 PATCH, 0 POST. Got ${patches.length} PATCH, ${posts2.length} POST)`
    );
}

runTests();

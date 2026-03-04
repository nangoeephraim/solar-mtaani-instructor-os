
import { detectConflicts, findBestSlot, timeToMinutes } from '../utils/scheduling';
import { ScheduleSlot } from '../types';

const mockSlots: ScheduleSlot[] = [
    {
        id: '1',
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        durationMinutes: 60,
        subject: 'Solar',
        grade: 'L3',
        status: 'Pending',
        resourceIds: ['room-101']
    },
    {
        id: '2',
        dayOfWeek: 1, // Monday
        startTime: '11:00',
        durationMinutes: 60,
        subject: 'ICT',
        grade: 'L3',
        status: 'Pending',
        resourceIds: ['lab-1']
    }
];

console.log('--- Verifying detectConflicts ---');

// Test 1: No Conflict
const noConflict = detectConflicts({
    startTime: '13:00',
    durationMinutes: 60,
    resourceIds: ['room-102']
}, mockSlots);
console.log('Test 1 (No Conflict):', noConflict.length === 0 ? 'PASS' : `FAIL (${noConflict.length} conflicts)`);

// Test 2: Time Overlap (Direct)
const timeOverlap = detectConflicts({
    startTime: '09:30', // Overlaps with 09:00-10:00
    durationMinutes: 60,
    resourceIds: ['room-102']
}, mockSlots);
console.log('Test 2 (Time Overlap):', timeOverlap.length === 1 && timeOverlap[0].type === 'time' ? 'PASS' : `FAIL (${JSON.stringify(timeOverlap)})`);

// Test 3: Resource Conflict
const resourceConflict = detectConflicts({
    startTime: '09:30', // Overlaps
    durationMinutes: 60,
    resourceIds: ['room-101'] // Conflict with slot 1
}, mockSlots);
// Should return resource conflict (which implies time conflict too, but resource is specific)
// The function returns ALL conflicts.
const hasResource = resourceConflict.some(c => c.type === 'resource');
console.log('Test 3 (Resource Conflict):', hasResource ? 'PASS' : `FAIL (${JSON.stringify(resourceConflict)})`);


console.log('\n--- Verifying findBestSlot ---');

// Test 4: Find Slot
const bestSlot = findBestSlot(60, mockSlots, { start: 9 * 60, end: 17 * 60 });
// 09:00-10:00 taken. 11:00-12:00 taken.
// Should find 10:00 or 12:00+. 
// 10:00 is available (10:00-11:00).
console.log('Test 4 (Find Best Slot):', bestSlot === '10:00' ? 'PASS' : `FAIL (Got ${bestSlot})`);


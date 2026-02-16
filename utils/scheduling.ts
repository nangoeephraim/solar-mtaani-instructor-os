import { ScheduleSlot, Holiday } from '../types';

/**
 * Converts a time string (HH:MM) to minutes from midnight
 */
export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Checks if two time ranges overlap
 */
export const doTimesOverlap = (
    start1: number,
    duration1: number,
    start2: number,
    duration2: number
): boolean => {
    const end1 = start1 + duration1;
    const end2 = start2 + duration2;
    return start1 < end2 && start2 < end1;
};

export interface Conflict {
    type: 'time' | 'resource';
    slotId: string;
    subject: string;
    message: string;
}

/**
 * Detects conflicts for a given slot against a list of other slots
 */
export const detectConflicts = (
    newSlot: { id?: string; startTime: string; durationMinutes: number; resourceIds?: string[] },
    existingSlots: ScheduleSlot[]
): Conflict[] => {
    const newStart = timeToMinutes(newSlot.startTime);
    const newDuration = newSlot.durationMinutes;
    const conflicts: Conflict[] = [];

    for (const slot of existingSlots) {
        // Skip self
        if (newSlot.id && slot.id === newSlot.id) continue;

        // Skip cancelled slots
        if (slot.status === 'Cancelled') continue;

        const slotStart = timeToMinutes(slot.startTime);

        if (doTimesOverlap(newStart, newDuration, slotStart, slot.durationMinutes)) {
            // Check Resource Overlap
            let isResourceConflict = false;
            if (newSlot.resourceIds && slot.resourceIds) {
                const sharedResources = newSlot.resourceIds.filter(r => slot.resourceIds?.includes(r));
                if (sharedResources.length > 0) {
                    conflicts.push({
                        type: 'resource',
                        slotId: slot.id,
                        subject: slot.subject,
                        message: `Resource conflict with ${slot.subject}`
                    });
                    isResourceConflict = true;
                }
            }

            // General Time Conflict (Instructor Availability)
            // Even if resources don't conflict, the instructor can't be in two places.
            if (!isResourceConflict) {
                conflicts.push({
                    type: 'time',
                    slotId: slot.id,
                    subject: slot.subject,
                    message: `Time overlap with ${slot.subject}`
                });
            }
        }
    }
    return conflicts;
};

/**
 * Finds the best available time slot for a given duration
 */
export const findBestSlot = (
    durationMinutes: number,
    existingSlots: ScheduleSlot[],
    preferredTimeRange: { start: number; end: number } = { start: 8 * 60, end: 16 * 60 } // 08:00 - 16:00
): string | null => {
    // Simple heuristic: Try every 30 min from start time
    for (let time = preferredTimeRange.start; time <= preferredTimeRange.end - durationMinutes; time += 30) {
        const potentialEnd = time + durationMinutes;

        // Check for collision with ANY existing slot
        const hasCollision = existingSlots.some(slot => {
            if (slot.status === 'Cancelled') return false;
            const sStart = timeToMinutes(slot.startTime);
            return doTimesOverlap(time, durationMinutes, sStart, slot.durationMinutes);
        });

        if (!hasCollision) {
            const h = Math.floor(time / 60);
            const m = time % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
    }
    return null;
};

/**
 * Checks if a given date is a holiday
 */
export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return holidays.find(h => dateStr >= h.startDate && dateStr <= h.endDate);
};

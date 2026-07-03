import { ScheduleSlot, Holiday, Resource } from '../types';

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
    preferredTimeRange: { start: number; end: number } = { start: 6 * 60, end: 22 * 60 } // 06:00 - 22:00
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

export interface RecommendedResource {
    resource: Resource;
    fitScore: number;
    isAvailable: boolean;
    capacityFit: number;
    conflictingSlot?: ScheduleSlot;
}

/**
 * Recommends resources based on availability, capacity matching, and status.
 */
export const recommendResources = (
    slot: { startTime: string; durationMinutes: number; dayOfWeek: number; studentCount?: number },
    resources: Resource[],
    schedule: ScheduleSlot[]
): RecommendedResource[] => {
    const slotStart = timeToMinutes(slot.startTime);
    const slotDuration = slot.durationMinutes;
    const targetDay = slot.dayOfWeek;
    const targetCount = slot.studentCount || 0;

    return resources.map(res => {
        let isAvailable = true;
        let conflictingSlot: ScheduleSlot | undefined;
        
        if (res.status === 'maintenance') {
            isAvailable = false;
        } else {
            const resourceSlots = schedule.filter(s => 
                s.status !== 'Cancelled' && 
                s.dayOfWeek === targetDay && 
                s.resourceIds?.includes(res.id)
            );
            
            for (const rSlot of resourceSlots) {
                const rStart = timeToMinutes(rSlot.startTime);
                if (doTimesOverlap(slotStart, slotDuration, rStart, rSlot.durationMinutes)) {
                    isAvailable = false;
                    conflictingSlot = rSlot;
                    break;
                }
            }
        }

        let capacityFit = 1;
        if (res.capacity && targetCount > 0) {
            if (res.capacity < targetCount) {
                capacityFit = 0.1;
            } else {
                capacityFit = 1 - ((res.capacity - targetCount) / res.capacity);
            }
        }

        const statusScore = res.status === 'available' ? 1.0 : res.status === 'in-use' ? 0.5 : 0.0;
        const availabilityWeight = isAvailable ? 1.0 : 0.0;
        const fitScore = (0.6 * availabilityWeight) + (0.3 * capacityFit) + (0.1 * statusScore);

        return {
            resource: res,
            fitScore: Math.round(fitScore * 100),
            isAvailable,
            capacityFit,
            conflictingSlot
        };
    }).sort((a, b) => b.fitScore - a.fitScore);
};

/**
 * Calculates a resource's weekly utilization based on scheduled teaching hours.
 */
export const calculateResourceUtilization = (
    resourceId: string,
    schedule: ScheduleSlot[]
): { hoursBooked: number; percentage: number } => {
    const activeSlots = schedule.filter(s => 
        s.status !== 'Cancelled' && 
        s.resourceIds?.includes(resourceId)
    );

    const totalMinutes = activeSlots.reduce((acc, slot) => acc + (slot.durationMinutes || 60), 0);
    const hoursBooked = parseFloat((totalMinutes / 60).toFixed(1));
    const weeklyHoursCapacity = 40; // 40 hour standard week
    const percentage = Math.min(Math.round((hoursBooked / weeklyHoursCapacity) * 100), 100);

    return {
        hoursBooked,
        percentage
    };
};

import { ScheduleSlot } from '../types';

/**
 * Creates a Google Calendar event object from a ScheduleSlot
 */
const createGoogleEventBody = (slot: ScheduleSlot, dateStr: string) => {
    // dateStr is YYYY-MM-DD
    // slot.startTime is HH:MM
    const startDateTime = `${dateStr}T${slot.startTime}:00`;

    // Calculate end time
    const [hours, mins] = slot.startTime.split(':').map(Number);
    const totalMins = hours * 60 + mins + slot.durationMinutes;
    const endHours = Math.floor(totalMins / 60);
    const endMins = totalMins % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    const endDateTime = `${dateStr}T${endTime}:00`;

    return {
        summary: `${slot.subject === 'Solar' ? '☀️' : '💻'} ${slot.subject} Class (Grade ${slot.grade})`,
        description: `Grade ${slot.grade} - ${slot.subject}\nStatus: ${slot.status}\n\n[Managed by PRISM]`,
        start: {
            dateTime: new Date(startDateTime).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: new Date(endDateTime).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        extendedProperties: {
            private: {
                prismSlotId: slot.id,
                prismVersion: "2.0"
            }
        }
    };
};

/**
 * Syncs the schedule to Google Calendar with Idempotency
 * Updates existing events, Creates new ones.
 * Returns updated slots with new googleEventIds.
 */
export const syncScheduleToGoogle = async (
    schedule: ScheduleSlot[],
    accessToken: string,
    weekDates: Date[]
): Promise<{ successCount: number; failCount: number; updatedSchedule: ScheduleSlot[] }> => {
    let successCount = 0;
    let failCount = 0;
    const updatedSchedule = [...schedule];

    // 1. Prepare the valid slots to sync (Resolving recurrences to check against)
    // We only sync the specific dates in the view (weekDates).
    // But since `schedule` contains *recurring* rules, we need to know:
    // "For this Recurring Slot X, is there an event on Date Y?"

    // Strategy:
    // We will query Google for ALL events in this week's range.
    // Then for each "Active Slot Instance" in our local view, we check if it exists in Google.

    const startDate = new Date(weekDates[0]);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(weekDates[weekDates.length - 1]);
    endDate.setHours(23, 59, 59, 999);

    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();

    // 2. Fetch Existing Google Events
    let existingGoogleEvents: any[] = [];
    try {
        const queryParams = new URLSearchParams({
            timeMin,
            timeMax,
            singleEvents: 'true',
            privateExtendedProperty: 'prismVersion=2.0' // Only fetch our events
        });

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${queryParams}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            existingGoogleEvents = data.items || [];
        }
    } catch (e) {
        console.warn("Failed to fetch existing events, proceeding with blind create (may cause dupes)", e);
    }

    // 3. Process each day
    const getDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    for (const date of weekDates) {
        const dateStr = getDateStr(date);
        const dayOfWeek = date.getDay();

        // Identify active slots for this day
        // (Logic copied from Schedule.tsx/getVisibleSlots basically)
        const recurring = schedule.filter(s => s.dayOfWeek === dayOfWeek && !s.overrideDate);
        const overrides = schedule.filter(s => s.overrideDate === dateStr);
        const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));

        // Active slots for this specific date
        const activeSlots = [
            ...recurring.filter(r => !replacedIds.has(r.id)),
            ...overrides
        ].filter(s => s.status !== 'Cancelled');

        for (const slot of activeSlots) {
            const eventBody = createGoogleEventBody(slot, dateStr);

            // Find match in existing Google Events
            // Match by 'prismSlotId' stored in privateExtendedProperty
            // AND ensure it's on the same day (for recurring slots, ID is same across days)
            const match = existingGoogleEvents.find(ev =>
                ev.extendedProperties?.private?.prismSlotId === slot.id &&
                ev.start.dateTime.startsWith(dateStr)
            );

            try {
                if (match) {
                    // Update (PATCH)
                    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${match.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventBody)
                    });
                    if (response.ok) successCount++;
                    else failCount++;
                } else {
                    // Create (POST)
                    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventBody)
                    });

                    if (response.ok) {
                        const newEvent = await response.json();
                        successCount++;
                        // If it's a one-off override, we can save the ID.
                        // If it's recurring, saving one ID isn't enough (need 1 per day).
                        // So we RELY on extendedProperties for matching next time.
                    } else {
                        failCount++;
                    }
                }
            } catch (e) {
                console.error("Sync error", e);
                failCount++;
            }
        }
    }

    return { successCount, failCount, updatedSchedule };
};

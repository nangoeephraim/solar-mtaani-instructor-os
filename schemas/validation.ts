import { z } from 'zod';
import { Subject } from '../types';

// Kenyan phone number regex (supports +254 and 07/01 formats)
const kenyanPhoneRegex = /^(\+254|0)?[17]\d{8}$/;

/**
 * Student Form Validation Schema
 * Validates all student fields with proper error messages
 */
export const studentSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

    grade: z.number()
        .int('Grade must be a whole number')
        .min(1, 'Grade must be at least 1')
        .max(12, 'Grade cannot exceed 12'),

    lot: z.string()
        .regex(/^\d{4}$/, 'Lot must be a 4-digit year (e.g., 2025)'),

    subject: z.enum(['Solar', 'ICT']),

    email: z.string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),

    phone: z.string()
        .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number (e.g., 0712345678 or +254712345678)')
        .optional()
        .or(z.literal('')),

    dateOfBirth: z.string()
        .optional()
        .refine((date) => {
            if (!date) return true;
            const parsed = new Date(date);
            const now = new Date();
            const minAge = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
            return parsed <= minAge;
        }, 'Student must be at least 5 years old'),

    enrollmentDate: z.string().optional(),

    guardianName: z.string()
        .max(100, 'Guardian name is too long')
        .optional()
        .or(z.literal('')),

    guardianPhone: z.string()
        .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number')
        .optional()
        .or(z.literal('')),

    address: z.string()
        .max(500, 'Address is too long')
        .optional()
        .or(z.literal('')),

    notes: z.array(z.string()).optional().default([]),
});

export type StudentFormData = z.infer<typeof studentSchema>;

/**
 * Schedule Slot Validation Schema
 */
export const scheduleSlotSchema = z.object({
    dayOfWeek: z.number()
        .int()
        .min(1, 'Day must be Monday (1) to Friday (5)')
        .max(5, 'Day must be Monday (1) to Friday (5)'),

    startTime: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (use HH:MM)'),

    durationMinutes: z.number()
        .int()
        .min(15, 'Duration must be at least 15 minutes')
        .max(240, 'Duration cannot exceed 4 hours'),

    grade: z.number()
        .int()
        .min(1)
        .max(12),

    subject: z.enum(['Solar', 'ICT']),

    status: z.enum(['Pending', 'Completed', 'Skipped', 'Cancelled']),

    overrideDate: z.string().optional(),

    replacesSlotId: z.string().optional(),
});

export type ScheduleSlotFormData = z.infer<typeof scheduleSlotSchema>;

/**
 * Attendance Record Validation Schema
 */
export const attendanceSchema = z.object({
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

    slotId: z.string().optional(),

    status: z.enum(['present', 'absent']),

    notes: z.string().max(500).optional(),
});

export type AttendanceFormData = z.infer<typeof attendanceSchema>;

/**
 * Competency Update Validation Schema
 */
export const competencyUpdateSchema = z.object({
    competencyKey: z.string().min(1, 'Competency key is required'),
    level: z.number()
        .int()
        .min(1, 'Level must be 1 (Emerging) to 4 (Mastered)')
        .max(4, 'Level must be 1 (Emerging) to 4 (Mastered)'),
});

export type CompetencyUpdateData = z.infer<typeof competencyUpdateSchema>;

/**
 * Settings Validation Schema
 */
export const settingsSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name is too long'),

    organization: z.string()
        .max(200, 'Organization name is too long')
        .optional()
        .or(z.literal('')),

    preferences: z.object({
        theme: z.enum(['light', 'dark', 'system']),
        accentColor: z.enum(['blue', 'orange', 'green', 'purple']),
        enableAI: z.boolean(),
        reducedMotion: z.boolean(),
        notificationsEnabled: z.boolean(),
    }),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

/**
 * Helper function to validate data and return formatted errors
 */
export function validateWithSchema<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });

    return { success: false, errors };
}

/**
 * Hook-friendly validation helper
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
    return {
        validate: (data: unknown) => validateWithSchema(schema, data),
        validateField: (field: string, value: unknown) => {
            const fieldSchema = (schema as z.ZodObject<any>).shape?.[field];
            if (!fieldSchema) return { success: true };
            return validateWithSchema(fieldSchema, value);
        },
    };
}

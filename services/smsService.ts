import { supabase } from './supabase';

/**
 * SMS Service — Client-side helpers that invoke a Supabase Edge Function
 * for Africa's Talking SMS API integration.
 *
 * REQUIRED SUPABASE SECRETS (set via `supabase secrets set`):
 *   - AT_API_KEY       (Africa's Talking API Key)
 *   - AT_USERNAME      (Africa's Talking Username, e.g. 'sandbox')
 *   - AT_SENDER_ID     (Optional sender ID, e.g. 'PRISM')
 */

export interface SMSResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send a single SMS message via the Supabase Edge Function.
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
        const formatted = formatPhoneForSMS(phoneNumber);
        if (!formatted) {
            return { success: false, error: 'Invalid phone number format' };
        }

        const { data, error } = await supabase.functions.invoke('send-sms', {
            body: { to: formatted, message }
        });

        if (error) {
            console.error('SMS send error:', error);
            return { success: false, error: error.message || 'Failed to send SMS' };
        }

        return { success: true, messageId: data?.messageId };
    } catch (err: any) {
        console.error('SMS service error:', err);
        return { success: false, error: err.message || 'Network error' };
    }
}

/**
 * Send an attendance alert to a student's guardian.
 */
export async function sendAttendanceAlert(
    studentName: string,
    guardianPhone: string,
    date: string,
    status: 'absent' | 'present'
): Promise<SMSResponse> {
    const dateStr = new Date(date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' });
    const message = status === 'absent'
        ? `[PRISM] Dear Parent, ${studentName} was marked ABSENT on ${dateStr}. Please contact the school for details.`
        : `[PRISM] Dear Parent, ${studentName} was present on ${dateStr}. Thank you!`;
    return sendSMS(guardianPhone, message);
}

/**
 * Send a fee payment reminder to a student's guardian.
 */
export async function sendFeeReminder(
    studentName: string,
    guardianPhone: string,
    balance: number
): Promise<SMSResponse> {
    const message = `[PRISM] Dear Parent, ${studentName} has an outstanding fee balance of KES ${balance.toLocaleString()}. Please make payment at your earliest convenience. Thank you.`;
    return sendSMS(guardianPhone, message);
}

/**
 * Send a fee payment confirmation receipt.
 */
export async function sendPaymentReceipt(
    studentName: string,
    guardianPhone: string,
    amount: number,
    receiptNumber?: string
): Promise<SMSResponse> {
    const receipt = receiptNumber ? ` Receipt: ${receiptNumber}.` : '';
    const message = `[PRISM] Payment of KES ${amount.toLocaleString()} received for ${studentName}.${receipt} Thank you!`;
    return sendSMS(guardianPhone, message);
}

/**
 * Send a grade report summary to a student's guardian.
 */
export async function sendGradeReport(
    studentName: string,
    guardianPhone: string,
    term: number,
    averageScore: number,
    position?: number
): Promise<SMSResponse> {
    const posStr = position ? ` Position: ${position}.` : '';
    const message = `[PRISM] Term ${term} Report for ${studentName}: Average Score ${averageScore.toFixed(1)}%.${posStr} Visit the school for the full report card.`;
    return sendSMS(guardianPhone, message);
}

/**
 * Format phone number for SMS (Africa's Talking format: +254XXXXXXXXX)
 */
function formatPhoneForSMS(phone: string): string | null {
    const cleaned = phone.replace(/[\s\-]/g, '');

    if (/^\+254[17]\d{8}$/.test(cleaned)) return cleaned;
    if (/^254[17]\d{8}$/.test(cleaned)) return '+' + cleaned;
    if (/^0[17]\d{8}$/.test(cleaned)) return '+254' + cleaned.substring(1);
    if (/^[17]\d{8}$/.test(cleaned)) return '+254' + cleaned;
    return null;
}

import { supabase } from './supabase';
import { FeePayment, PaymentStatus } from '../types';

/**
 * M-Pesa Service — Client-side helpers that invoke Supabase Edge Functions
 * for Safaricom Daraja API integration.
 *
 * REQUIRED SUPABASE SECRETS (set via `supabase secrets set`):
 *   - MPESA_CONSUMER_KEY
 *   - MPESA_CONSUMER_SECRET
 *   - MPESA_SHORTCODE
 *   - MPESA_PASSKEY
 *   - MPESA_CALLBACK_URL (your Edge Function URL for mpesa-callback)
 *   - MPESA_ENV ('sandbox' | 'production')
 */

export interface MpesaSTKResponse {
    success: boolean;
    checkoutRequestId?: string;
    merchantRequestId?: string;
    responseDescription?: string;
    error?: string;
}

/**
 * Initiate an M-Pesa STK Push to a student's (or guardian's) phone.
 * This triggers a payment prompt on their phone.
 */
export async function initiateMpesaPayment(
    phoneNumber: string,
    amount: number,
    studentId: number,
    studentName: string,
    recordedBy: string,
    feeStructureId?: string,
    term?: 1 | 2 | 3
): Promise<MpesaSTKResponse> {
    try {
        // Format phone number: ensure it starts with 254
        const formattedPhone = formatKenyanPhone(phoneNumber);
        if (!formattedPhone) {
            return { success: false, error: 'Invalid phone number. Use format 07XXXXXXXX or 254XXXXXXXXX' };
        }

        const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
            body: {
                phoneNumber: formattedPhone,
                amount: Math.ceil(amount), // M-Pesa doesn't support decimals
                studentId,
                studentName,
                recordedBy,
                feeStructureId,
                term,
                accountReference: `PRISM-${studentId}`,
                transactionDesc: `Fee payment for ${studentName}`
            }
        });

        if (error) {
            console.error('M-Pesa STK Push error:', error);
            return { success: false, error: error.message || 'Failed to initiate payment' };
        }

        return {
            success: true,
            checkoutRequestId: data?.CheckoutRequestID,
            merchantRequestId: data?.MerchantRequestID,
            responseDescription: data?.ResponseDescription
        };
    } catch (err: any) {
        console.error('M-Pesa service error:', err);
        return { success: false, error: err.message || 'Network error' };
    }
}

/**
 * Check the status of a pending M-Pesa payment.
 */
export async function checkMpesaPaymentStatus(
    checkoutRequestId: string
): Promise<{ status: PaymentStatus; receiptNumber?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke('mpesa-query', {
            body: { checkoutRequestId }
        });

        if (error || !data) {
            return { status: 'pending' };
        }

        if (data.ResultCode === '0' || data.ResultCode === 0) {
            return { status: 'completed', receiptNumber: data.receiptNumber };
        } else if (data.ResultCode === '1032') {
            return { status: 'cancelled' };
        } else {
            return { status: 'failed' };
        }
    } catch {
        return { status: 'pending' };
    }
}

/**
 * Format a Kenyan phone number to the international 254XXXXXXXXX format.
 */
export function formatKenyanPhone(phone: string): string | null {
    const cleaned = phone.replace(/[\s\-\+]/g, '');

    if (/^0[17]\d{8}$/.test(cleaned)) {
        return '254' + cleaned.substring(1);
    }
    if (/^254[17]\d{8}$/.test(cleaned)) {
        return cleaned;
    }
    if (/^[17]\d{8}$/.test(cleaned)) {
        return '254' + cleaned;
    }
    return null;
}

import { ad as supabase } from "./index-CTZ1eQC9.js";
async function initiateMpesaPayment(phoneNumber, amount, studentId, studentName, recordedBy, feeStructureId, term) {
  try {
    const formattedPhone = formatKenyanPhone(phoneNumber);
    if (!formattedPhone) {
      return { success: false, error: "Invalid phone number. Use format 07XXXXXXXX or 254XXXXXXXXX" };
    }
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        phoneNumber: formattedPhone,
        amount: Math.ceil(amount),
        // M-Pesa doesn't support decimals
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
      console.error("M-Pesa STK Push error:", error);
      return { success: false, error: error.message || "Failed to initiate payment" };
    }
    return {
      success: true,
      checkoutRequestId: data == null ? void 0 : data.CheckoutRequestID,
      merchantRequestId: data == null ? void 0 : data.MerchantRequestID,
      responseDescription: data == null ? void 0 : data.ResponseDescription
    };
  } catch (err) {
    console.error("M-Pesa service error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}
async function checkMpesaPaymentStatus(checkoutRequestId) {
  try {
    const { data, error } = await supabase.functions.invoke("mpesa-query", {
      body: { checkoutRequestId }
    });
    if (error || !data) {
      return { status: "pending" };
    }
    if (data.ResultCode === "0" || data.ResultCode === 0) {
      return { status: "completed", receiptNumber: data.receiptNumber };
    } else if (data.ResultCode === "1032") {
      return { status: "cancelled" };
    } else {
      return { status: "failed" };
    }
  } catch {
    return { status: "pending" };
  }
}
function formatKenyanPhone(phone) {
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return "254" + cleaned.substring(1);
  }
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^[17]\d{8}$/.test(cleaned)) {
    return "254" + cleaned;
  }
  return null;
}
export {
  checkMpesaPaymentStatus,
  formatKenyanPhone,
  initiateMpesaPayment
};

import { a9 as supabase } from "./index-CWZOk6sM.js";
async function sendSMS(phoneNumber, message) {
  try {
    const formatted = formatPhoneForSMS(phoneNumber);
    if (!formatted) {
      return { success: false, error: "Invalid phone number format" };
    }
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { to: formatted, message }
    });
    if (error) {
      console.error("SMS send error:", error);
      return { success: false, error: error.message || "Failed to send SMS" };
    }
    return { success: true, messageId: data == null ? void 0 : data.messageId };
  } catch (err) {
    console.error("SMS service error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}
async function sendAttendanceAlert(studentName, guardianPhone, date, status) {
  const dateStr = new Date(date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" });
  const message = status === "absent" ? `[PRISM] Dear Parent, ${studentName} was marked ABSENT on ${dateStr}. Please contact the school for details.` : `[PRISM] Dear Parent, ${studentName} was present on ${dateStr}. Thank you!`;
  return sendSMS(guardianPhone, message);
}
async function sendFeeReminder(studentName, guardianPhone, balance) {
  const message = `[PRISM] Dear Parent, ${studentName} has an outstanding fee balance of KES ${balance.toLocaleString()}. Please make payment at your earliest convenience. Thank you.`;
  return sendSMS(guardianPhone, message);
}
async function sendPaymentReceipt(studentName, guardianPhone, amount, receiptNumber) {
  const receipt = receiptNumber ? ` Receipt: ${receiptNumber}.` : "";
  const message = `[PRISM] Payment of KES ${amount.toLocaleString()} received for ${studentName}.${receipt} Thank you!`;
  return sendSMS(guardianPhone, message);
}
async function sendGradeReport(studentName, guardianPhone, term, averageScore, position) {
  const posStr = position ? ` Position: ${position}.` : "";
  const message = `[PRISM] Term ${term} Report for ${studentName}: Average Score ${averageScore.toFixed(1)}%.${posStr} Visit the school for the full report card.`;
  return sendSMS(guardianPhone, message);
}
function formatPhoneForSMS(phone) {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (/^\+254[17]\d{8}$/.test(cleaned)) return cleaned;
  if (/^254[17]\d{8}$/.test(cleaned)) return "+" + cleaned;
  if (/^0[17]\d{8}$/.test(cleaned)) return "+254" + cleaned.substring(1);
  if (/^[17]\d{8}$/.test(cleaned)) return "+254" + cleaned;
  return null;
}
export {
  sendAttendanceAlert,
  sendFeeReminder,
  sendGradeReport,
  sendPaymentReceipt,
  sendSMS
};

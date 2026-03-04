import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { FeePayment, Student } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import clsx from 'clsx';

interface ReceiptModalProps {
    payment: FeePayment;
    student: Student | undefined;
    balance: number;
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, student, balance, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            // A5 dimensions: 148 x 210 mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a5'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();

            // Helper to add centered text
            const centerText = (text: string, y: number, font = 'helvetica', style = 'normal', size = 10, color: [number, number, number] = [0, 0, 0]) => {
                pdf.setFont(font, style);
                pdf.setFontSize(size);
                pdf.setTextColor(...color);
                pdf.text(text, pageWidth / 2, y, { align: 'center' });
            };

            // 1. Add Logo if available
            try {
                const img = new Image();
                img.src = '/logo.png';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                const logoWidth = 24;
                const logoHeight = 24;
                pdf.addImage(img, 'PNG', (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
            } catch (imgErr) {
                console.warn('Could not load logo for PDF', imgErr);
            }

            // 2. Header
            centerText('PAYMENT RECEIPT', 45, 'helvetica', 'bold', 18, [33, 37, 41]);
            centerText('PRISM Instructor OS', 52, 'helvetica', 'normal', 10, [108, 117, 125]);

            // Divider
            pdf.setDrawColor(222, 226, 230);
            pdf.setLineWidth(0.5);
            pdf.line(15, 60, pageWidth - 15, 60);

            // 3. Grid Details
            const startY = 70;
            const lineH = 9;

            const addRow = (label: string, value: string, yPos: number, isValueBold = false) => {
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.setTextColor(108, 117, 125);
                pdf.text(label.toUpperCase(), 15, yPos);

                pdf.setFont('helvetica', isValueBold ? 'bold' : 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(33, 37, 41);
                pdf.text(value, pageWidth - 15, yPos, { align: 'right' });
            };

            const receiptNo = payment.mpesaReceiptNumber || `REC-${payment.id.substring(0, 8).toUpperCase()}`;
            addRow('Receipt No.', receiptNo, startY, true);

            const formattedDate = new Date(payment.transactionDate).toLocaleString('en-KE', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            addRow('Date', formattedDate, startY + lineH);
            addRow('Student', payment.studentName, startY + lineH * 2, true);
            if (student?.grade) {
                addRow('Grade', student.grade, startY + lineH * 3);
            }

            // 4. Amount Block
            const blockY = 110;
            pdf.setFillColor(248, 249, 250);
            pdf.setDrawColor(233, 236, 239);
            pdf.roundedRect(15, blockY, pageWidth - 30, 40, 4, 4, 'FD');

            // Amount Watermark "PAID"
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(48);
            pdf.setTextColor(241, 243, 245);
            pdf.text('PAID', pageWidth / 2, blockY + 28, { align: 'center' });

            // Amount Text
            centerText('AMOUNT PAID', blockY + 14, 'helvetica', 'bold', 9, [108, 117, 125]);
            centerText(`KES ${payment.amount.toLocaleString()}`, blockY + 26, 'helvetica', 'bold', 24, [33, 37, 41]);

            // Method Footer in Block
            pdf.setDrawColor(222, 226, 230);
            pdf.line(20, blockY + 31, pageWidth - 20, blockY + 31);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(108, 117, 125);
            pdf.text('METHOD', 20, blockY + 36);
            pdf.setTextColor(33, 37, 41);
            pdf.text(payment.method.toUpperCase(), pageWidth - 20, blockY + 36, { align: 'right' });

            // 5. Term & Balance
            const detailsY = 165;
            addRow('Term Applied', `Term ${payment.term || 'N/A'}`, detailsY);
            addRow('Recorded By', payment.recordedBy, detailsY + lineH);

            // Dashed Divider
            pdf.setDrawColor(222, 226, 230);
            pdf.setLineDashPattern([2, 2], 0);
            pdf.line(15, detailsY + lineH * 1.5, pageWidth - 15, detailsY + lineH * 1.5);
            pdf.setLineDashPattern([], 0);

            // Balance
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(73, 80, 87);
            pdf.text('Outstanding Balance', 15, detailsY + lineH * 2.5);

            if (balance > 0) {
                pdf.setTextColor(239, 68, 68); // Red
            } else {
                pdf.setTextColor(16, 185, 129); // Emerald
            }
            pdf.text(`KES ${balance.toLocaleString()}`, pageWidth - 15, detailsY + lineH * 2.5, { align: 'right' });

            // 6. Footer
            centerText('THANK YOU', 195, 'courier', 'normal', 8, [173, 181, 189]);

            pdf.save(`Receipt_${receiptNo}_${payment.studentName.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Error generating receipt PDF:', error);
            alert('Failed to generate PDF receipt.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Format transaction date safely
    const formattedDate = new Date(payment.transactionDate).toLocaleString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm" // Mobile-receipt width
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                {/* The Printable Receipt Area */}
                <div
                    ref={receiptRef}
                    className="bg-white rounded-t-2xl rounded-b-md shadow-2xl overflow-hidden relative"
                >
                    {/* Top Decorative Edge (Simulated thermal printer edge) */}
                    <div className="h-4 w-full bg-[#f8fafc] border-b border-dashed border-gray-300"></div>

                    <div className="p-8 pb-10">
                        {/* Header Details */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="font-google font-black text-2xl text-gray-900 tracking-tight">PAYMENT RECEIPT</h2>
                            <p className="text-gray-500 text-sm font-medium mt-1">PRISM Instructor OS</p>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-200 mb-6 relative">
                            <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-[#f8fafc] rounded-full"></div>
                            <div className="absolute -right-2 -top-1.5 w-3 h-3 bg-[#f8fafc] rounded-full"></div>
                        </div>

                        {/* Master Info */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Receipt No.</p>
                                <p className="text-gray-900 font-mono font-bold text-sm">
                                    {payment.mpesaReceiptNumber || `REC-${payment.id.substring(0, 8).toUpperCase()}`}
                                </p>
                            </div>
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Date</p>
                                <p className="text-gray-800 font-medium text-sm text-right">{formattedDate}</p>
                            </div>
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Student</p>
                                <p className="text-gray-900 font-bold text-sm text-right">{payment.studentName}</p>
                            </div>
                            {student?.grade && (
                                <div className="flex justify-between items-start">
                                    <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Grade</p>
                                    <p className="text-gray-800 font-medium text-sm text-right">{student.grade}</p>
                                </div>
                            )}
                        </div>

                        {/* Amount Block */}
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 relative overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.03] pointer-events-none">
                                <span className="text-6xl font-black tracking-tighter">PAID</span>
                            </div>

                            <p className="text-gray-500 text-sm font-bold text-center mb-1">AMOUNT PAID</p>
                            <p className="text-4xl font-black text-gray-900 tabular-nums text-center tracking-tight">
                                <span className="text-lg text-emerald-600 mr-1">KES</span>
                                {payment.amount.toLocaleString()}
                            </p>
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                <p className="text-gray-500 text-xs font-bold tracking-wider uppercase">Method</p>
                                <p className="text-gray-800 font-bold text-xs capitalize">{payment.method}</p>
                            </div>
                        </div>

                        {/* Term/Balance Info */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Term Applied</span>
                                <span className="font-medium text-gray-900">Term {payment.term || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Recorded By</span>
                                <span className="font-medium text-gray-900">{payment.recordedBy}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t border-gray-200 border-dashed mt-3">
                                <span className="text-gray-600 font-bold">Outstanding Balance</span>
                                <span className={clsx("font-black tabular-nums", balance > 0 ? "text-red-500" : "text-emerald-500")}>
                                    KES {balance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Simulated Barcode at bottom */}
                        <div className="mt-10 flex flex-col items-center justify-center opacity-60">
                            <div className="w-48 h-10 bg-gradient-to-r from-gray-900 to-gray-800 bg-[length:4px_100%]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 6px)' }}></div>
                            <p className="text-[9px] font-mono tracking-[0.3em] mt-2 text-gray-400">THANK YOU</p>
                        </div>
                    </div>

                    {/* Bottom Decorative Edge (Zig-zag) */}
                    <div className="h-6 w-full bg-[#f8fafc]" style={{
                        background: 'radial-gradient(circle at 10px 0, transparent 10px, white 10px) -10px',
                        backgroundSize: '20px 20px',
                        backgroundRepeat: 'repeat-x'
                    }}></div>
                </div>

                {/* Actions Panel (External to receipt so it's not printed) */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-lg",
                            isGenerating
                                ? "bg-white/20 text-white cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {isGenerating ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download size={18} />
                        )}
                        {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                    {/* Add print specific button if needed later, but PDF is usually better for mobile sharing */}
                </div>
            </motion.div>
        </div>
    );
};

export default ReceiptModal;

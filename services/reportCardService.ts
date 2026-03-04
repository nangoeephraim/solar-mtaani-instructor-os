import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, AppData, UnitAssessment, GradeKNEC, COMPETENCY_LABELS } from '../types';

// ==========================================
// REPORT CARD PDF GENERATION SERVICE
// ==========================================

interface ReportCardOptions {
    term?: 1 | 2 | 3;
    schoolName?: string;
    schoolMotto?: string;
    schoolAddress?: string;
    instructorName?: string;
    showPosition?: boolean;
    showAttendance?: boolean;
}

const DEFAULT_OPTIONS: ReportCardOptions = {
    term: 1,
    schoolName: 'PRISM Technical Institute',
    schoolMotto: 'Empowering Through Technology',
    schoolAddress: 'P.O Box 12345, Nairobi, Kenya',
    instructorName: 'Instructor',
    showPosition: true,
    showAttendance: true,
};

// Color palette
const COLORS = {
    primary: [15, 82, 186] as [number, number, number],      // Deep blue
    secondary: [100, 116, 139] as [number, number, number],   // Slate
    accent: [34, 197, 94] as [number, number, number],         // Green
    danger: [239, 68, 68] as [number, number, number],         // Red
    warning: [245, 158, 11] as [number, number, number],       // Amber
    dark: [30, 41, 59] as [number, number, number],            // Dark slate
    light: [248, 250, 252] as [number, number, number],        // Light bg
    white: [255, 255, 255] as [number, number, number],
    headerBg: [15, 82, 186] as [number, number, number],
    tableBg: [241, 245, 249] as [number, number, number],
};

/**
 * Generate a professional Report Card PDF for a single student.
 */
export function generateReportCard(
    student: Student,
    data: AppData,
    options?: ReportCardOptions
): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ─── HEADER: School Banner ───
    y = drawSchoolHeader(doc, opts, pageWidth, margin, y);

    // ─── REPORT CARD TITLE ───
    y += 3;
    doc.setFillColor(...COLORS.primary);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.white);
    doc.text(`STUDENT REPORT CARD — TERM ${opts.term}`, pageWidth / 2, y + 7, { align: 'center' });
    y += 15;

    // ─── STUDENT INFO SECTION ───
    y = drawStudentInfo(doc, student, opts, pageWidth, margin, y);

    // ─── ASSESSMENT SECTION ───
    y += 5;
    const isKNEC = student.subject === 'ICT' || hasKNECAssessments(student);

    if (isKNEC) {
        y = drawKNECTable(doc, student, data, pageWidth, margin, y);
    } else {
        y = drawCBETTable(doc, student, data, pageWidth, margin, y);
    }

    // ─── COMPETENCIES SUMMARY ───
    y += 5;
    y = drawCompetencySummary(doc, student, pageWidth, margin, y);

    // ─── ATTENDANCE SECTION ───
    if (opts.showAttendance) {
        y += 5;
        y = drawAttendanceSection(doc, student, pageWidth, margin, y);
    }

    // ─── REMARKS + SIGNATURE ───
    y += 8;
    y = drawRemarksSection(doc, student, opts, pageWidth, margin, y);

    // ─── FOOTER ───
    drawFooter(doc, opts, pageWidth);

    // Download
    const fileName = `Report_Card_${student.name.replace(/\s+/g, '_')}_Term${opts.term}.pdf`;
    doc.save(fileName);
}

/**
 * Bulk generate report cards for multiple students.
 */
export async function generateBulkReportCards(
    students: Student[],
    data: AppData,
    options?: ReportCardOptions
): Promise<void> {
    // Generate one combined PDF with page breaks
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    students.forEach((student, index) => {
        if (index > 0) doc.addPage();
        let y = margin;

        y = drawSchoolHeader(doc, opts, pageWidth, margin, y);

        y += 3;
        doc.setFillColor(...COLORS.primary);
        doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...COLORS.white);
        doc.text(`STUDENT REPORT CARD — TERM ${opts.term}`, pageWidth / 2, y + 7, { align: 'center' });
        y += 15;

        y = drawStudentInfo(doc, student, opts, pageWidth, margin, y);

        y += 5;
        const isKNEC = student.subject === 'ICT' || hasKNECAssessments(student);
        if (isKNEC) {
            y = drawKNECTable(doc, student, data, pageWidth, margin, y);
        } else {
            y = drawCBETTable(doc, student, data, pageWidth, margin, y);
        }

        y += 5;
        y = drawCompetencySummary(doc, student, pageWidth, margin, y);

        if (opts.showAttendance) {
            y += 5;
            y = drawAttendanceSection(doc, student, pageWidth, margin, y);
        }

        y += 8;
        y = drawRemarksSection(doc, student, opts, pageWidth, margin, y);
        drawFooter(doc, opts, pageWidth);
    });

    const fileName = `Report_Cards_Term${opts.term}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}

// ==========================================
// DRAWING HELPERS
// ==========================================

function drawSchoolHeader(
    doc: jsPDF, opts: ReportCardOptions, pageWidth: number, margin: number, y: number
): number {
    // Top accent bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 4, 'F');

    y = 12;

    // School crest placeholder (circle)
    doc.setFillColor(...COLORS.primary);
    doc.circle(margin + 10, y + 8, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text('P', margin + 10, y + 9.5, { align: 'center' });

    // School name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.dark);
    doc.text(opts.schoolName || '', margin + 24, y + 5);

    // Motto
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`"${opts.schoolMotto}"`, margin + 24, y + 11);

    // Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(opts.schoolAddress || '', margin + 24, y + 16);

    // Line separator
    y += 22;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    return y;
}

function drawStudentInfo(
    doc: jsPDF, student: Student, opts: ReportCardOptions,
    pageWidth: number, margin: number, y: number
): number {
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'F');

    const col1 = margin + 5;
    const col2 = pageWidth / 2 + 5;
    const rowH = 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);

    // Row 1
    drawInfoRow(doc, 'Student Name:', student.name, col1, y + 6);
    drawInfoRow(doc, 'Adm. No:', student.admissionNumber || 'N/A', col2, y + 6);

    // Row 2
    drawInfoRow(doc, 'Grade/Level:', student.grade, col1, y + 6 + rowH);
    drawInfoRow(doc, 'Subject:', student.subject, col2, y + 6 + rowH);

    // Row 3
    drawInfoRow(doc, 'Group:', student.studentGroup, col1, y + 6 + rowH * 2);
    drawInfoRow(doc, 'Term:', `Term ${opts.term}`, col2, y + 6 + rowH * 2);

    // Row 4
    drawInfoRow(doc, 'Year:', student.lot || new Date().getFullYear().toString(), col1, y + 6 + rowH * 3);
    drawInfoRow(doc, 'DOB:', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : 'N/A', col2, y + 6 + rowH * 3);

    return y + 30;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, x: number, y: number) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.secondary);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(value, x + 28, y);
}

function hasKNECAssessments(student: Student): boolean {
    if (!student.assessment?.units) return false;
    return Object.values(student.assessment.units).some(u => u.system === 'KNEC');
}

function drawKNECTable(
    doc: jsPDF, student: Student, _data: AppData,
    _pageWidth: number, margin: number, y: number
): number {
    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text('ACADEMIC PERFORMANCE (KNEC)', margin, y + 5);
    y += 8;

    const units = student.assessment?.units || {};
    const rows: (string | number)[][] = [];
    let totalScore = 0;
    let count = 0;

    for (const [unitId, unit] of Object.entries(units)) {
        if (unit.system !== 'KNEC') continue;
        const cat1 = unit.cat1?.score ?? '-';
        const cat2 = unit.cat2?.score ?? '-';
        const practical = unit.practical?.score ?? '-';
        const finalExam = unit.finalExam?.score ?? '-';
        const finalScore = unit.finalScore ?? '-';
        const grade = unit.finalGrade || '-';
        const remarks = unit.instructorRemarks || getGradeRemark(unit.finalGrade);

        rows.push([unitId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), cat1, cat2, practical, finalExam, finalScore, grade, remarks]);

        if (typeof unit.finalScore === 'number') {
            totalScore += unit.finalScore;
            count++;
        }
    }

    if (rows.length === 0) {
        rows.push(['No assessments recorded', '-', '-', '-', '-', '-', '-', '-']);
    }

    // Average row
    if (count > 0) {
        const avg = Math.round(totalScore / count);
        rows.push(['AVERAGE', '', '', '', '', avg, getKNECGrade(avg), '']);
    }

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Unit', 'CAT 1', 'CAT 2', 'Practical', 'Final Exam', 'Total', 'Grade', 'Remarks']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
        },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { halign: 'center', cellWidth: 14 },
            2: { halign: 'center', cellWidth: 14 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
            6: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
            7: { cellWidth: 36 },
        },
        alternateRowStyles: { fillColor: COLORS.tableBg },
        didParseCell: (data) => {
            // Color-code grades
            if (data.column.index === 6 && data.section === 'body') {
                const grade = String(data.cell.raw);
                if (grade === 'Distinction') data.cell.styles.textColor = COLORS.accent;
                else if (grade === 'Fail' || grade === 'Referral') data.cell.styles.textColor = COLORS.danger;
            }
        },
    });

    return (doc as any).lastAutoTable.finalY || y + 40;
}

function drawCBETTable(
    doc: jsPDF, student: Student, _data: AppData,
    _pageWidth: number, margin: number, y: number
): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text('COMPETENCY ASSESSMENT (CBET)', margin, y + 5);
    y += 8;

    const units = student.assessment?.units || {};
    const rows: (string)[][] = [];
    let competentCount = 0;
    let totalCount = 0;

    for (const [unitId, unit] of Object.entries(units)) {
        if (unit.system !== 'CBET') continue;
        totalCount++;
        const verdict = unit.verdict || 'Not Yet Competent';
        if (verdict === 'Competent') competentCount++;
        const portfolio = unit.portfolioEvidence ? '✓' : '✗';
        const practicalChecks = `${(unit.practicalChecks || []).length} checks`;
        const remarks = unit.instructorRemarks || '';

        rows.push([
            unitId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            verdict,
            portfolio,
            practicalChecks,
            remarks,
        ]);
    }

    if (rows.length === 0) {
        rows.push(['No competency assessments recorded', '-', '-', '-', '-']);
    }

    // Summary row
    if (totalCount > 0) {
        rows.push([`SUMMARY: ${competentCount}/${totalCount} units competent`, '', '', '', `${Math.round((competentCount / totalCount) * 100)}%`]);
    }

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Unit', 'Verdict', 'Portfolio', 'Practicals', 'Remarks']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
        headStyles: {
            fillColor: COLORS.primary,
            textColor: COLORS.white,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
        },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 25 },
            4: { cellWidth: 40 },
        },
        alternateRowStyles: { fillColor: COLORS.tableBg },
        didParseCell: (data) => {
            if (data.column.index === 1 && data.section === 'body') {
                const verdict = String(data.cell.raw);
                if (verdict === 'Competent') data.cell.styles.textColor = COLORS.accent;
                else if (verdict === 'Not Yet Competent') data.cell.styles.textColor = COLORS.danger;
            }
        },
    });

    return (doc as any).lastAutoTable.finalY || y + 40;
}

function drawCompetencySummary(
    doc: jsPDF, student: Student, pageWidth: number, margin: number, y: number
): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text('COMPETENCY LEVELS', margin, y + 5);
    y += 8;

    const competencies = student.competencies || {};
    const entries = Object.entries(competencies);

    if (entries.length === 0) return y;

    const barWidth = (pageWidth - margin * 2 - 45);
    const barHeight = 5;
    const labels: Record<number, string> = { 1: 'Emerging', 2: 'Developing', 3: 'Competent', 4: 'Mastered' };
    const barColors: [number, number, number][] = [
        COLORS.danger, COLORS.warning, [59, 130, 246], COLORS.accent
    ];

    entries.forEach(([key, level], i) => {
        const rowY = y + (i * 9);

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.dark);
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        doc.text(label, margin, rowY + 4);

        // Background bar
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(margin + 42, rowY, barWidth, barHeight, 1, 1, 'F');

        // Filled bar
        const fillPct = Math.min(level, 4) / 4;
        const color = barColors[Math.min(level - 1, 3)] || COLORS.secondary;
        doc.setFillColor(...color);
        doc.roundedRect(margin + 42, rowY, barWidth * fillPct, barHeight, 1, 1, 'F');

        // Level label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.white);
        if (fillPct > 0.15) {
            doc.text(labels[level] || `L${level}`, margin + 42 + (barWidth * fillPct) / 2, rowY + 3.7, { align: 'center' });
        }
    });

    return y + (entries.length * 9) + 2;
}

function drawAttendanceSection(
    doc: jsPDF, student: Student, pageWidth: number, margin: number, y: number
): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text('ATTENDANCE', margin, y + 5);
    y += 9;

    const attendance = student.attendancePct ?? 0;
    const barWidth = pageWidth - margin * 2 - 50;
    const barHeight = 8;

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text('Attendance Rate:', margin, y + 5.5);

    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(margin + 35, y, barWidth, barHeight, 2, 2, 'F');

    // Filled bar
    const color = attendance >= 90 ? COLORS.accent : attendance >= 75 ? COLORS.warning : COLORS.danger;
    doc.setFillColor(...color);
    doc.roundedRect(margin + 35, y, barWidth * (attendance / 100), barHeight, 2, 2, 'F');

    // Percentage text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text(`${attendance}%`, margin + 35 + barWidth + 3, y + 6);

    // Attendance count
    const totalDays = student.attendanceHistory?.length || 0;
    const presentDays = student.attendanceHistory?.filter(a => a.status === 'present').length || 0;
    const absentDays = totalDays - presentDays;

    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Days Present: ${presentDays}  |  Days Absent: ${absentDays}  |  Total Sessions: ${totalDays}`, margin, y + 3);

    return y + 6;
}

function drawRemarksSection(
    doc: jsPDF, student: Student, opts: ReportCardOptions,
    pageWidth: number, margin: number, y: number
): number {
    // Check if we need a new page
    if (y > 250) {
        doc.addPage();
        y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text('REMARKS & SIGNATURES', margin, y + 5);
    y += 10;

    // Instructor remarks
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text("Instructor's Remarks:", margin + 3, y + 5);

    const remarks = student.notes?.length ? student.notes[student.notes.length - 1] : 'Good progress. Keep up the effort.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.text(remarks.substring(0, 120), margin + 3, y + 11, { maxWidth: pageWidth - margin * 2 - 6 });
    y += 22;

    // Signature lines
    const sigWidth = (pageWidth - margin * 2 - 20) / 2;

    // Instructor signature
    doc.setDrawColor(...COLORS.secondary);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 10, margin + sigWidth, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Instructor: ${opts.instructorName}`, margin, y + 14);
    doc.text('Date: _______________', margin, y + 18);

    // Parent signature
    doc.line(margin + sigWidth + 20, y + 10, pageWidth - margin, y + 10);
    doc.text("Parent/Guardian's Signature", margin + sigWidth + 20, y + 14);
    doc.text('Date: _______________', margin + sigWidth + 20, y + 18);

    return y + 22;
}

function drawFooter(doc: jsPDF, opts: ReportCardOptions, pageWidth: number) {
    const pageHeight = doc.internal.pageSize.getHeight();

    // Bottom accent bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.text(
        `${opts.schoolName} • This is a computer-generated report card • Generated on ${new Date().toLocaleDateString('en-GB')}`,
        pageWidth / 2, pageHeight - 3,
        { align: 'center' }
    );
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function getKNECGrade(score: number): GradeKNEC {
    if (score >= 70) return 'Distinction';
    if (score >= 60) return 'Credit';
    if (score >= 50) return 'Pass';
    if (score >= 40) return 'Referral';
    return 'Fail';
}

function getGradeRemark(grade?: GradeKNEC): string {
    switch (grade) {
        case 'Distinction': return 'Excellent work!';
        case 'Credit': return 'Good performance.';
        case 'Pass': return 'Satisfactory.';
        case 'Referral': return 'Needs improvement.';
        case 'Fail': return 'Requires remediation.';
        default: return '';
    }
}

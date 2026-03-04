// Supabase Edge Function: generate-report
// Generates a professional analytics PDF server-side using jsPDF,
// uploads it to the 'certificates' bucket, and returns a signed URL.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Helper: draw a zebra-striped table ──
function drawTable(
    pdf: jsPDF,
    startY: number,
    headers: { label: string; x: number }[],
    rows: string[][],
    headerColor: [number, number, number] = [59, 130, 246],
    W: number = 210,
): number {
    let y = startY

    // Header row
    pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    pdf.rect(14, y, W - 28, 8, 'F')
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    headers.forEach(h => pdf.text(h.label, h.x, y + 5.5))
    y += 8

    // Data rows
    rows.forEach((row, idx) => {
        if (y > 275) { pdf.addPage(); y = 14 }
        const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 250]
        pdf.setFillColor(bg[0], bg[1], bg[2])
        pdf.rect(14, y, W - 28, 7, 'F')
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(40, 40, 40)
        row.forEach((cell, ci) => {
            if (ci < headers.length) {
                pdf.text(cell, headers[ci].x, y + 5)
            }
        })
        y += 7
    })

    return y + 4
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { reportType, filters } = await req.json()
        console.log(`[Report Generator] Generating ${reportType} report...`, filters)

        // ── 1. Create Supabase admin client ──
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // ── 2. Fetch analytics data via existing RPCs ──
        const [classAvgRes, subjectRes, atRiskRes, gradeDistRes, topPerformersRes] = await Promise.all([
            supabase.rpc('get_class_averages'),
            supabase.rpc('get_subject_comparison'),
            supabase.rpc('get_at_risk_students'),
            supabase.rpc('get_grade_distribution'),
            supabase.from('student_performance_summary')
                .select('id, name, subject, avg_score, attendance_pct')
                .order('avg_score', { ascending: false })
                .limit(10),
        ])

        // Parse results
        const classAvg = Array.isArray(classAvgRes.data) ? classAvgRes.data[0] : classAvgRes.data
        const subjects = subjectRes.data || []
        const atRisk = atRiskRes.data || []
        const gradeDist = gradeDistRes.data || []
        const topPerformers = topPerformersRes.data || []

        const overallScore = classAvg?.overall_avg_score ?? 0
        const overallAttendance = classAvg?.overall_avg_attendance ?? 0
        const totalStudents = classAvg?.total_students ?? 0

        // ── 3. Try to fetch the PRISM logo ──
        let logoBase64: string | null = null
        try {
            // Try fetching from the app's own public assets first
            const logoUrl = `${supabaseUrl}/storage/v1/object/public/certificates/prism_logo.png`
            const logoResp = await fetch(logoUrl)
            if (logoResp.ok) {
                const logoBuffer = await logoResp.arrayBuffer()
                const bytes = new Uint8Array(logoBuffer)
                let binary = ''
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i])
                }
                logoBase64 = btoa(binary)
            }
        } catch {
            console.log('[Report Generator] Logo fetch failed, using text fallback')
        }

        // ── 4. Build the PDF ──
        const pdf = new jsPDF('p', 'mm', 'a4')
        const W = pdf.internal.pageSize.getWidth()
        let y = 0

        // ── HEADER BAND ──
        pdf.setFillColor(15, 23, 42)  // slate-900
        pdf.rect(0, 0, W, 40, 'F')
        // Accent gradient line
        pdf.setFillColor(59, 130, 246)
        pdf.rect(0, 40, W, 2, 'F')

        // Logo
        if (logoBase64) {
            try {
                pdf.addImage('data:image/png;base64,' + logoBase64, 'PNG', 14, 6, 28, 28)
            } catch {
                // Text fallback
                pdf.setFillColor(59, 130, 246)
                pdf.roundedRect(14, 8, 26, 26, 4, 4, 'F')
                pdf.setTextColor(255, 255, 255)
                pdf.setFontSize(16)
                pdf.setFont('helvetica', 'bold')
                pdf.text('P', 23, 24)
            }
        } else {
            // Text-based logo fallback
            pdf.setFillColor(59, 130, 246)
            pdf.roundedRect(14, 8, 26, 26, 4, 4, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text('P', 23, 24)
        }

        // Title
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text('PRISM Analytics Report', 48, 18)

        // Subtitle
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(148, 163, 184)  // slate-400
        const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        const periodStr = filters?.dateRange
            ? `Period: ${filters.dateRange.start} to ${filters.dateRange.end}`
            : `Generated: ${dateStr}`
        pdf.text(`Server-Generated Report  |  ${periodStr}`, 48, 26)

        // Report type badge
        pdf.setFillColor(59, 130, 246)
        pdf.roundedRect(48, 29, 35, 6, 2, 2, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.text((reportType || 'COHORT SUMMARY').toUpperCase(), 50, 33.5)

        y = 50

        // ── KEY METRICS CARDS ──
        pdf.setTextColor(30, 30, 30)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('KEY METRICS', 14, y)
        y += 6

        const metrics = [
            { label: 'Class Average', value: Number(overallScore).toFixed(2) + ' / 4.0', color: [59, 130, 246] as [number, number, number] },
            { label: 'Attendance', value: Number(overallAttendance).toFixed(0) + '%', color: [34, 197, 94] as [number, number, number] },
            { label: 'Total Students', value: '' + totalStudents, color: [139, 92, 246] as [number, number, number] },
            { label: 'At-Risk', value: '' + atRisk.length, color: [239, 68, 68] as [number, number, number] },
        ]

        const cardW = (W - 28 - 12) / 4
        metrics.forEach((m, i) => {
            const cx = 14 + i * (cardW + 4)
            // Card background
            pdf.setFillColor(249, 250, 251)
            pdf.roundedRect(cx, y, cardW, 24, 3, 3, 'F')
            // Color accent bar
            pdf.setFillColor(m.color[0], m.color[1], m.color[2])
            pdf.rect(cx, y, cardW, 3, 'F')
            // Label
            pdf.setFontSize(7)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(107, 114, 128)
            pdf.text(m.label, cx + 4, y + 10)
            // Value
            pdf.setFontSize(14)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(m.color[0], m.color[1], m.color[2])
            pdf.text(m.value, cx + 4, y + 20)
        })
        y += 32

        // ── SUBJECT PERFORMANCE ──
        if (subjects.length > 0) {
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(30, 30, 30)
            pdf.text('SUBJECT PERFORMANCE', 14, y)
            y += 6
            y = drawTable(pdf, y,
                [{ label: 'Subject', x: 18 }, { label: 'Students', x: 80 }, { label: 'Avg Score', x: 120 }, { label: 'Rating', x: 160 }],
                subjects.map((s: any) => [
                    s.subject,
                    '' + s.student_count,
                    Number(s.avg_score).toFixed(2) + ' / 4.0',
                    Number(s.avg_score) >= 3.0 ? 'Excellent' : Number(s.avg_score) >= 2.0 ? 'Good' : 'Needs Work',
                ]),
            )
        }

        // ── GRADE DISTRIBUTION ──
        if (gradeDist.length > 0) {
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(30, 30, 30)
            pdf.text('GRADE DISTRIBUTION', 14, y)
            y += 6
            y = drawTable(pdf, y,
                [{ label: 'Grade', x: 18 }, { label: 'Students', x: 60 }, { label: 'Avg Score', x: 100 }, { label: 'Attendance', x: 140 }],
                gradeDist.map((g: any) => [
                    'Grade ' + g.grade,
                    '' + g.student_count,
                    Number(g.avg_score).toFixed(2),
                    Number(g.avg_attendance).toFixed(0) + '%',
                ]),
            )
        }

        // ── TOP PERFORMERS ──
        if (topPerformers.length > 0) {
            if (y > 220) { pdf.addPage(); y = 14 }
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(30, 30, 30)
            pdf.text('TOP PERFORMERS', 14, y)
            y += 6
            y = drawTable(pdf, y,
                [{ label: '#', x: 18 }, { label: 'Name', x: 28 }, { label: 'Subject', x: 90 }, { label: 'Score', x: 130 }, { label: 'Attend.', x: 160 }],
                topPerformers.map((s: any, i: number) => [
                    '' + (i + 1),
                    s.name,
                    s.subject,
                    Number(s.avg_score).toFixed(2),
                    Number(s.attendance_pct).toFixed(0) + '%',
                ]),
                [34, 197, 94],
            )
        }

        // ── AT-RISK STUDENTS ──
        if (atRisk.length > 0) {
            if (y > 220) { pdf.addPage(); y = 14 }
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(239, 68, 68)
            pdf.text('AT-RISK STUDENTS', 14, y)
            y += 6
            y = drawTable(pdf, y,
                [{ label: 'Name', x: 18 }, { label: 'Subject', x: 70 }, { label: 'Avg Score', x: 110 }, { label: 'Attendance', x: 150 }],
                atRisk.map((s: any) => [
                    s.name,
                    s.subject,
                    Number(s.avg_score).toFixed(2),
                    Number(s.attendance_pct).toFixed(0) + '%',
                ]),
                [239, 68, 68],
            )
        }

        // ── FOOTER on all pages ──
        const pageCount = pdf.getNumberOfPages()
        for (let p = 1; p <= pageCount; p++) {
            pdf.setPage(p)
            // Footer line
            pdf.setDrawColor(229, 231, 235)
            pdf.line(14, 284, W - 14, 284)
            // Footer text
            pdf.setFontSize(7)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(156, 163, 175)
            pdf.text('PRISM OS  |  Confidential  |  Server-Generated Report', 14, 289)
            pdf.text('Page ' + p + ' of ' + pageCount, W - 14, 289, { align: 'right' })
        }

        // ── 5. Upload PDF to storage ──
        const pdfOutput = pdf.output('arraybuffer')
        const pdfBytes = new Uint8Array(pdfOutput)

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filePath = `reports/cloud_report_${timestamp}.pdf`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(filePath, pdfBytes, {
                cacheControl: '3600',
                upsert: false,
                contentType: 'application/pdf',
            })

        if (uploadError) {
            throw new Error('Upload failed: ' + uploadError.message)
        }

        // ── 6. Create a signed URL (1-hour expiry) ──
        const { data: signedData, error: signedError } = await supabase.storage
            .from('certificates')
            .createSignedUrl(uploadData.path, 3600)

        if (signedError) {
            throw new Error('Signed URL failed: ' + signedError.message)
        }

        console.log(`[Report Generator] Report generated successfully: ${filePath}`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Report generated successfully',
                downloadUrl: signedData.signedUrl,
                path: uploadData.path,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error: any) {
        console.error('[Report Generator] Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            },
        )
    }
})

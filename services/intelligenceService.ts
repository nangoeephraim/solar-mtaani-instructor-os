import { AppData, Student, ScheduleSlot } from '../types';

export interface Insight {
    id: string;
    type: 'success' | 'warning' | 'info' | 'prediction';
    message: string;
    detail?: string;
    priority: 'high' | 'medium' | 'low';
    icon?: string;
}

export const analyzeData = (data: AppData): Insight[] => {
    const insights: Insight[] = [];
    const students = data.students;
    const schedule = data.schedule;

    // 1. Attendance Analysis
    const avgAttendance = students.reduce((acc, s) => acc + s.attendancePct, 0) / students.length;

    if (avgAttendance > 90) {
        insights.push({
            id: 'att-high',
            type: 'success',
            message: 'Class attendance is excellent!',
            detail: `Current average is ${Math.round(avgAttendance)}%, which is well above the 90% target. Keep up the momentum!`,
            priority: 'low'
        });
    } else if (avgAttendance < 80) {
        insights.push({
            id: 'att-low',
            type: 'warning',
            message: 'Attendance is trending downward.',
            detail: `Class average has dropped to ${Math.round(avgAttendance)}%. Consider scheduling a catch-up session or reviewing class timing.`,
            priority: 'high'
        });
    }

    // 2. Identify Patterns (Day of Week)
    // Calculate attendance per day based on history
    const dayStats = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    students.forEach(s => {
        s.attendanceHistory.forEach(h => {
            const date = new Date(h.date);
            const day = date.getDay();
            if (h.status === 'present') dayStats[day]++;
            dayCounts[day]++;
        });
    });

    // Find worst performing day
    let worstDay = -1;
    let worstRate = 101;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    dayStats.forEach((present, day) => {
        if (dayCounts[day] > 5) { // Threshold to be significant
            const rate = (present / dayCounts[day]) * 100;
            if (rate < worstRate) {
                worstRate = rate;
                worstDay = day;
            }
        }
    });

    if (worstDay !== -1 && worstRate < 85) {
        insights.push({
            id: 'day-pattern',
            type: 'info',
            message: `${days[worstDay]}s have the lowest attendance.`,
            detail: `Attendance drops to ${Math.round(worstRate)}% on ${days[worstDay]}s. Maybe students are tired or have conflicts?`,
            priority: 'medium'
        });
    }

    // 3. Performance Trends
    const solarStudents = students.filter(s => s.subject === 'Solar');
    const ictStudents = students.filter(s => s.subject === 'ICT');

    const getAvgScore = (list: Student[]) => {
        if (!list.length) return 0;
        return list.reduce((acc, s) => {
            const scores = Object.values(s.competencies);
            return acc + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
        }, 0) / list.length;
    };

    const solarAvg = getAvgScore(solarStudents);
    const ictAvg = getAvgScore(ictStudents);

    if (Math.abs(solarAvg - ictAvg) > 0.5) {
        const leader = solarAvg > ictAvg ? 'Solar PV' : 'ICT';
        const lagger = solarAvg > ictAvg ? 'ICT' : 'Solar PV';
        insights.push({
            id: 'prog-gap',
            type: 'info',
            message: `${leader} cohort is outperforming ${lagger}.`,
            detail: `There is a significant gap (${(Math.abs(solarAvg - ictAvg)).toFixed(1)} pts) in competency mastery between the two programs.`,
            priority: 'medium'
        });
    }

    // 4. Student Improvement (Mock logic as we don't have historical scores yet)
    // In a real app, we'd compare past assessments. Here we simulate "Top Improver" if they have high recent attendance + good score
    const topStudent = [...students].sort((a, b) => {
        const scoreA = Object.values(a.competencies).reduce((x, y) => x + y, 0);
        const scoreB = Object.values(b.competencies).reduce((x, y) => x + y, 0);
        return scoreB - scoreA;
    })[0];

    if (topStudent) {
        const score = (Object.values(topStudent.competencies).reduce((x, y) => x + y, 0) / Math.max(1, Object.values(topStudent.competencies).length)).toFixed(1);
        if (parseFloat(score) > 3.5) {
            insights.push({
                id: 'top-student',
                type: 'success',
                message: `${topStudent.name} is a top Performer!`,
                detail: `Consistently achieving mastery level (Avg: ${score}). Recommend them for peer mentorship role.`,
                priority: 'low'
            });
        }
    }

    // 5. Schedule Workload — warn if any single day has > 5 classes
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const classesByDay = new Map<number, number>();
    schedule.forEach(s => {
        classesByDay.set(s.dayOfWeek, (classesByDay.get(s.dayOfWeek) || 0) + 1);
    });
    const heavyDays = Array.from(classesByDay.entries()).filter(([, count]) => count > 5);
    if (heavyDays.length > 0) {
        const dayList = heavyDays.map(([day, count]) => `${dayNames[day]} (${count})`).join(', ');
        insights.push({
            id: 'workload-heavy',
            type: 'warning',
            message: 'Heavy teaching load detected',
            detail: `${dayList} ${heavyDays.length === 1 ? 'has' : 'have'} more than 5 classes. Consider redistributing to avoid burnout.`,
            priority: 'medium'
        });
    }

    return insights.sort((a, b) => (a.priority === 'high' ? -1 : 1));
};

/**
 * PRISM Instructor OS — Kenyan Education Level Configuration
 * 
 * Maps each StudentGroup to its valid education levels based on Kenya's education systems:
 * - Academy (TVET): KNQF Levels 3-6 (NITA/CDACC)
 * - CBC: PP1-PP2, Grade 1-12 (2-6-3-3-3 structure)
 * - High School (8-4-4): Form 1-4
 * - Campus: Year 1-4
 */

import { StudentGroup } from '../types';

export interface EducationLevel {
    id: string;        // Stored in DB: 'L3', 'G7', 'F2', 'Y1'
    label: string;     // Full display: 'KNQF Level 3 (Artisan)', 'Grade 7'
    shortLabel: string; // Compact display: 'L3', 'Gr 7', 'F2', 'Yr 1'
}

export const EDUCATION_LEVELS: Record<StudentGroup, EducationLevel[]> = {
    Academy: [
        { id: 'L3', label: 'KNQF Level 3 (Artisan)', shortLabel: 'L3' },
        { id: 'L4', label: 'KNQF Level 4 (Certificate)', shortLabel: 'L4' },
        { id: 'L5', label: 'KNQF Level 5 (Higher Cert)', shortLabel: 'L5' },
        { id: 'L6', label: 'KNQF Level 6 (Diploma)', shortLabel: 'L6' },
    ],
    CBC: [
        { id: 'PP1', label: 'Pre-Primary 1', shortLabel: 'PP1' },
        { id: 'PP2', label: 'Pre-Primary 2', shortLabel: 'PP2' },
        { id: 'G1', label: 'Grade 1', shortLabel: 'Gr 1' },
        { id: 'G2', label: 'Grade 2', shortLabel: 'Gr 2' },
        { id: 'G3', label: 'Grade 3', shortLabel: 'Gr 3' },
        { id: 'G4', label: 'Grade 4', shortLabel: 'Gr 4' },
        { id: 'G5', label: 'Grade 5', shortLabel: 'Gr 5' },
        { id: 'G6', label: 'Grade 6', shortLabel: 'Gr 6' },
        { id: 'G7', label: 'Grade 7 (Junior Sec)', shortLabel: 'Gr 7' },
        { id: 'G8', label: 'Grade 8 (Junior Sec)', shortLabel: 'Gr 8' },
        { id: 'G9', label: 'Grade 9 (Junior Sec)', shortLabel: 'Gr 9' },
        { id: 'G10', label: 'Grade 10 (Senior Sec)', shortLabel: 'Gr 10' },
        { id: 'G11', label: 'Grade 11 (Senior Sec)', shortLabel: 'Gr 11' },
        { id: 'G12', label: 'Grade 12 (Senior Sec)', shortLabel: 'Gr 12' },
    ],
    'High School': [
        { id: 'F1', label: 'Form 1', shortLabel: 'F1' },
        { id: 'F2', label: 'Form 2', shortLabel: 'F2' },
        { id: 'F3', label: 'Form 3', shortLabel: 'F3' },
        { id: 'F4', label: 'Form 4', shortLabel: 'F4' },
    ],
    Campus: [
        { id: 'Y1', label: 'Year 1', shortLabel: 'Yr 1' },
        { id: 'Y2', label: 'Year 2', shortLabel: 'Yr 2' },
        { id: 'Y3', label: 'Year 3', shortLabel: 'Yr 3' },
        { id: 'Y4', label: 'Year 4', shortLabel: 'Yr 4' },
    ],
};

/** All student group options */
export const STUDENT_GROUPS: StudentGroup[] = ['Academy', 'CBC', 'High School', 'Campus'];

/** Get all levels for a given student group */
export const getLevelsForGroup = (group: StudentGroup): EducationLevel[] => {
    return EDUCATION_LEVELS[group] || EDUCATION_LEVELS['Academy'];
};

/** Get the default level for a given student group */
export const getDefaultLevel = (group: StudentGroup): string => {
    const levels = getLevelsForGroup(group);
    return levels[0]?.id || 'L3';
};

/** Get the full label for a grade ID + student group */
export const getLevelLabel = (group: StudentGroup, gradeId: string): string => {
    const levels = getLevelsForGroup(group);
    const found = levels.find(l => l.id === gradeId);
    if (found) return found.label;
    // Fallback: try to make a readable label from the raw ID
    return gradeId || 'Unknown';
};

/** Get the short label for a grade ID + student group */
export const getLevelShortLabel = (group: StudentGroup, gradeId: string): string => {
    const levels = getLevelsForGroup(group);
    const found = levels.find(l => l.id === gradeId);
    if (found) return found.shortLabel;
    // Fallback for legacy numeric grades
    if (!isNaN(Number(gradeId))) return `Gr ${gradeId}`;
    return gradeId || '?';
};

/** Convert a legacy numeric grade to the new string format based on student group */
export const migrateLegacyGrade = (numericGrade: number | string, group: StudentGroup): string => {
    const g = typeof numericGrade === 'string' ? numericGrade : String(numericGrade);

    // If it's already a valid new-format ID, return as-is
    const levels = getLevelsForGroup(group);
    if (levels.some(l => l.id === g)) return g;

    // Convert legacy numeric grades to new format
    const num = parseInt(g);
    if (isNaN(num)) return g;

    switch (group) {
        case 'Academy':
            // Legacy 1-4 → L3-L6
            if (num >= 1 && num <= 4) return `L${num + 2}`;
            return `L${Math.min(Math.max(num, 3), 6)}`;
        case 'CBC':
            return `G${num}`;
        case 'High School':
            return `F${Math.min(Math.max(num, 1), 4)}`;
        case 'Campus':
            return `Y${Math.min(Math.max(num, 1), 4)}`;
        default:
            return g;
    }
};

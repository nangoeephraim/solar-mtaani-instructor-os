import { supabase } from './supabase';

// ==========================================
// INSTRUCTOR SERVICE
// Multi-instructor data operations
// ==========================================

export interface InstructorProfile {
    id: string;
    userId: string;
    fullName: string;
    email?: string;
    phone?: string;
    subject: 'Solar' | 'ICT';
    qualification?: string;
    photoUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface ClassAssignment {
    id: string;
    instructorId: string;
    grade: string;
    subject: string;
    studentGroup?: string;
    term?: 1 | 2 | 3;
    academicYear?: string;
    isActive: boolean;
    createdAt: string;
    // Joined fields
    instructorName?: string;
}

export interface InstructorWorkload {
    instructorId: string;
    fullName: string;
    primarySubject: string;
    isActive: boolean;
    totalAssignments: number;
    uniqueGrades: number;
    assignedGrades: string[];
    assignedSubjects: string[];
}

// ==========================================
// INSTRUCTOR PROFILE OPERATIONS
// ==========================================

/**
 * Get the instructor profile for the currently logged-in user.
 */
export async function getCurrentInstructorProfile(): Promise<InstructorProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error || !data) return null;

    return mapProfile(data);
}

/**
 * Get all instructor profiles.
 */
export async function getAllInstructors(): Promise<InstructorProfile[]> {
    const { data, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .order('full_name');

    if (error || !data) return [];
    return data.map(mapProfile);
}

/**
 * Update an instructor profile.
 */
export async function updateInstructorProfile(
    id: string,
    updates: Partial<Pick<InstructorProfile, 'fullName' | 'phone' | 'subject' | 'qualification' | 'photoUrl' | 'isActive'>>
): Promise<boolean> {
    const { error } = await supabase
        .from('instructor_profiles')
        .update({
            full_name: updates.fullName,
            phone: updates.phone,
            subject: updates.subject,
            qualification: updates.qualification,
            photo_url: updates.photoUrl,
            is_active: updates.isActive,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    return !error;
}

// ==========================================
// CLASS ASSIGNMENT OPERATIONS
// ==========================================

/**
 * Get classes assigned to a specific instructor.
 */
export async function getAssignedClasses(instructorId: string): Promise<ClassAssignment[]> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_active', true)
        .order('grade');

    if (error || !data) return [];
    return data.map(mapAssignment);
}

/**
 * Get all class assignments with instructor names.
 */
export async function getAllClassAssignments(): Promise<ClassAssignment[]> {
    const { data, error } = await supabase
        .from('class_assignments')
        .select(`
      *,
      instructor_profiles!inner(full_name)
    `)
        .eq('is_active', true)
        .order('grade');

    if (error || !data) return [];
    return data.map((d: any) => ({
        ...mapAssignment(d),
        instructorName: d.instructor_profiles?.full_name,
    }));
}

/**
 * Assign an instructor to a class.
 */
export async function assignInstructorToClass(
    instructorId: string,
    grade: string,
    subject: string,
    studentGroup?: string,
    term?: 1 | 2 | 3,
    academicYear?: string
): Promise<boolean> {
    const { error } = await supabase
        .from('class_assignments')
        .upsert({
            instructor_id: instructorId,
            grade,
            subject,
            student_group: studentGroup,
            term: term || 1,
            academic_year: academicYear || new Date().getFullYear().toString(),
            is_active: true,
        }, { onConflict: 'instructor_id,grade,subject,term,academic_year' });

    return !error;
}

/**
 * Remove an instructor from a class (soft delete).
 */
export async function unassignInstructorFromClass(assignmentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('class_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

    return !error;
}

// ==========================================
// WORKLOAD & ANALYTICS
// ==========================================

/**
 * Get instructor workload summaries (from the view).
 */
export async function getInstructorWorkloads(): Promise<InstructorWorkload[]> {
    const { data, error } = await supabase
        .from('instructor_workload')
        .select('*');

    if (error || !data) return [];

    return data.map((d: any) => ({
        instructorId: d.instructor_id,
        fullName: d.full_name,
        primarySubject: d.primary_subject,
        isActive: d.is_active,
        totalAssignments: d.total_assignments || 0,
        uniqueGrades: d.unique_grades || 0,
        assignedGrades: d.assigned_grades || [],
        assignedSubjects: d.assigned_subjects || [],
    }));
}

/**
 * Check if the current user's instructor has access to a specific class.
 */
export async function canAccessClass(grade: string, subject: string): Promise<boolean> {
    const profile = await getCurrentInstructorProfile();
    if (!profile) return false;

    const assignments = await getAssignedClasses(profile.id);
    return assignments.some(a => a.grade === grade && a.subject === subject);
}

// ==========================================
// HELPERS
// ==========================================

function mapProfile(d: any): InstructorProfile {
    return {
        id: d.id,
        userId: d.user_id,
        fullName: d.full_name,
        email: d.email,
        phone: d.phone,
        subject: d.subject || 'Solar',
        qualification: d.qualification,
        photoUrl: d.photo_url,
        isActive: d.is_active ?? true,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
    };
}

function mapAssignment(d: any): ClassAssignment {
    return {
        id: d.id,
        instructorId: d.instructor_id,
        grade: d.grade,
        subject: d.subject,
        studentGroup: d.student_group,
        term: d.term,
        academicYear: d.academic_year,
        isActive: d.is_active ?? true,
        createdAt: d.created_at,
    };
}

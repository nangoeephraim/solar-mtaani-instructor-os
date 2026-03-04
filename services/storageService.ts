import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS, ScheduleSlot, Resource, ChatChannel, ChatMessage, LibraryResource, FeePayment, FeeStructure } from '../types';
import { supabase } from './supabase';
import { getCache, setCache, isOnline, enqueueMutation } from './offlineSyncService';

const SETTINGS_KEY = 'prism_instructor_settings_v1';

// App settings are still local for device-specific things like theme/limits
export const getSettings = (): InstructorSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: InstructorSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};

// ==========================================
// SUPABASE ASYNC DATABASE OPERATIONS
// ==========================================

export const fetchAppData = async (): Promise<AppData> => {
  try {
    // 1. If explicitly offline, try cache first
    if (!isOnline()) {
      const cached = await getCache<AppData>('app_data');
      if (cached) return cached;
      throw new Error("No offline cache available");
    }
    // We execute these in parallel for performance
    const [
      { data: students },
      { data: schedule },
      { data: resources },
      { data: channels },
      { data: messagesArray },
      { data: libraryItems },
      { data: feePaymentsRaw },
      { data: feeStructuresRaw }
    ] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('schedule_slots').select('*'),
      supabase.from('resources').select('*'),
      supabase.from('chat_channels').select('*'),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('library_resources').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('fee_payments').select('*').order('transaction_date', { ascending: false }),
      supabase.from('fee_structures').select('*').order('created_at', { ascending: true })
    ]);

    // Group messages by channelId for the AppData format expected by the UI
    const messagesByChannel: Record<string, ChatMessage[]> = {};
    if (messagesArray) {
      messagesArray.forEach((msg: any) => {
        const frontendMsg: ChatMessage = {
          id: msg.id,
          channelId: msg.channel_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name || 'Unknown', // Fallback — 'Unknown' signals a data issue
          content: msg.content,
          timestamp: msg.created_at,
          isPinned: msg.is_pinned,
          isDeleted: msg.is_deleted,
          reactions: msg.reactions || {},
          editedAt: msg.edited_at
        };

        if (!messagesByChannel[msg.channel_id]) {
          messagesByChannel[msg.channel_id] = [];
        }
        messagesByChannel[msg.channel_id].push(frontendMsg);
      });
    }

    const result = {
      curriculum: { solar: [], ict: [] },
      students: (students || []).map(formatStudentFromDB),
      schedule: (schedule || []).map(formatScheduleSlot),
      holidays: [], // Keeping empty for now as requested
      resources: resources || [],
      library: (libraryItems || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        fileName: item.file_name,
        fileType: item.file_type,
        category: item.category,
        uploadedBy: item.uploaded_by,
        uploadedAt: item.uploaded_at,
        size: item.size,
        isApproved: item.is_approved,
        downloadUrl: item.download_url
      })),
      communications: {
        channels: (channels || []).map((ch: any) => ({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          description: ch.description || undefined,
          participants: ch.participants || [],
          createdBy: ch.created_by || undefined,
          createdAt: ch.created_at || undefined,
          lastReadBy: ch.last_read_by || {},
        })),
        messages: messagesByChannel
      },
      payments: (feePaymentsRaw || []).map(formatFeePaymentFromDB),
      feeStructures: (feeStructuresRaw || []).map(formatFeeStructureFromDB)
    };

    // 3. Cache the successful fetch via IndexedDB
    await setCache('app_data', result);
    return result;

  } catch (error) {
    console.warn("Storage Service API Fetch Failed:", error);
    // Fallback to cache on network failure
    const cached = await getCache<AppData>('app_data');
    if (cached) {
      console.log("Serving application data from IndexedDB cache");
      return cached;
    }
    throw error;
  }
};

export const formatScheduleSlot = (dbSlot: any): ScheduleSlot => ({
  id: dbSlot.id,
  dayOfWeek: dbSlot.day_of_week,
  startTime: dbSlot.start_time,
  durationMinutes: dbSlot.duration_minutes || 60,
  grade: dbSlot.grade || 'L3',
  subject: dbSlot.subject || (dbSlot.type === 'ict' ? 'ICT' : 'Solar'),
  studentGroup: dbSlot.student_group || 'Academy',
  status: dbSlot.status || 'Pending',
  // Pass through extended DB properties the UI may need
  ...(dbSlot.title && { title: dbSlot.title }),
  ...(dbSlot.location && { location: dbSlot.location }),
  ...(dbSlot.color && { color: dbSlot.color }),
  ...(dbSlot.instructor && { instructor: dbSlot.instructor }),
} as any);

export const formatStudentFromDB = (dbStudent: any): Student => ({
  id: dbStudent.id,
  name: dbStudent.name,
  grade: dbStudent.grade,
  subject: dbStudent.subject,
  attendancePct: dbStudent.attendance_pct,
  lot: dbStudent.lot,
  studentGroup: dbStudent.student_group,
  assessment: dbStudent.assessment,
  attendanceHistory: dbStudent.attendance_history,
  notes: dbStudent.notes,
  competencies: dbStudent.competencies
});


// --- STUDENT CRUD ---
export const addStudent = async (studentData: Omit<Student, 'id'>): Promise<Student | null> => {
  if (!isOnline()) {
    await enqueueMutation('addStudent', studentData);
    // Optimistic offline response: use negative timestamp for temporary ID
    return { ...studentData, id: -Date.now() } as Student;
  }

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('students').insert({
    name: studentData.name,
    grade: studentData.grade,
    subject: studentData.subject,
    lot: studentData.lot,
    student_group: studentData.studentGroup,
    attendance_pct: studentData.attendancePct || 0,
    assessment: studentData.assessment,
    attendance_history: studentData.attendanceHistory || [],
    notes: studentData.notes || [],
    competencies: studentData.competencies || {},
    created_by: userData.user?.id
  }).select().single();

  if (error) {
    console.error("Error adding student:", error);
    return null;
  }
  return formatStudentFromDB(data);
};

export const updateStudent = async (student: Student): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('updateStudent', student);
    return true; // Optimistic success
  }

  const { error } = await supabase.from('students').update({
    name: student.name,
    grade: student.grade,
    subject: student.subject,
    lot: student.lot,
    student_group: student.studentGroup,
    attendance_pct: student.attendancePct,
    assessment: student.assessment,
    attendance_history: student.attendanceHistory,
    notes: student.notes,
    competencies: student.competencies,
    updated_at: new Date().toISOString()
  }).eq('id', student.id);

  if (error) {
    console.error("Error updating student:", error);
    return false;
  }
  return true;
};

export const deleteStudent = async (studentId: string | number): Promise<boolean> => {
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) {
    console.error("Error deleting student:", error);
    return false;
  }
  return true;
};


export const addScheduleSlot = async (slot: Omit<ScheduleSlot, 'id'> & { title?: string, type?: string, location?: string, instructor?: string, color?: string }): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('addScheduleSlot', slot);
    return true;
  }
  const { error } = await supabase.from('schedule_slots').insert({
    title: slot.title || `${slot.subject || 'Solar'} Class`,
    start_time: slot.startTime,
    end_time: '12:00',
    day_of_week: slot.dayOfWeek,
    type: slot.type || (slot.subject === 'ICT' ? 'ict' : 'class'),
    location: slot.location || '',
    instructor: slot.instructor || '',
    color: slot.color || 'blue',
    grade: slot.grade || 'L3',
    subject: slot.subject || 'Solar',
    student_group: slot.studentGroup || 'Academy',
    duration_minutes: slot.durationMinutes || 60,
    status: slot.status || 'Pending',
  });
  return !error;
};

export const updateScheduleSlot = async (slot: ScheduleSlot & { title?: string, type?: string, location?: string, instructor?: string, color?: string }): Promise<boolean> => {
  const { error } = await supabase.from('schedule_slots').update({
    title: slot.title || `${slot.subject || 'Solar'} Class`,
    start_time: slot.startTime,
    end_time: '12:00',
    day_of_week: slot.dayOfWeek,
    type: slot.type || (slot.subject === 'ICT' ? 'ict' : 'class'),
    location: slot.location || '',
    instructor: slot.instructor || '',
    color: slot.color || 'blue',
    grade: slot.grade || 'L3',
    subject: slot.subject || 'Solar',
    student_group: slot.studentGroup || 'Academy',
    duration_minutes: slot.durationMinutes || 60,
    status: slot.status || 'Pending',
    updated_at: new Date().toISOString()
  }).eq('id', slot.id);
  return !error;
};

export const deleteScheduleSlot = async (slotId: string): Promise<boolean> => {
  const { error } = await supabase.from('schedule_slots').delete().eq('id', slotId);
  return !error;
};


// --- CHAT & COMMUNICATIONS ---

export const addChatMessage = async (data: AppData, payload: Omit<ChatMessage, 'id' | 'timestamp' | 'editedAt' | 'reactions' | 'isPinned' | 'isDeleted'>): Promise<AppData> => {
  const { error } = await supabase.from('chat_messages').insert({
    channel_id: payload.channelId,
    content: payload.content,
    sender_id: payload.senderId,
    sender_name: payload.senderName, // We can store this or join it later
    reply_to_id: payload.replyToId,
    attachments: payload.attachments || [] // ADDED
  });
  if (error) console.error("Error sending message:", error);
  // We return data unmodified because the realtime subscription handles the state update in App.tsx
  return data;
};

export const editChatMessage = async (data: AppData, channelId: string, messageId: string, newContent: string): Promise<AppData> => {
  const { error } = await supabase.from('chat_messages').update({
    content: newContent,
    edited_at: new Date().toISOString()
  }).eq('id', messageId);
  if (error) console.error("Error editing message:", error);
  return data;
};

export const softDeleteChatMessage = async (data: AppData, channelId: string, messageId: string): Promise<AppData> => {
  const { error } = await supabase.from('chat_messages').update({
    is_deleted: true
  }).eq('id', messageId);
  if (error) console.error("Error deleting message:", error);
  return data;
};

export const togglePinMessage = async (data: AppData, channelId: string, messageId: string): Promise<AppData> => {
  // Let's fetch current status first to toggle
  const { data: msg } = await supabase.from('chat_messages').select('is_pinned').eq('id', messageId).single();
  if (msg) {
    const { error } = await supabase.from('chat_messages').update({
      is_pinned: !msg.is_pinned
    }).eq('id', messageId);
    if (error) console.error("Error pinning message:", error);
  }
  return data;
};

export const toggleReaction = async (data: AppData, channelId: string, messageId: string, emoji: string, userId: string): Promise<AppData> => {
  // We need to fetch the existing reactions jsonb to toggle the user
  const { data: msg } = await supabase.from('chat_messages').select('reactions').eq('id', messageId).single();
  if (msg) {
    let reactions: Record<string, string[]> = { ...(msg.reactions || {}) };
    let users = reactions[emoji] || [];
    if (users.includes(userId)) {
      users = users.filter((id: string) => id !== userId);
    } else {
      users.push(userId);
    }

    if (users.length === 0) {
      delete reactions[emoji];
    } else {
      reactions[emoji] = users;
    }

    const { error } = await supabase.from('chat_messages').update({
      reactions: reactions
    }).eq('id', messageId);
    if (error) console.error("Error toggling reaction:", error);
  }
  return data;
};

export const markChannelRead = (data: AppData, channelId: string, userId: string): AppData => {
  const channelIndex = data.communications?.channels.findIndex(c => c.id === channelId);
  if (channelIndex === undefined || channelIndex === -1) return data;

  const channel = data.communications.channels[channelIndex];
  const now = new Date().toISOString();

  // If we already read it very recently, skip to prevent thrashing
  if (channel.lastReadBy?.[userId] && (new Date(now).getTime() - new Date(channel.lastReadBy[userId]).getTime() < 1000)) {
    return data;
  }

  const newLastReadBy = { ...channel.lastReadBy, [userId]: now };

  // Async update DB (fetch current to avoid overwriting other users' reads)
  (async () => {
    try {
      const { data: dbChan } = await supabase.from('chat_channels').select('last_read_by').eq('id', channelId).single();
      const updatedDB = { ...(dbChan?.last_read_by || {}), [userId]: now };
      await supabase.from('chat_channels').update({ last_read_by: updatedDB }).eq('id', channelId);
    } catch (err) {
      console.error("Failed to mark channel read in DB:", err);
    }
  })();

  const newChannels = [...data.communications.channels];
  newChannels[channelIndex] = { ...channel, lastReadBy: newLastReadBy };

  return {
    ...data,
    communications: {
      ...data.communications,
      channels: newChannels
    }
  };
};

export const getUnreadCount = (data: AppData, channelId: string, userId: string): number => {
  const channel = data.communications?.channels.find(c => c.id === channelId);
  if (!channel) return 0;

  const lastReadTimestamp = channel.lastReadBy?.[userId];
  const messages = data.communications?.messages?.[channelId] || [];

  if (!lastReadTimestamp) {
    // If never read, count all messages not from the user
    return messages.filter(m => m.senderId !== userId).length;
  }

  return messages.filter(m => m.senderId !== userId && new Date(m.timestamp) > new Date(lastReadTimestamp)).length;
};

export const addChatChannel = async (data: AppData, payload: Omit<ChatChannel, 'id'>): Promise<AppData> => {
  const { error } = await supabase.from('chat_channels').insert({
    name: payload.name,
    description: payload.description,
    type: payload.type,
    created_by: payload.createdBy
  });
  if (error) console.error("Error adding channel:", error);
  return data;
};

export const formatChannelFromDB = (ch: any): ChatChannel => ({
  id: ch.id,
  name: ch.name,
  type: ch.type,
  description: ch.description || undefined,
  participants: ch.participants || [],
  createdBy: ch.created_by || undefined,
  createdAt: ch.created_at || undefined,
  lastReadBy: ch.last_read_by || {},
});

export const createDirectMessage = async (currentUserId: string, targetUserId: string): Promise<ChatChannel | null> => {
  // 1. Check if a DM channel already exists between these exact two users
  const { data: existingChannels, error: searchError } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('type', 'dm');

  if (searchError) {
    console.error("Error searching for existing DM:", searchError);
    return null;
  }

  // Find exact match of participants (array contains both)
  const existingRow = existingChannels?.find(c =>
    c.participants &&
    c.participants.includes(currentUserId) &&
    c.participants.includes(targetUserId) &&
    c.participants.length === 2
  );

  if (existingRow) return formatChannelFromDB(existingRow);

  // 2. Create new DM channel
  const { data: newChannel, error: insertError } = await supabase
    .from('chat_channels')
    .insert({
      name: 'DM',
      type: 'dm',
      participants: [currentUserId, targetUserId],
      created_by: currentUserId
    })
    .select('*')
    .single();

  if (insertError || !newChannel) {
    console.error("Error creating DM:", insertError);
    return null;
  }

  return formatChannelFromDB(newChannel);
};

export const deleteChatChannel = async (data: AppData, channelId: string): Promise<AppData> => {
  const { error } = await supabase.from('chat_channels').delete().eq('id', channelId);
  if (error) console.error("Error deleting channel:", error);
  return data;
};

// Note: Real-time subscriptions will handle updating the UI for edits/deletes instead of full fetch.

// --- ADVANCED ANALYTICS (Server-Side) ---

export const fetchAnalyticsSummary = async () => {
  const [averagesRes, subjectsRes, atRiskRes, gradesRes] = await Promise.all([
    supabase.rpc('get_class_averages'),
    supabase.rpc('get_subject_comparison'),
    supabase.rpc('get_at_risk_students'),
    supabase.rpc('get_grade_distribution')
  ]);

  if (averagesRes.error) console.error("Error fetching class averages:", averagesRes.error);
  if (subjectsRes.error) console.error("Error fetching subject comparison:", subjectsRes.error);
  if (atRiskRes.error) console.error("Error fetching at-risk students:", atRiskRes.error);
  if (gradesRes.error) console.error("Error fetching grade distribution:", gradesRes.error);

  return {
    classAverages: averagesRes.data?.[0] || { overall_avg_score: 0, overall_avg_attendance: 0, total_students: 0 },
    subjectComparison: subjectsRes.data || [],
    atRiskStudents: atRiskRes.data || [],
    gradeDistribution: gradesRes.data || []
  };
};

// --- DATA EXPORT & IMPORT ---
export const exportDataAsCSV = async (): Promise<string> => {
  const { fetchAppData } = await import('./storageService');
  const data = await fetchAppData();
  const headers = ['Name', 'Admission No', 'Subject', 'Grade', 'Lot', 'Attendance %'];
  const rows = data.students.map(s => [
    s.name,
    s.admissionNumber || '',
    s.subject,
    s.grade,
    s.lot,
    s.attendancePct
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const exportFullBackup = async (): Promise<string> => {
  // Try to export full data string from supabase
  const { fetchAppData } = await import('./storageService');
  const data = await fetchAppData();
  return JSON.stringify(data, null, 2);
};

export const importFullBackup = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    console.log("Imported data (partial stub):", data);
    return true;
  } catch (e) {
    console.error("Failed to parse backup:", e);
    return false;
  }
};

export const resetData = async (): Promise<boolean> => {
  console.warn("resetData called. Factory reset is disabled while on Supabase.");
  return false;
};

// --- RESOURCES & LIBRARY ---
export const addResource = async (resource: Omit<Resource, 'id'>): Promise<Resource | null> => null;
export const updateResource = async (resource: Resource): Promise<boolean> => false;
export const deleteResource = async (id: string): Promise<boolean> => false;

export const addLibraryResource = async (resource: Omit<LibraryResource, 'id'>): Promise<LibraryResource | null> => {
  const { error, data } = await supabase.from('library_resources').insert({
    title: resource.title,
    file_name: resource.fileName,
    file_type: resource.fileType || 'application/octet-stream',
    category: resource.category,
    uploaded_by: resource.uploadedBy,
    size: resource.size,
    is_approved: resource.isApproved,
    download_url: resource.downloadUrl
  }).select().single();

  if (error) {
    console.error("Error adding library resource:", error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    fileName: data.file_name,
    fileType: data.file_type,
    category: data.category,
    uploadedBy: data.uploaded_by,
    uploadedAt: data.uploaded_at,
    size: data.size,
    isApproved: data.is_approved,
    downloadUrl: data.download_url
  } as LibraryResource;
};

export const updateLibraryResource = async (dataState: AppData, resource: LibraryResource): Promise<AppData> => {
  const { error } = await supabase.from('library_resources').update({
    title: resource.title,
    is_approved: resource.isApproved
  }).eq('id', resource.id);

  if (error) {
    console.error("Error updating library resource:", error);
    return dataState;
  }

  return {
    ...dataState,
    library: dataState.library?.map(r => r.id === resource.id ? resource : r) || []
  };
};

export const deleteLibraryResource = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('library_resources').delete().eq('id', id);
  if (error) {
    console.error("Error deleting library resource:", error);
    return false;
  }
  return true;
};

export const getLibraryFileData = async (id: string): Promise<string | null> => null;

// ==========================================
// FEE PAYMENT CRUD
// ==========================================

export const formatFeePaymentFromDB = (row: any): FeePayment => ({
  id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  amount: parseFloat(row.amount),
  method: row.method,
  status: row.status,
  mpesaReceiptNumber: row.mpesa_receipt_number,
  mpesaPhoneNumber: row.mpesa_phone_number,
  transactionDate: row.transaction_date,
  feeStructureId: row.fee_structure_id,
  term: row.term,
  notes: row.notes,
  recordedBy: row.recorded_by
});

const formatFeeStructureFromDB = (row: any): FeeStructure => ({
  id: row.id,
  name: row.name,
  amount: parseFloat(row.amount),
  term: row.term,
  studentGroup: row.student_group,
  isRecurring: row.is_recurring,
  description: row.description
});

export const addFeePayment = async (payment: Omit<FeePayment, 'id'>): Promise<FeePayment | null> => {
  const { data, error } = await supabase.from('fee_payments').insert({
    student_id: payment.studentId,
    student_name: payment.studentName,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    mpesa_receipt_number: payment.mpesaReceiptNumber,
    mpesa_phone_number: payment.mpesaPhoneNumber,
    transaction_date: payment.transactionDate || new Date().toISOString(),
    fee_structure_id: payment.feeStructureId,
    term: payment.term,
    notes: payment.notes,
    recorded_by: payment.recordedBy
  }).select().single();

  if (error) {
    console.error('Error adding fee payment:', error);
    return null;
  }
  return formatFeePaymentFromDB(data);
};

export const updateFeePayment = async (id: string, updates: Partial<FeePayment>): Promise<boolean> => {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.mpesaReceiptNumber !== undefined) dbUpdates.mpesa_receipt_number = updates.mpesaReceiptNumber;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;

  const { error } = await supabase.from('fee_payments').update(dbUpdates).eq('id', id);
  if (error) {
    console.error('Error updating fee payment:', error);
    return false;
  }
  return true;
};

export const deleteFeePayment = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('fee_payments').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fee payment:', error);
    return false;
  }
  return true;
};

export const addFeeStructure = async (fee: Omit<FeeStructure, 'id'>): Promise<FeeStructure | null> => {
  const { data, error } = await supabase.from('fee_structures').insert({
    name: fee.name,
    amount: fee.amount,
    term: fee.term,
    student_group: fee.studentGroup,
    is_recurring: fee.isRecurring,
    description: fee.description
  }).select().single();

  if (error) {
    console.error('Error adding fee structure:', error);
    return null;
  }
  return formatFeeStructureFromDB(data);
};

export const updateFeeStructure = async (fee: FeeStructure): Promise<boolean> => {
  const { error } = await supabase.from('fee_structures').update({
    name: fee.name,
    amount: fee.amount,
    term: fee.term,
    student_group: fee.studentGroup,
    is_recurring: fee.isRecurring,
    description: fee.description
  }).eq('id', fee.id);
  if (error) {
    console.error('Error updating fee structure:', error);
    return false;
  }
  return true;
};

export const deleteFeeStructure = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('fee_structures').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fee structure:', error);
    return false;
  }
  return true;
};


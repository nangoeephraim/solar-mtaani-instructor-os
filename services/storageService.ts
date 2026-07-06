import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS, ScheduleSlot, Resource, ChatChannel, ChatMessage, LibraryResource, FeePayment, FeeStructure } from '../types';
import { supabase } from './supabase';
import { getCache, setCache, isOnline, enqueueMutation, syncQueue } from './offlineSyncService';
import { SEED_DATA_PRESETS } from '../utils/seedData';

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
          senderRole: msg.sender_role || 'viewer',
          content: msg.content,
          timestamp: msg.created_at,
          isPinned: msg.is_pinned,
          isDeleted: msg.is_deleted,
          reactions: msg.reactions || {},
          editedAt: msg.edited_at,
          replyToId: msg.reply_to_id,
          attachments: msg.attachments || []
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
      resources: (resources || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        capacity: item.capacity,
        location: item.location,
        notes: item.notes,
        usageHistory: item.usage_history || []
      })),
      library: (libraryItems || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        fileName: item.file_name,
        fileType: item.file_type,
        category: item.category,
        uploadedBy: item.uploaded_by,
        uploadedById: item.uploaded_by_id,
        uploadedAt: item.uploaded_at,
        size: item.size,
        isApproved: item.is_approved,
        downloadUrl: item.download_url,
        description: item.description,
        downloadsCount: item.downloads_count,
        tags: item.tags,
        academicTerm: item.academic_term
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
  resourceIds: dbSlot.resource_ids || [],
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
  competencies: dbStudent.competencies,
  phone: dbStudent.phone || undefined,
  email: dbStudent.email || undefined,
  dateOfBirth: dbStudent.date_of_birth || undefined,
  guardianName: dbStudent.guardian_name || undefined,
  guardianPhone: dbStudent.guardian_phone || undefined,
  address: dbStudent.address || undefined,
  admissionNumber: dbStudent.admission_number || undefined,
  nemisNumber: dbStudent.nemis_number || undefined,
  upi: dbStudent.upi || undefined,
  kcpeMarks: dbStudent.kcpe_marks || undefined,
  nationalId: dbStudent.national_id || undefined,
  nitaNumber: dbStudent.nita_number || undefined,
  epraLicenseStatus: dbStudent.epra_license_status || 'None',
  kcseGrade: dbStudent.kcse_grade || undefined,
  photo: dbStudent.photo || undefined,
});


// --- STUDENT CRUD ---
export const addStudent = async (studentData: Omit<Student, 'id'>): Promise<Student | null> => {
  if (!isOnline()) {
    await enqueueMutation('addStudent', studentData);
    // Optimistic offline response: use negative timestamp for temporary ID
    return { ...studentData, id: -Date.now() } as Student;
  }

  const { data: userData } = await supabase.auth.getUser();
  let insertResult = await supabase.from('students').insert({
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
    phone: studentData.phone || null,
    email: studentData.email || null,
    date_of_birth: studentData.dateOfBirth || null,
    guardian_name: studentData.guardianName || null,
    guardian_phone: studentData.guardianPhone || null,
    address: studentData.address || null,
    admission_number: studentData.admissionNumber || null,
    nemis_number: studentData.nemisNumber || null,
    upi: studentData.upi || null,
    kcpe_marks: studentData.kcpeMarks || null,
    national_id: studentData.nationalId || null,
    nita_number: studentData.nitaNumber || null,
    epra_license_status: studentData.epraLicenseStatus || 'None',
    kcse_grade: studentData.kcseGrade || null,
    photo: studentData.photo || null,
    created_by: userData.user?.id
  }).select().single();

  if (insertResult.error) {
    console.warn("Full insert failed, attempting fallback to core schema:", insertResult.error.message);
    insertResult = await supabase.from('students').insert({
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
  }

  if (insertResult.error) {
    console.error("Error adding student:", insertResult.error);
    return null;
  }
  return formatStudentFromDB(insertResult.data);
};

export const updateStudent = async (student: Student): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('updateStudent', student);
    return true; // Optimistic success
  }

  let updateResult = await supabase.from('students').update({
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
    phone: student.phone || null,
    email: student.email || null,
    date_of_birth: student.dateOfBirth || null,
    guardian_name: student.guardianName || null,
    guardian_phone: student.guardianPhone || null,
    address: student.address || null,
    admission_number: student.admissionNumber || null,
    nemis_number: student.nemisNumber || null,
    upi: student.upi || null,
    kcpe_marks: student.kcpeMarks || null,
    national_id: student.nationalId || null,
    nita_number: student.nitaNumber || null,
    epra_license_status: student.epraLicenseStatus || 'None',
    kcse_grade: student.kcseGrade || null,
    photo: student.photo || null,
    updated_at: new Date().toISOString()
  }).eq('id', student.id);

  if (updateResult.error) {
    console.warn("Full update failed, attempting fallback to core schema:", updateResult.error.message);
    updateResult = await supabase.from('students').update({
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
  }

  if (updateResult.error) {
    console.error("Error updating student:", updateResult.error);
    return false;
  }
  return true;
};

export const deleteStudent = async (studentId: string | number): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('deleteStudent', { id: studentId });
    return true;
  }

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
    resource_ids: slot.resourceIds || []
  });
  return !error;
};

export const updateScheduleSlot = async (slot: ScheduleSlot & { title?: string, type?: string, location?: string, instructor?: string, color?: string }): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('updateScheduleSlot', slot);
    return true;
  }

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
    resource_ids: slot.resourceIds || [],
    updated_at: new Date().toISOString()
  }).eq('id', slot.id);
  return !error;
};

export const deleteScheduleSlot = async (slotId: string): Promise<boolean> => {
  if (!isOnline()) {
    await enqueueMutation('deleteScheduleSlot', { id: slotId });
    return true;
  }

  const { error } = await supabase.from('schedule_slots').delete().eq('id', slotId);
  return !error;
};


// --- CHAT & COMMUNICATIONS ---

export const addChatMessage = async (data: AppData, payload: Omit<ChatMessage, 'timestamp' | 'editedAt' | 'reactions' | 'isPinned' | 'isDeleted'> & { id?: string }): Promise<AppData> => {
  const id = payload.id || crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Create an optimistic message
  const optimisticMsg: ChatMessage = {
    id,
    channelId: payload.channelId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole || 'viewer', // Add fallback
    content: payload.content,
    replyToId: payload.replyToId,
    timestamp: timestamp,
    isPinned: false,
    isDeleted: false,
    reactions: {},
    attachments: payload.attachments || []
  };

  // Construct optimistic data safely
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  const newData = {
    ...data,
    communications: {
      ...comms,
      channels,
      messages: {
        ...messages,
        [payload.channelId]: [...(messages[payload.channelId] || []), optimisticMsg]
      }
    }
  };

  // Perform background DB insert (don't block returning optimistic UI)
  supabase.from('chat_messages').insert({
    id,
    channel_id: payload.channelId,
    content: payload.content,
    sender_id: payload.senderId,
    sender_name: payload.senderName,
    sender_role: payload.senderRole || 'viewer',
    reply_to_id: payload.replyToId,
    attachments: payload.attachments || []
  }).then(({ error }) => {
    if (error) console.error("Error sending message:", error);
  });

  return newData;
};

export const editChatMessage = async (data: AppData, channelId: string, messageId: string, newContent: string): Promise<AppData> => {
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  const newData = {
    ...data,
    communications: {
      ...comms,
      channels,
      messages: {
        ...messages,
        [channelId]: (messages[channelId] || []).map(msg => 
          msg.id === messageId ? { ...msg, content: newContent, editedAt: new Date().toISOString() } : msg
        )
      }
    }
  };

  supabase.from('chat_messages').update({
    content: newContent,
    edited_at: new Date().toISOString()
  }).eq('id', messageId).then(({ error }) => {
    if (error) console.error("Error editing message:", error);
  });

  return newData;
};

export const softDeleteChatMessage = async (data: AppData, channelId: string, messageId: string): Promise<AppData> => {
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  // Find the message to get attachment URLs before clearing
  const existingMsg = (messages[channelId] || []).find(m => m.id === messageId);
  const attachments = existingMsg?.attachments || [];

  const newData = {
    ...data,
    communications: {
      ...comms,
      channels,
      messages: {
        ...messages,
        [channelId]: (messages[channelId] || []).map(msg => 
          msg.id === messageId ? { ...msg, isDeleted: true, content: '', attachments: [] } : msg
        )
      }
    }
  };

  // Update the DB — mark deleted, clear content and attachments
  supabase.from('chat_messages').update({
    is_deleted: true,
    content: 'This message was deleted',
    attachments: []
  }).eq('id', messageId).then(({ error }) => {
    if (error) console.error("Error deleting message:", error);
  });

  // Clean up storage files for any attachments
  if (attachments.length > 0) {
    const filePaths = attachments
      .map((att: any) => {
        // Extract path from public URL: .../storage/v1/object/public/library_documents/<path>
        try {
          const url = new URL(att.url);
          const match = url.pathname.match(/\/storage\/v1\/object\/public\/library_documents\/(.+)/);
          return match ? match[1] : null;
        } catch { return null; }
      })
      .filter(Boolean) as string[];

    if (filePaths.length > 0) {
      supabase.storage.from('library_documents').remove(filePaths).then(({ error }) => {
        if (error) console.warn('[Storage] Failed to delete attachment files:', error.message);
      });
    }
  }

  return newData;
};

export const togglePinMessage = async (data: AppData, channelId: string, messageId: string): Promise<AppData> => {
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  let isPinned = false;
  const newData = {
    ...data,
    communications: {
      ...comms,
      channels,
      messages: {
        ...messages,
        [channelId]: (messages[channelId] || []).map(msg => {
          if (msg.id === messageId) {
            isPinned = !msg.isPinned;
            return { ...msg, isPinned };
          }
          return msg;
        })
      }
    }
  };

  supabase.from('chat_messages').update({
    is_pinned: isPinned
  }).eq('id', messageId).then(({ error }) => {
    if (error) console.error("Error pinning message:", error);
  });

  return newData;
};

export const toggleReaction = async (data: AppData, channelId: string, messageId: string, emoji: string, userId: string): Promise<AppData> => {
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  let currentReactions: Record<string, string[]> = {};
  
  const newData = {
    ...data,
    communications: {
      ...comms,
      channels,
      messages: {
        ...messages,
        [channelId]: (messages[channelId] || []).map(msg => {
          if (msg.id === messageId) {
            currentReactions = { ...(msg.reactions || {}) };
            let users = currentReactions[emoji] || [];
            if (users.includes(userId)) {
              users = users.filter(id => id !== userId);
            } else {
              users = [...users, userId];
            }
            if (users.length === 0) {
              delete currentReactions[emoji];
            } else {
              currentReactions[emoji] = users;
            }
            return { ...msg, reactions: currentReactions };
          }
          return msg;
        })
      }
    }
  };

  supabase.from('chat_messages').update({
    reactions: currentReactions
  }).eq('id', messageId).then(({ error }) => {
    if (error) console.error("Error toggling reaction:", error);
  });

  return newData;
};

export const markChannelRead = (data: AppData, channelId: string, userId: string): AppData => {
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  const channelIndex = channels.findIndex(c => c.id === channelId);
  if (channelIndex === -1) return data;

  const channel = channels[channelIndex];
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

  const newChannels = [...channels];
  newChannels[channelIndex] = { ...channel, lastReadBy: newLastReadBy };

  return {
    ...data,
    communications: {
      ...comms,
      channels: newChannels,
      messages
    }
  };
};

export const getUnreadCount = (data: AppData, channelId: string, userId: string): number => {
  const channel = data.communications?.channels?.find(c => c.id === channelId);
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
  const id = crypto.randomUUID();
  const newChannel: ChatChannel = {
    id,
    name: payload.name,
    type: payload.type,
    description: payload.description,
    createdBy: payload.createdBy,
    createdAt: new Date().toISOString(),
    participants: payload.participants || [],
    lastReadBy: {}
  };

  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  const newData = {
    ...data,
    communications: {
      ...comms,
      channels: [...channels, newChannel],
      messages: {
        ...messages,
        [id]: []
      }
    }
  };

  supabase.from('chat_channels').insert({
    id,
    name: payload.name,
    description: payload.description,
    type: payload.type,
    created_by: payload.createdBy
  }).then(({ error }) => {
    if (error) console.error("Error adding channel:", error);
  });

  return newData;
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
  const comms = data.communications || { channels: [], messages: {} };
  const channels = comms.channels || [];
  const messages = comms.messages || {};

  const newData = {
    ...data,
    communications: {
      ...comms,
      channels: channels.filter(c => c.id !== channelId),
      messages
    }
  };
  
  const updatedMessages = { ...newData.communications.messages };
  delete updatedMessages[channelId];
  newData.communications.messages = updatedMessages;

  supabase.from('chat_channels').delete().eq('id', channelId).then(({ error }) => {
    if (error) console.error("Error deleting channel:", error);
  });

  return newData;
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

export const reSeedWorkspaceData = async (nicheType: string): Promise<boolean> => {
  if (!isOnline()) {
    console.warn("Re-seeding is only supported in online mode.");
    return false;
  }

  const preset = SEED_DATA_PRESETS[nicheType];
  if (!preset) {
    console.error(`Preset not found for niche type: ${nicheType}`);
    return false;
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // 1. Delete existing rows
    await supabase.from('fee_payments').delete().neq('status', '___NON_EXISTENT___');
    await supabase.from('fee_structures').delete().neq('name', '___NON_EXISTENT___');
    await supabase.from('schedule_slots').delete().neq('grade', '___NON_EXISTENT___');
    await supabase.from('resources').delete().neq('name', '___NON_EXISTENT___');
    await supabase.from('students').delete().neq('name', '___NON_EXISTENT___');

    // 2. Insert new resources
    if (preset.resources && preset.resources.length > 0) {
      const { error: resErr } = await supabase.from('resources').insert(
        preset.resources.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status || 'available',
          capacity: r.capacity || null,
          location: r.location || '',
          notes: r.notes || '',
          usage_history: r.usageHistory || []
        }))
      );
      if (resErr) throw resErr;
    }

    // 3. Insert new fee structures
    if (preset.feeStructures && preset.feeStructures.length > 0) {
      const { error: structErr } = await supabase.from('fee_structures').insert(
        preset.feeStructures.map(f => ({
          name: f.name,
          amount: f.amount,
          term: f.term || 1,
          student_group: f.studentGroup,
          is_recurring: f.isRecurring,
          description: f.description || '',
          created_by: userId
        }))
      );
      if (structErr) throw structErr;
    }

    // Fetch the inserted fee structures to map their generated IDs for the payments
    const { data: dbFeeStructures, error: fetchErr } = await supabase.from('fee_structures').select('*');
    if (fetchErr) throw fetchErr;

    const feeStructureIdMap: Record<string, string> = {};
    if (dbFeeStructures) {
      dbFeeStructures.forEach((dfs: any) => {
        feeStructureIdMap[dfs.name] = dfs.id;
      });
    }

    // 4. Insert students
    const studentNameIdMap: Record<string, string> = {};
    for (const studentData of preset.students) {
      let insertResult = await supabase.from('students').insert({
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
        phone: studentData.phone || null,
        email: studentData.email || null,
        date_of_birth: studentData.dateOfBirth || null,
        guardian_name: studentData.guardianName || null,
        guardian_phone: studentData.guardianPhone || null,
        address: studentData.address || null,
        admission_number: studentData.admissionNumber || null,
        nemis_number: studentData.nemisNumber || null,
        upi: studentData.upi || null,
        kcpe_marks: studentData.kcpeMarks || null,
        national_id: studentData.nationalId || null,
        nita_number: studentData.nitaNumber || null,
        epra_license_status: studentData.epraLicenseStatus || 'None',
        kcse_grade: studentData.kcseGrade || null,
        photo: studentData.photo || null,
        created_by: userId
      }).select().single();

      // Fallback if schema hasn't been migrated yet (missing column error)
      if (insertResult.error) {
        console.warn("Full insert failed, attempting fallback to core schema:", insertResult.error.message);
        insertResult = await supabase.from('students').insert({
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
          created_by: userId
        }).select().single();
      }

      if (insertResult.error) throw insertResult.error;
      const sData = insertResult.data;
      if (sData) {
        studentNameIdMap[sData.name] = sData.id;
      }
    }

    // 5. Insert schedule slots
    if (preset.schedule && preset.schedule.length > 0) {
      const { error: schedErr } = await supabase.from('schedule_slots').insert(
        preset.schedule.map(s => ({
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          duration_minutes: s.durationMinutes,
          grade: s.grade,
          student_group: s.studentGroup,
          subject: s.subject,
          status: s.status || 'Pending',
          resource_ids: [],
          created_by: userId
        }))
      );
      if (schedErr) throw schedErr;
    }

    // 6. Insert payments
    if (preset.feePayments && preset.feePayments.length > 0) {
      const paymentsToInsert = preset.feePayments.map(p => {
        const studentId = studentNameIdMap[p.studentName] || null;
        const feeStructureId = feeStructureIdMap[p.feeName] || null;
        return {
          student_name: p.studentName,
          student_id: studentId,
          fee_structure_id: feeStructureId,
          amount: p.amount,
          method: p.method,
          status: p.status,
          mpesa_receipt_number: p.mpesaReceiptNumber || null,
          mpesa_phone_number: p.mpesaPhoneNumber || null,
          transaction_date: p.transactionDate || new Date().toISOString(),
          recorded_by: p.recordedBy || 'System',
          notes: p.notes || '',
          term: p.term || 1,
          created_by: userId
        };
      });

      const { error: payErr } = await supabase.from('fee_payments').insert(paymentsToInsert);
      if (payErr) throw payErr;
    }

    // Clear cache
    localStorage.removeItem('prism_app_data_cache');
    await setCache('app_data', null);

    return true;
  } catch (err) {
    console.error("Error during re-seeding workspace:", err);
    return false;
  }
};

// --- RESOURCES & LIBRARY ---
export const addResource = async (resource: Omit<Resource, 'id'>): Promise<Resource | null> => {
  const { error, data } = await supabase.from('resources').insert({
    name: resource.name,
    type: resource.type,
    status: resource.status || 'available',
    capacity: resource.capacity,
    location: resource.location,
    notes: resource.notes,
    usage_history: resource.usageHistory || []
  }).select().single();

  if (error) {
    console.error("Error adding resource:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    status: data.status,
    capacity: data.capacity,
    location: data.location,
    notes: data.notes,
    usageHistory: data.usage_history || []
  };
};

export const updateResource = async (resource: Resource): Promise<boolean> => {
  const { error } = await supabase.from('resources').update({
    name: resource.name,
    type: resource.type,
    status: resource.status,
    capacity: resource.capacity,
    location: resource.location,
    notes: resource.notes,
    usage_history: resource.usageHistory || []
  }).eq('id', resource.id);

  if (error) {
    console.error("Error updating resource:", error);
    return false;
  }
  return true;
};

export const deleteResource = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) {
    console.error("Error deleting resource:", error);
    return false;
  }
  return true;
};

export const addLibraryResource = async (resource: Omit<LibraryResource, 'id'>): Promise<LibraryResource | null> => {
  const { error, data } = await supabase.from('library_resources').insert({
    title: resource.title,
    file_name: resource.fileName,
    file_type: resource.fileType || 'application/octet-stream',
    category: resource.category,
    uploaded_by: resource.uploadedBy,
    uploaded_by_id: resource.uploadedById,
    size: resource.size,
    is_approved: resource.isApproved,
    download_url: resource.downloadUrl,
    description: resource.description,
    tags: resource.tags || [],
    academic_term: resource.academicTerm,
    downloads_count: resource.downloadsCount || 0
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
    uploadedById: data.uploaded_by_id,
    uploadedAt: data.uploaded_at,
    size: data.size,
    isApproved: data.is_approved,
    downloadUrl: data.download_url,
    description: data.description,
    downloadsCount: data.downloads_count,
    tags: data.tags,
    academicTerm: data.academic_term
  } as LibraryResource;
};

export const updateLibraryResource = async (dataState: AppData, resource: LibraryResource): Promise<AppData> => {
  const { error } = await supabase.from('library_resources').update({
    title: resource.title,
    is_approved: resource.isApproved,
    description: resource.description,
    category: resource.category,
    tags: resource.tags || [],
    academic_term: resource.academicTerm
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

export const incrementLibraryDownloadCount = async (id: string): Promise<boolean> => {
  const { error } = await supabase.rpc('increment_library_download', { resource_id: id });
  if (error) {
    console.error("Error incrementing download count via RPC:", error);
    // Fallback direct update
    const { data: current } = await supabase.from('library_resources').select('downloads_count').eq('id', id).single();
    if (current) {
      await supabase.from('library_resources').update({ downloads_count: (current.downloads_count || 0) + 1 }).eq('id', id);
    }
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
  if (!isOnline()) {
    await enqueueMutation('addFeePayment', payment);
    return { ...payment, id: -Date.now() } as any;
  }

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
  if (!isOnline()) {
    await enqueueMutation('deleteFeePayment', { id });
    return true;
  }

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

export const performOfflineSync = async (): Promise<boolean> => {
  try {
    let syncFailed = false;
    const handlers: Record<string, (payload: any) => Promise<boolean>> = {
      addStudent: async (payload: any) => {
        const res = await addStudent(payload);
        if (!res) syncFailed = true;
        return res !== null;
      },
      updateStudent: async (payload: any) => {
        const success = await updateStudent(payload);
        if (!success) syncFailed = true;
        return success;
      },
      deleteStudent: async (payload: any) => {
        const success = await deleteStudent(payload.id);
        if (!success) syncFailed = true;
        return success;
      },
      addScheduleSlot: async (payload: any) => {
        const success = await addScheduleSlot(payload);
        if (!success) syncFailed = true;
        return success;
      },
      updateScheduleSlot: async (payload: any) => {
        const success = await updateScheduleSlot(payload);
        if (!success) syncFailed = true;
        return success;
      },
      deleteScheduleSlot: async (payload: any) => {
        const success = await deleteScheduleSlot(payload.id);
        if (!success) syncFailed = true;
        return success;
      },
      addFeePayment: async (payload: any) => {
        const res = await addFeePayment(payload);
        if (!res) syncFailed = true;
        return res !== null;
      },
      deleteFeePayment: async (payload: any) => {
        const success = await deleteFeePayment(payload.id);
        if (!success) syncFailed = true;
        return success;
      }
    };
    await syncQueue(handlers);
    return !syncFailed;
  } catch (err) {
    console.error('[Offline Sync] Error during offline sync:', err);
    return false;
  }
};


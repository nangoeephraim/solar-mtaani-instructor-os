import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { fetchAppData, addStudent, deleteStudent, addScheduleSlot, deleteScheduleSlot, updateScheduleSlot, addFeePayment, addFeeStructure, deleteFeePayment, deleteFeeStructure } from './services/storageService';
import { INITIAL_DATA, DEFAULT_SCHEDULE_TEMPLATE } from './constants';
import { AppData, Student, ScheduleSlot, Resource, LibraryResource, ChatMessage, FeePayment, FeeStructure } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import CommandPalette from './components/CommandPalette';
import SplashScreen from './components/SplashScreen';
import { AnimatedBackground } from './components/AnimatedBackground';

// Lazy load components for code splitting
const Schedule = lazy(() => import('./components/Schedule'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const Students = lazy(() => import('./components/Students'));
const StudentAnalytics = lazy(() => import('./components/StudentAnalytics'));
const Assessment = lazy(() => import('./components/Assessment'));
const Settings = lazy(() => import('./components/Settings'));
const Analytics = lazy(() => import('./components/Analytics'));
const Attendance = lazy(() => import('./components/Attendance'));
const Resources = lazy(() => import('./components/Resources'));
const Communications = lazy(() => import('./components/Communications'));
const Fees = lazy(() => import('./components/Fees'));
const InstructorManagement = lazy(() => import('./components/InstructorManagement'));

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full animate-fade-in">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 flex items-center justify-center animate-pulse">
        <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-lg" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[var(--md-sys-color-secondary)] font-bold tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 mb-4">An error occurred while loading this section.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const { showToast } = useToast();

  // Refs for realtime callbacks to access latest state without re-triggering useEffect
  const currentViewRef = useRef(currentView);
  const userRef = useRef(user);

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Role hierarchy for view access control
  const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };
  const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

  // Restricted views mapped to minimum role level required
  const VIEW_MIN_ROLE: Record<string, number> = {
    analytics: 3,         // admin only
    fees: 3,              // admin only
    instructors: 3,       // admin only
    'student-analytics': 2, // instructor+
    assessment: 2,        // instructor+
  };

  // Redirect guard: if current view is restricted, bounce to dashboard
  useEffect(() => {
    const minLevel = VIEW_MIN_ROLE[currentView] || 1;
    if (userLevel < minLevel) {
      setCurrentView('dashboard');
    }
  }, [currentView, userLevel]);

  // Navigation handler with optional student ID
  const handleNavigate = (view: string, studentId?: number) => {
    // Check permission before navigating
    const minLevel = VIEW_MIN_ROLE[view] || 1;
    if (userLevel < minLevel) {
      showToast('You do not have permission to access this section.', 'error');
      return;
    }
    setCurrentView(view);
    if (studentId !== undefined) {
      setSelectedStudentId(studentId);
    }
  };

  // Fetch initial data asynchronously from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        // Import dynamically to avoid circular dependencies if any
        const { fetchAppData } = await import('./services/storageService');

        // Guard against fetchAppData hanging forever — race with 15s timeout
        const appData = await Promise.race([
          fetchAppData(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('data_fetch_timeout')), 15000)
          )
        ]);

        if (isMounted) {
          setData(appData);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('Failed to load app data:', error);
        if (isMounted) {
          setIsLoading(false);
          if (error?.message === 'data_fetch_timeout') {
            showToast('Data loading timed out. Check your network and refresh.', 'error');
          } else {
            showToast('Failed to connect to database.', 'error');
          }
        }
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reconcile stale M-Pesa pending payments on load
  // Payments older than 5 minutes with status 'pending' are auto-expired to 'failed'
  // because the M-Pesa STK push window is typically 60 seconds.
  useEffect(() => {
    if (!data) return;
    const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const stalePayments = data.payments.filter(p =>
      p.method === 'mpesa' &&
      p.status?.toLowerCase() === 'pending' &&
      (now - new Date(p.transactionDate).getTime()) > STALE_THRESHOLD_MS
    );

    if (stalePayments.length === 0) return;

    // Update database and local state
    (async () => {
      const { updateFeePayment } = await import('./services/storageService');
      for (const p of stalePayments) {
        await updateFeePayment(p.id, { status: 'failed' });
      }
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const staleIds = new Set(stalePayments.map(p => p.id));
        return {
          ...prev,
          payments: prev.payments.map(p =>
            staleIds.has(p.id) ? { ...p, status: 'failed' as const } : p
          )
        };
      });
    })();
  }, [data?.payments?.length]); // Re-run when payments array length changes (i.e. on initial load)

  // Setup Realtime Subscriptions — subscribes to ALL tables that need live sync
  useEffect(() => {
    if (!data) return;

    import('./services/realtimeService').then(({
      subscribeToChatMessages,
      subscribeToChatChannels,
      subscribeToStudents,
      subscribeToSchedule,
      subscribeToLibrary,
      subscribeToFeePayments,
      startHealthMonitor,
      unsubscribeAll
    }) => {
      import('./services/storageService').then(({
        formatFeePaymentFromDB,
        formatStudentFromDB,
        formatScheduleSlot,
        formatChannelFromDB
      }) => {

        // ─── Chat Messages (INSERT, UPDATE, DELETE) ───
        subscribeToChatMessages(null, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const msg = payload.new as any;
              const channelId = msg.channel_id;
              const currentComms = prevData.communications || { channels: [], messages: {} };
              const existingMsgs = currentComms.messages[channelId] || [];

              // Deduplicate
              if (existingMsgs.some((m) => m.id === msg.id)) return prevData;

              const frontendMsg: ChatMessage = {
                id: msg.id,
                channelId: msg.channel_id,
                senderId: msg.sender_id,
                senderName: msg.sender_name || 'Unknown',
                content: msg.content,
                timestamp: msg.created_at,
                isPinned: msg.is_pinned || false,
                isDeleted: msg.is_deleted || false,
                reactions: msg.reactions || {},
                editedAt: msg.edited_at,
                replyToId: msg.reply_to_id,
                attachments: msg.attachments || []
              };

              // Toast notification for messages when not in communications view
              const currentUser = userRef.current;
              const view = currentViewRef.current;
              if (currentUser && msg.sender_id !== currentUser.id && view !== 'communications') {
                const channel = currentComms.channels.find(c => c.id === msg.channel_id);
                const prefix = channel?.type === 'dm' ? '(Direct Message)' : `(#${channel?.name || 'Channel'})`;
                const preview = msg.content.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content;
                showToast(`${prefix} ${msg.sender_name || 'Someone'}: ${preview}`, 'success');
              }

              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  messages: {
                    ...currentComms.messages,
                    [channelId]: [...existingMsgs, frontendMsg]
                  }
                }
              };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const msg = payload.new as any;
              const channelId = msg.channel_id;
              const existingMsgs = prevData.communications?.messages?.[channelId] || [];
              const msgIndex = existingMsgs.findIndex((m) => m.id === msg.id);
              if (msgIndex === -1) return prevData;

              const updatedMsgs = [...existingMsgs];
              updatedMsgs[msgIndex] = {
                ...updatedMsgs[msgIndex],
                content: msg.content,
                senderName: msg.sender_name || updatedMsgs[msgIndex].senderName,
                isPinned: msg.is_pinned,
                isDeleted: msg.is_deleted,
                reactions: msg.reactions || {},
                editedAt: msg.edited_at,
                replyToId: msg.reply_to_id,
                attachments: msg.attachments || []
              };

              return {
                ...prevData,
                communications: {
                  ...prevData.communications,
                  messages: {
                    ...prevData.communications.messages,
                    [channelId]: updatedMsgs
                  }
                }
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const msgId = payload.old?.id;
              if (!msgId) return prevData;

              const newMessages: Record<string, ChatMessage[]> = { ...(prevData.communications?.messages || {}) };
              let changed = false;
              for (const [chId, msgs] of Object.entries(newMessages)) {
                const filtered = msgs.filter((m) => m.id !== msgId);
                if (filtered.length !== msgs.length) {
                  newMessages[chId] = filtered;
                  changed = true;
                }
              }
              if (!changed) return prevData;

              return {
                ...prevData,
                communications: {
                  ...prevData.communications,
                  messages: newMessages
                }
              };
            });
          }
        });

        // ─── Chat Channels (INSERT, UPDATE, DELETE) ───
        subscribeToChatChannels((payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const newChannel = formatChannelFromDB(payload.new);
              const currentComms = prevData.communications || { channels: [], messages: {} };
              // Deduplicate
              if (currentComms.channels.some(c => c.id === newChannel.id)) return prevData;
              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  channels: [...currentComms.channels, newChannel],
                  messages: { ...currentComms.messages, [newChannel.id]: [] }
                }
              };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const updatedChannel = formatChannelFromDB(payload.new);
              return {
                ...prevData,
                communications: {
                  ...prevData.communications,
                  channels: prevData.communications.channels.map(c =>
                    c.id === updatedChannel.id ? updatedChannel : c
                  )
                }
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const deletedId = payload.old?.id;
              if (!deletedId) return prevData;
              const newMessages = { ...(prevData.communications?.messages || {}) };
              delete newMessages[deletedId];
              return {
                ...prevData,
                communications: {
                  ...prevData.communications,
                  channels: prevData.communications.channels.filter(c => c.id !== deletedId),
                  messages: newMessages
                }
              };
            });
          }
        });

        // ─── Fee Payments (UPDATE for M-Pesa status) ───
        subscribeToFeePayments((payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedPayment = formatFeePaymentFromDB(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              if (!prevData.payments.some(p => p.id === updatedPayment.id)) return prevData;
              return {
                ...prevData,
                payments: prevData.payments.map(p =>
                  p.id === updatedPayment.id ? updatedPayment : p
                )
              };
            });
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newPayment = formatFeePaymentFromDB(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.payments.some(p => p.id === newPayment.id)) return prevData;
              return { ...prevData, payments: [newPayment, ...prevData.payments] };
            });
          }
        });

        // ─── Students (INSERT, UPDATE, DELETE) ───
        subscribeToStudents((payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newStudent = formatStudentFromDB(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.students.some(s => s.id === newStudent.id)) return prevData;
              return { ...prevData, students: [newStudent, ...prevData.students] };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedStudent = formatStudentFromDB(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                students: prevData.students.map(s =>
                  s.id === updatedStudent.id ? updatedStudent : s
                )
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                students: prevData.students.filter(s => s.id !== deletedId)
              };
            });
          }
        });

        // ─── Schedule Slots (INSERT, UPDATE, DELETE) ───
        subscribeToSchedule((payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newSlot = formatScheduleSlot(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.schedule.some(s => s.id === newSlot.id)) return prevData;
              return { ...prevData, schedule: [...prevData.schedule, newSlot] };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedSlot = formatScheduleSlot(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                schedule: prevData.schedule.map(s =>
                  s.id === updatedSlot.id ? updatedSlot : s
                )
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                schedule: prevData.schedule.filter(s => s.id !== deletedId)
              };
            });
          }
        });

        // ─── Library Resources (INSERT, UPDATE, DELETE) ───
        subscribeToLibrary((payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const raw = payload.new as any;
            const newRes = {
              id: raw.id, title: raw.title, fileName: raw.file_name, fileType: raw.file_type,
              category: raw.category, uploadedBy: raw.uploaded_by, uploadedAt: raw.uploaded_at,
              size: raw.size, isApproved: raw.is_approved, downloadUrl: raw.download_url
            } as LibraryResource;
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.library?.some(r => r.id === newRes.id)) return prevData;
              return { ...prevData, library: [newRes, ...(prevData.library || [])] };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const raw = payload.new as any;
            const updatedRes = {
              id: raw.id, title: raw.title, fileName: raw.file_name, fileType: raw.file_type,
              category: raw.category, uploadedBy: raw.uploaded_by, uploadedAt: raw.uploaded_at,
              size: raw.size, isApproved: raw.is_approved, downloadUrl: raw.download_url
            } as LibraryResource;
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                library: prevData.library?.map(r => r.id === updatedRes.id ? updatedRes : r) || []
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                library: prevData.library?.filter(r => r.id !== deletedId) || []
              };
            });
          }
        });

        // Start the health monitor for auto-recovery of dropped connections
        startHealthMonitor();
      });
    });

    return () => {
      import('./services/realtimeService').then(({ unsubscribeAll }) => {
        unsubscribeAll();
      });
    };
  }, [!!data]); // Run once when data changes from falsy to truthy

  // Save handler wrapper (No longer saves to localStorage directly)
  const saveDataToState = (newData: AppData) => {
    setData(newData);
  };

  const handleUpdateStudent = async (updatedStudent: Student, notify = false) => {
    if (!data) return;
    const { updateStudent } = await import('./services/storageService');
    const success = await updateStudent(updatedStudent);
    if (success) {
      const newData = {
        ...data,
        students: data.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      };
      saveDataToState(newData);
      if (notify) showToast('Student updated successfully', 'success');
    } else {
      showToast('Failed to update student', 'error');
    }
  };

  const handleUpdateAppData = (newData: AppData) => {
    saveDataToState(newData);
  };

  const handleAddStudent = async (studentData: Omit<Student, 'id'>) => {
    if (!data) return;
    const { addStudent } = await import('./services/storageService');
    const newStudent = await addStudent(studentData);
    if (newStudent) {
      const newData = {
        ...data,
        students: [newStudent, ...data.students]
      };
      saveDataToState(newData);
      showToast(`${studentData.name} added successfully!`, 'success');
    } else {
      showToast(`Failed to add ${studentData.name}`, 'error');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!data) return;
    const { deleteStudent } = await import('./services/storageService');
    const student = data.students.find(s => s.id === studentId);
    const success = await deleteStudent(studentId);
    if (success) {
      const newData = {
        ...data,
        students: data.students.filter(s => s.id !== studentId)
      };
      saveDataToState(newData);
      if (student) {
        showToast(`${student.name} has been removed`, 'info');
      }
    } else {
      showToast('Failed to remove student', 'error');
    }
  };

  const handleUpdateSchedule = async (slotId: string, status: ScheduleSlot['status']) => {
    if (!data) return;
    const slotToUpdate = data.schedule.find(s => s.id === slotId);
    if (!slotToUpdate) return;

    const { updateScheduleSlot } = await import('./services/storageService');
    const success = await updateScheduleSlot({ ...slotToUpdate, status });

    if (success) {
      const newData = {
        ...data,
        schedule: data.schedule.map(s => s.id === slotId ? { ...s, status } : s)
      };
      saveDataToState(newData);
      showToast(`Schedule updated`, 'success');
    } else {
      showToast('Failed to update schedule status', 'error');
    }
  };

  const handleAddScheduleSlot = async (slotData: Omit<ScheduleSlot, 'id'>) => {
    if (!data) return;
    const { addScheduleSlot } = await import('./services/storageService');
    // We trigger a refetch or optimistically update. For now, we'll force a refetch since ID generation is server-side
    const success = await addScheduleSlot({ ...slotData, id: '' } as ScheduleSlot);
    if (success) {
      const { fetchAppData } = await import('./services/storageService');
      const freshData = await fetchAppData();
      saveDataToState(freshData);
      showToast('New class added to schedule', 'success');
    } else {
      showToast('Failed to add schedule slot', 'error');
    }
  };

  const handleEditScheduleSlot = async (updatedSlot: ScheduleSlot) => {
    if (!data) return;
    const { updateScheduleSlot } = await import('./services/storageService');
    const success = await updateScheduleSlot(updatedSlot);
    if (success) {
      const newData = {
        ...data,
        schedule: data.schedule.map(s => s.id === updatedSlot.id ? updatedSlot : s)
      };
      saveDataToState(newData);
      showToast('Class updated successfully', 'success');
    } else {
      showToast('Failed to update class slot', 'error');
    }
  };

  const handleDeleteScheduleSlot = async (slotId: string) => {
    if (!data) return;
    const { deleteScheduleSlot } = await import('./services/storageService');
    const success = await deleteScheduleSlot(slotId);
    if (success) {
      const newData = {
        ...data,
        schedule: data.schedule.filter(s => s.id !== slotId)
      };
      saveDataToState(newData);
      showToast('Session removed', 'info');
    } else {
      showToast('Failed to remove session', 'error');
    }
  };

  const handleResetSchedule = () => {
    if (!data) return;
    // Generate fresh IDs so React treats these as new data
    const freshSchedule = DEFAULT_SCHEDULE_TEMPLATE.map((slot, i) => ({
      ...slot,
      id: `reset-${Date.now()}-${i}`,
      status: 'Pending' as const,
    }));
    const newData: AppData = { ...data, schedule: freshSchedule };
    saveDataToState(newData);
  };

  const handleAddResource = async (resourceData: Omit<Resource, 'id'>) => {
    if (!data) return;
    const { fetchAppData } = await import('./services/storageService'); // Use refetch for simplicty on these minor types right now pending full DB crud
    showToast('Resource added (pending DB)', 'info');
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!data) return;
    showToast('Resource deleted (pending DB)', 'info');
  };

  const handleUpdateResource = async (updatedResource: Resource) => {
    if (!data) return;
    showToast('Resource updated (pending DB)', 'info');
  };

  const handleAddLibraryResource = async (resourceData: Omit<LibraryResource, 'id'>) => {
    if (!data) return;
    const { addLibraryResource } = await import('./services/storageService');
    const newDoc = await addLibraryResource(resourceData);
    if (newDoc) {
      const newData = {
        ...data,
        library: [newDoc, ...(data.library || [])]
      };
      saveDataToState(newData);
    }
  };

  const handleDeleteLibraryResource = async (resourceId: string) => {
    if (!data) return;
    const { deleteLibraryResource } = await import('./services/storageService');
    const success = await deleteLibraryResource(resourceId);
    if (success) {
      const newData = {
        ...data,
        library: data.library?.filter(r => r.id !== resourceId) || []
      };
      saveDataToState(newData);
      showToast('Document removed', 'info');
    }
  };

  const handleUpdateLibraryResource = async (updatedResource: LibraryResource) => {
    if (!data) return;
    const { updateLibraryResource } = await import('./services/storageService');
    const newData = await updateLibraryResource(data, updatedResource);
    saveDataToState(newData);
    showToast('Document updated', 'success');
  };

  // ==========================================
  // FEE PAYMENT HANDLERS
  // ==========================================

  const handleAddFeePayment = async (paymentData: Omit<FeePayment, 'id'>) => {
    if (!data) return;
    const newPayment = await addFeePayment(paymentData);
    if (newPayment) {
      saveDataToState({ ...data, payments: [newPayment, ...data.payments] });
      showToast(`Payment of KES ${paymentData.amount.toLocaleString()} recorded`, 'success');
    } else {
      showToast('Failed to record payment', 'error');
    }
  };

  const handleDeleteFeePayment = async (id: string) => {
    if (!data) return;
    const success = await deleteFeePayment(id);
    if (success) {
      saveDataToState({ ...data, payments: data.payments.filter(p => p.id !== id) });
      showToast('Payment deleted', 'info');
    } else {
      showToast('Failed to delete payment', 'error');
    }
  };

  const handleAddFeeStructure = async (feeData: Omit<FeeStructure, 'id'>) => {
    if (!data) return;
    const newFee = await addFeeStructure(feeData);
    if (newFee) {
      saveDataToState({ ...data, feeStructures: [...data.feeStructures, newFee] });
      showToast(`Fee type "${feeData.name}" created`, 'success');
    } else {
      showToast('Failed to create fee type', 'error');
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    if (!data) return;
    const success = await deleteFeeStructure(id);
    if (success) {
      saveDataToState({ ...data, feeStructures: data.feeStructures.filter(f => f.id !== id) });
      showToast('Fee type removed', 'info');
    } else {
      showToast('Failed to remove fee type', 'error');
    }
  };

  const handleInitiateMpesa = async (phone: string, amount: number, studentId: number, studentName: string): Promise<string | null> => {
    try {
      const { initiateMpesaPayment } = await import('./services/mpesaService');
      showToast('Sending M-Pesa payment request...', 'loading');
      const result = await initiateMpesaPayment(phone, amount, studentId, studentName, 'System');
      if (result.success && result.checkoutRequestId) {
        showToast(`M-Pesa STK Push sent to ${phone}`, 'success');
        return result.checkoutRequestId;
      } else {
        showToast(result.error || 'M-Pesa request failed', 'error');
        return null;
      }
    } catch (err) {
      showToast('Failed to initiate M-Pesa payment', 'error');
      return null;
    }
  };

  const handleSendReminder = async (studentName: string, guardianPhone: string, balance: number) => {
    try {
      const { sendFeeReminder } = await import('./services/smsService');
      showToast('Sending SMS reminder...', 'loading');
      const result = await sendFeeReminder(studentName, guardianPhone, balance);
      if (result.success) {
        showToast(`Fee reminder sent to ${guardianPhone}`, 'success');
      } else {
        showToast(result.error || 'Failed to send SMS', 'error');
      }
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    }
  };

  const handleDataReset = () => {
    // Left empty. Admin tool for migrate is elsewhere.
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: 'var(--md-sys-color-background)' }}>
        <p style={{ color: 'var(--md-sys-color-secondary)' }}>Failed to load data from Supabase.</p>
      </div>
    );
  }

  // Render the main content based on currentView
  const renderContent = () => (
    <AnimatePresence mode="wait">
      {currentView === 'dashboard' && (
        <Dashboard key="dashboard" data={data} onNavigate={handleNavigate} />
      )}

      {currentView === 'analytics' && (
        <Analytics key="analytics" data={data} onNavigate={handleNavigate} />
      )}

      {currentView === 'schedule' && (
        <Schedule
          key="schedule"
          data={data}
          onUpdateSchedule={handleUpdateSchedule}
          onUpdateStudent={handleUpdateStudent}
          onAddSlot={handleAddScheduleSlot}
          onEditSlot={handleEditScheduleSlot}
          onDeleteSlot={handleDeleteScheduleSlot}
          onResetSchedule={handleResetSchedule}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'students' && (
        <StudentProfile
          key="students"
          data={data}
          onUpdateStudent={handleUpdateStudent}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteStudent}
          selectedStudentId={selectedStudentId}
        />
      )}

      {currentView === 'students-manage' && (
        <Students
          key="students-manage"
          data={data}
          onUpdateStudent={handleUpdateStudent}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteStudent}
          onNavigate={handleNavigate}
          selectedStudentId={selectedStudentId}
        />
      )}

      {currentView === 'student-analytics' && selectedStudentId && (
        <StudentAnalytics
          key={`student-analytics-${selectedStudentId}`}
          data={data}
          studentId={selectedStudentId}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'student-analytics' && !selectedStudentId && (
        <Students
          key="student-analytics-empty"
          data={data}
          onUpdateStudent={handleUpdateStudent}
          onAddStudent={handleAddStudent}
          onDeleteStudent={handleDeleteStudent}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'assessment' && (
        <Assessment
          key="assessment"
          data={data}
          onUpdateStudent={handleUpdateStudent}
        />
      )}

      {currentView === 'attendance' && (
        <Attendance
          key="attendance"
          data={data}
          onUpdateStudent={handleUpdateStudent}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'resources' && (
        <Resources
          key="resources"
          data={data}
          onAddResource={handleAddResource}
          onDeleteResource={handleDeleteResource}
          onUpdateResource={handleUpdateResource}
          onAddLibraryResource={handleAddLibraryResource}
          onDeleteLibraryResource={handleDeleteLibraryResource}
          onUpdateLibraryResource={handleUpdateLibraryResource}
        />
      )}

      {currentView === 'settings' && (
        <Settings
          key="settings"
          onDataReset={handleDataReset}
        />
      )}

      {currentView === 'communications' && (
        <Communications
          key="communications"
          data={data}
          onUpdateAppData={handleUpdateAppData}
        />
      )}

      {currentView === 'fees' && (
        <Fees
          key="fees"
          data={data}
          onAddPayment={handleAddFeePayment}
          onAddFeeStructure={handleAddFeeStructure}
          onDeletePayment={handleDeleteFeePayment}
          onDeleteFeeStructure={handleDeleteFeeStructure}
          onInitiateMpesa={handleInitiateMpesa}
          onSendReminder={handleSendReminder}
          onNavigate={handleNavigate}
        />
      )}

      {currentView === 'instructors' && (
        <InstructorManagement key="instructors" />
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex relative h-full bg-[var(--md-sys-color-background)] overflow-hidden">
      {/* Global Animated Background */}
      <AnimatedBackground />

      <div className="flex relative h-full w-full z-10 transition-all duration-500">
        {/* Command Palette */}
        <CommandPalette data={data} onNavigate={handleNavigate} />

        {/* Sidebar Navigation */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} data={data} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {(() => {
            const isAppView = currentView === 'communications' || currentView === 'schedule';
            return (
              <main className={clsx(
                "flex-1 overflow-x-hidden relative scroll-smooth",
                isAppView ? "overflow-hidden" : "overflow-y-auto"
              )}>
                <div className={clsx(
                  "mx-auto w-full transition-all duration-300",
                  isAppView ? "h-full p-0 max-w-none" : "p-4 md:p-6 lg:p-8 pb-32 lg:pb-8 max-w-[1600px]"
                )}>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      {renderContent()}
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </main>
            );
          })()}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav currentView={currentView} onNavigate={handleNavigate} />
      </div>
    </div>
  );
};

// Use environment variable for Client ID
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <SplashScreen key="splash" />
      ) : !isAuthenticated ? (
        <LoginPage key="login" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthWrapper>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </AuthWrapper>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
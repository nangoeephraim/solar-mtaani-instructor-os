import React, { useState, useEffect, Suspense, lazy, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
  fetchAppData,
  addStudent,
  deleteStudent,
  addScheduleSlot,
  deleteScheduleSlot,
  updateScheduleSlot,
  addFeePayment,
  addFeeStructure,
  deleteFeePayment,
  deleteFeeStructure,
  updateFeePayment,
  updateStudent,
  addLibraryResource,
  deleteLibraryResource,
  updateLibraryResource,
  addResource,
  updateResource,
  deleteResource,
  formatFeePaymentFromDB,
  formatStudentFromDB,
  formatScheduleSlot,
  formatChannelFromDB,
  performOfflineSync,
  getSettings
} from './services/storageService';
import { INITIAL_DATA, DEFAULT_SCHEDULE_TEMPLATE } from './constants';
import { AppData, Student, ScheduleSlot, Resource, LibraryResource, ChatMessage, FeePayment, FeeStructure, DEFAULT_SETTINGS, CurriculumUnit } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { KENYAN_CURRICULA } from './utils/curriculumData';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import CommandPalette from './components/CommandPalette';
import SplashScreen from './components/SplashScreen';
import { AnimatedBackground } from './components/AnimatedBackground';
import { SallyChat } from './components/SallyChat';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { EasterEgg } from './components/EasterEgg';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  subscribeToChatMessages,
  subscribeToChatChannels,
  subscribeToStudents,
  subscribeToSchedule,
  subscribeToLibrary,
  subscribeToFeePayments,
  subscribeToResources,
  startHealthMonitor,
  unsubscribeAll
} from './services/realtimeService';
import { getPendingMutations } from './services/offlineSyncService';
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
const IconGallery = lazy(() => import('./components/IconGallery'));
const Curriculum = lazy(() => import('./components/Curriculum'));

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

// Role hierarchy for view access control
const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };

// Restricted views mapped to minimum role level required
const VIEW_MIN_ROLE: Record<string, number> = {
  analytics: 3,         // admin only
  fees: 3,              // admin only
  instructors: 3,       // admin only
  'student-analytics': 2, // instructor+
  assessment: 2,        // instructor+
};

// ─── Global meeting code persistence ───
// Read the ?meet= param ONCE at the top-level module scope so it survives
// React re-mounts caused by the auth wrapper showing LoginPage first.
// This is the Google Meet approach: the URL carries the meeting ID and
// the app preserves it across the entire authentication flow.
const INITIAL_MEET_CODE: string | null = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('meet');
    if (code) {
      // Persist to sessionStorage so it survives full page reloads during auth
      sessionStorage.setItem('prism_pending_meet', code);
      return code;
    }
    // Check sessionStorage fallback (set on a previous page load before auth redirect)
    return sessionStorage.getItem('prism_pending_meet') || null;
  } catch {
    return null;
  }
})();

const resolveCurriculum = (curriculum?: Record<string, CurriculumUnit[]>): AppData['curriculum'] => {
  return curriculum || {};
};

const AppContent: React.FC = () => {
  const { preferences } = useTheme();
  const activeCurriculum = preferences?.selectedCurriculum || 'TVET_CDACC';

  const [data, setData] = useState<AppData | null>(null);

  // Reactively populate/update curriculum state when preferences change
  useEffect(() => {
    if (data) {
      const targetCurriculum = resolveCurriculum(KENYAN_CURRICULA[activeCurriculum]);
      if (JSON.stringify(data.curriculum) !== JSON.stringify(targetCurriculum)) {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            curriculum: targetCurriculum
          };
        });
      }
    }
  }, [data, activeCurriculum]);

  // Use the globally-captured meeting code so it survives auth flow
  const [pendingMeetCode, setPendingMeetCode] = useState<string | null>(INITIAL_MEET_CODE);
  const [currentView, setCurrentView] = useState(() => {
    return INITIAL_MEET_CODE ? 'communications' : 'dashboard';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.tagName === 'SELECT' || 
                      target.isContentEditable;
      
      if (isInput) return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 8) {
          e.preventDefault();
          const mappings: Record<number, string> = {
            1: 'dashboard',
            2: user?.role === 'admin' ? 'analytics' : 'schedule',
            3: 'schedule',
            4: 'students-manage',
            5: 'attendance',
            6: 'curriculum',
            7: 'communications',
            8: 'settings'
          };
          const targetView = mappings[keyNum];
          if (targetView) {
            setCurrentView(targetView);
            setSelectedStudentId(undefined);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  const { showToast } = useToast();

  // Trigger offline sync when connection is restored
  useEffect(() => {
    const handleOnline = async () => {
      showToast('Connection restored! Syncing offline updates...', 'loading');
      try {
        const success = await performOfflineSync();
        
        // Refresh local data to pull synced records
        const freshData = await fetchAppData();
        setData(freshData);
        
        if (success) {
          showToast('Offline sync completed successfully!', 'success');
        } else {
          showToast('Some offline updates could not be synced.', 'warning');
        }
      } catch (err) {
        console.error('Failed to sync offline updates:', err);
        showToast('Offline sync failed.', 'error');
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Check/sync on mount if online and has pending queue
    if (navigator.onLine) {
      getPendingMutations().then((pending) => {
        if (pending.length > 0) {
          handleOnline();
        }
      });
    }

    // Periodic check every 30s if online and has pending mutations
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        getPendingMutations().then((pending) => {
          if (pending.length > 0) {
            handleOnline();
          }
        });
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
    };
  }, [showToast]);

  // Clean up URL + sessionStorage after the meeting code has been consumed
  useEffect(() => {
    if (pendingMeetCode) {
      // Clean the URL so refreshes don't re-trigger
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('meet')) {
          url.searchParams.delete('meet');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      } catch {}
      // Clear sessionStorage after consumption so future loads don't pick it up
      sessionStorage.removeItem('prism_pending_meet');
    }
  }, [pendingMeetCode]);

  // Refs for realtime callbacks to access latest state without re-triggering useEffect
  const currentViewRef = useRef(currentView);
  const userRef = useRef(user);

  useEffect(() => { currentViewRef.current = currentView; }, [currentView]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Handle visual viewport for mobile keyboards
  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      document.documentElement.style.setProperty('--vh', `${vv.height * 0.01}px`);
      
      // If visual viewport height is significantly smaller than inner height, keyboard is open
      const isKeyboard = (window.innerHeight - vv.height) > 120;
      if (isKeyboard) {
        document.body.classList.add('keyboard-visible');
      } else {
        document.body.classList.remove('keyboard-visible');
      }
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('keyboard-visible');
    };
  }, []);

  const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

  // Redirect guard: if current view is restricted, bounce to dashboard
  useEffect(() => {
    const minLevel = VIEW_MIN_ROLE[currentView] || 1;
    if (userLevel < minLevel) {
      setCurrentView('dashboard');
    }
  }, [currentView, userLevel]);

  // Navigation handler with optional student ID
  const handleNavigate = useCallback((view: string, studentId?: number) => {
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
  }, [userLevel, showToast]);

  // Listen for navigation events dispatched when a user clicks "Join Now"
  // on a broadcast meeting card. If the user is on Dashboard or another view,
  // this ensures Communications (which embeds Meetings) gets activated with
  // the meeting code propagated via props — Google Meet / Zoom pattern.
  useEffect(() => {
    const handleNavToCommunications = () => {
      const minLevel = VIEW_MIN_ROLE['communications'] || 1;
      if (userLevel >= minLevel) {
        setCurrentView('communications');
      }
    };
    
    // Also catch prepare-meeting at the App level: if the user is NOT already
    // on Communications, we need to switch AND set the meeting code so it
    // propagates down through the prop chain.
    const handlePrepareMeetingAtApp = (e: any) => {
      const mId = e.detail;
      if (!mId) return;
      const minLevel = VIEW_MIN_ROLE['communications'] || 1;
      if (userLevel >= minLevel) {
        setPendingMeetCode(mId);
        setCurrentView('communications');
      }
    };
    
    const handleToggleShortcuts = () => {
      setShowShortcuts(prev => !prev);
    };
    
    window.addEventListener('navigate-to-communications', handleNavToCommunications);
    window.addEventListener('prepare-meeting', handlePrepareMeetingAtApp);
    window.addEventListener('prism-toggle-shortcuts', handleToggleShortcuts);
    return () => {
      window.removeEventListener('navigate-to-communications', handleNavToCommunications);
      window.removeEventListener('prepare-meeting', handlePrepareMeetingAtApp);
      window.removeEventListener('prism-toggle-shortcuts', handleToggleShortcuts);
    };
  }, [userLevel]);

  // Native back navigation coordinator using @capacitor/app
  useEffect(() => {
    let backListener: any = null;
    let lastBackButtonPress = 0;

    const setupBackButton = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          backListener = await App.addListener('backButton', () => {
            // Dispatch a cancellable custom event
            const event = new CustomEvent('app-back-button', { cancelable: true });
            window.dispatchEvent(event);

            if (event.defaultPrevented) {
              // Something handled the back event (e.g. closed a drawer or modal)
              return;
            }

            // Fallback: If nothing was open, handle navigation back to dashboard
            if (currentView !== 'dashboard') {
              handleNavigate('dashboard');
            } else {
              const now = Date.now();
              if (now - lastBackButtonPress < 2000) {
                App.exitApp();
              } else {
                lastBackButtonPress = now;
                showToast('Press back again to exit', 'info');
              }
            }
          });
        }
      } catch (err) {
        console.error('Error setting up native back button listener:', err);
      }
    };

    setupBackButton();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [currentView, handleNavigate, showToast]);

  // Fetch initial data asynchronously from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        // Guard against fetchAppData hanging forever — race with 15s timeout
        const appData = await Promise.race([
          fetchAppData(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('data_fetch_timeout')), 15000)
          )
        ]);

        if (isMounted) {
          const currentPrefs = getSettings()?.preferences || DEFAULT_SETTINGS.preferences;
          const activeCurr = currentPrefs.selectedCurriculum || 'TVET_CDACC';
          appData.curriculum = resolveCurriculum(KENYAN_CURRICULA[activeCurr]);
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

  // ── Initialize Notification Engine ──
  // Request permission on first load and listen for SW navigation messages
  useEffect(() => {
    if (!data) return;

    let cleanupSWListener: (() => void) | undefined;

    import('./services/notificationService').then(({ notificationService }) => {
      // Request notification permission (non-blocking — prompts user once)
      notificationService.requestPermission().then((granted) => {
        if (granted) {
          console.log('[PRISM] Notification permission granted');
        }
      });

      // Listen for SW messages (e.g., user clicked a notification action button)
      cleanupSWListener = notificationService.listenForServiceWorkerMessages((view, navData) => {
        console.log('[PRISM] Notification navigation →', view, navData);
        handleNavigate(view);
      });
    });

    return () => {
      cleanupSWListener?.();
    };
  }, [!!data, handleNavigate]);

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

    {

        // ─── Chat Messages (INSERT, UPDATE, DELETE) ───
        subscribeToChatMessages(null, (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const msg = payload.new as any;
              const channelId = msg.channel_id;
              const currentComms = prevData.communications || { channels: [], messages: {} };
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              const existingMsgs = currentMessages[channelId] || [];

              // Deduplicate
              if (existingMsgs.some((m) => m.id === msg.id)) return prevData;

              const frontendMsg: ChatMessage = {
                id: msg.id,
                channelId: msg.channel_id,
                senderId: msg.sender_id,
                senderName: msg.sender_name || 'Unknown',
                senderRole: msg.sender_role || 'viewer',
                content: msg.content,
                timestamp: msg.created_at,
                isPinned: msg.is_pinned || false,
                isDeleted: msg.is_deleted || false,
                reactions: msg.reactions || {},
                editedAt: msg.edited_at,
                replyToId: msg.reply_to_id,
                attachments: msg.attachments || []
              };

              // Toast + native notification for messages when not in communications view
              const currentUser = userRef.current;
              const view = currentViewRef.current;
              if (currentUser && msg.sender_id !== currentUser.id && view !== 'communications') {
                const channel = currentChannels.find(c => c.id === msg.channel_id);
                const channelLabel = channel?.type === 'dm' ? 'Direct Message' : (channel?.name || 'Channel');
                const prefix = channel?.type === 'dm' ? '(Direct Message)' : `(#${channelLabel})`;
                const preview = msg.content.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content;
                showToast(`${prefix} ${msg.sender_name || 'Someone'}: ${preview}`, 'success');

                // Native OS notification via Service Worker
                import('./services/notificationService').then(({ notificationService }) => {
                  notificationService.notifyMessage(
                    msg.sender_name || 'Someone',
                    channelLabel,
                    preview
                  );
                });
              }

              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  channels: currentChannels,
                  messages: {
                    ...currentMessages,
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
              const currentComms = prevData.communications || { channels: [], messages: {} };
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              const existingMsgs = currentMessages[channelId] || [];
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
                  ...currentComms,
                  channels: currentChannels,
                  messages: {
                    ...currentMessages,
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

              const currentComms = prevData.communications || { channels: [], messages: {} };
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              const newMessages: Record<string, ChatMessage[]> = { ...currentMessages };
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
                  ...currentComms,
                  channels: currentChannels,
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
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              // Deduplicate
              if (currentChannels.some(c => c.id === newChannel.id)) return prevData;
              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  channels: [...currentChannels, newChannel],
                  messages: { ...currentMessages, [newChannel.id]: [] }
                }
              };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const updatedChannel = formatChannelFromDB(payload.new);
              const currentComms = prevData.communications || { channels: [], messages: {} };
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  channels: currentChannels.map(c => {
                    if (c.id !== updatedChannel.id) return c;
                    // MERGE lastReadBy: keep our local read timestamps if they're newer
                    const mergedLastReadBy = { ...(updatedChannel.lastReadBy || {}) };
                    const localReadBy = c.lastReadBy || {};
                    for (const [uid, ts] of Object.entries(localReadBy)) {
                      if (!mergedLastReadBy[uid] || new Date(ts) > new Date(mergedLastReadBy[uid])) {
                        mergedLastReadBy[uid] = ts;
                      }
                    }
                    return { ...updatedChannel, lastReadBy: mergedLastReadBy };
                  }),
                  messages: currentMessages
                }
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setData((prevData) => {
              if (!prevData) return prevData;
              const deletedId = payload.old?.id;
              if (!deletedId) return prevData;
              const currentComms = prevData.communications || { channels: [], messages: {} };
              const currentChannels = currentComms.channels || [];
              const currentMessages = currentComms.messages || {};
              const newMessages = { ...currentMessages };
              delete newMessages[deletedId];
              return {
                ...prevData,
                communications: {
                  ...currentComms,
                  channels: currentChannels.filter(c => c.id !== deletedId),
                  messages: newMessages
                }
              };
            });
          }
        });

        // ─── Fee Payments (UPDATE for M-Pesa status, INSERT for new payments) ───
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

            // Native notification for payment status changes
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyPayment(
                updatedPayment.studentName || 'Student',
                updatedPayment.amount || 0,
                updatedPayment.status || 'updated'
              );
            });
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newPayment = formatFeePaymentFromDB(payload.new);
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.payments.some(p => p.id === newPayment.id)) return prevData;
              return { ...prevData, payments: [newPayment, ...prevData.payments] };
            });

            // Native notification for new payment
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyPayment(
                newPayment.studentName || 'Student',
                newPayment.amount || 0,
                newPayment.status || 'pending'
              );
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

            // Native notification for new student enrollment
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyStudent('enrolled', newStudent.name || 'New Student');
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

            // Native notification for new schedule slot
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyScheduleChange('added', newSlot.subject || 'Class', `G${newSlot.grade || '?'}`);
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

            // Native notification for schedule update
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyScheduleChange('updated', updatedSlot.subject || 'Class', `G${updatedSlot.grade || '?'}`);
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

            // Native notification for schedule cancellation
            import('./services/notificationService').then(({ notificationService }) => {
              notificationService.notifyScheduleChange('cancelled', 'Class', 'slot');
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

        // ─── Physical Resources (INSERT, UPDATE, DELETE) ───
        subscribeToResources((payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const raw = payload.new as any;
            const newRes: Resource = {
              id: raw.id,
              name: raw.name,
              type: raw.type,
              status: raw.status,
              capacity: raw.capacity,
              location: raw.location,
              notes: raw.notes,
              usageHistory: raw.usage_history || []
            };
            setData(prevData => {
              if (!prevData) return prevData;
              if (prevData.resources?.some(r => r.id === newRes.id)) return prevData;
              return { ...prevData, resources: [newRes, ...(prevData.resources || [])] };
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const raw = payload.new as any;
            const updatedRes: Resource = {
              id: raw.id,
              name: raw.name,
              type: raw.type,
              status: raw.status,
              capacity: raw.capacity,
              location: raw.location,
              notes: raw.notes,
              usageHistory: raw.usage_history || []
            };
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                resources: prevData.resources?.map(r => r.id === updatedRes.id ? updatedRes : r) || []
              };
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old?.id;
            if (!deletedId) return;
            setData(prevData => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                resources: prevData.resources?.filter(r => r.id !== deletedId) || []
              };
            });
          }
        });

        // Start the health monitor for auto-recovery of dropped connections
        startHealthMonitor();
      }

      return () => {
        unsubscribeAll();
      };
  }, [!!data]); // Run once when data changes from falsy to truthy

  // Save handler wrapper (No longer saves to localStorage directly)
  const saveDataToState = useCallback((newData: AppData) => {
    setData(newData);
  }, []);

  const handleUpdateStudent = async (updatedStudent: Student, notify = false) => {
    if (!data) return;
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

    const originalSchedule = [...data.schedule];
    const optimisticData = {
      ...data,
      schedule: data.schedule.map(s => s.id === slotId ? { ...s, status } : s)
    };
    saveDataToState(optimisticData);

    const success = await updateScheduleSlot({ ...slotToUpdate, status });
    if (success) {
      const freshData = await fetchAppData();
      saveDataToState(freshData);
      showToast(`Schedule updated`, 'success');
    } else {
      saveDataToState({ ...data, schedule: originalSchedule });
      showToast('Failed to update schedule status', 'error');
    }
  };

  const handleAddScheduleSlot = async (slotData: Omit<ScheduleSlot, 'id'>) => {
    if (!data) return;
    const tempId = `temp-${Date.now()}`;
    const tempSlot: ScheduleSlot = { ...slotData, id: tempId } as ScheduleSlot;
    const originalSchedule = [...data.schedule];
    
    saveDataToState({
      ...data,
      schedule: [...data.schedule, tempSlot]
    });

    const success = await addScheduleSlot({ ...slotData, id: '' } as ScheduleSlot);
    if (success) {
      const freshData = await fetchAppData();
      saveDataToState(freshData);
      showToast('New class added to schedule', 'success');
    } else {
      saveDataToState({ ...data, schedule: originalSchedule });
      showToast('Failed to add schedule slot', 'error');
    }
  };

  const handleEditScheduleSlot = async (updatedSlot: ScheduleSlot) => {
    if (!data) return;
    const originalSchedule = [...data.schedule];
    
    saveDataToState({
      ...data,
      schedule: data.schedule.map(s => s.id === updatedSlot.id ? updatedSlot : s)
    });

    const success = await updateScheduleSlot(updatedSlot);
    if (success) {
      const freshData = await fetchAppData();
      saveDataToState(freshData);
      showToast('Class updated successfully', 'success');
    } else {
      saveDataToState({ ...data, schedule: originalSchedule });
      showToast('Failed to update class slot', 'error');
    }
  };

  const handleDeleteScheduleSlot = async (slotId: string) => {
    if (!data) return;
    const originalSchedule = [...data.schedule];
    
    saveDataToState({
      ...data,
      schedule: data.schedule.filter(s => s.id !== slotId)
    });

    const success = await deleteScheduleSlot(slotId);
    if (success) {
      const freshData = await fetchAppData();
      saveDataToState(freshData);
      showToast('Session removed', 'info');
    } else {
      saveDataToState({ ...data, schedule: originalSchedule });
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
    const newRes = await addResource(resourceData);
    if (newRes) {
      const newData = {
        ...data,
        resources: [newRes, ...(data.resources || [])]
      };
      saveDataToState(newData);
    } else {
      showToast('Failed to create resource', 'error');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!data) return;
    const success = await deleteResource(resourceId);
    if (success) {
      const newData = {
        ...data,
        resources: data.resources?.filter(r => r.id !== resourceId) || []
      };
      saveDataToState(newData);
    } else {
      showToast('Failed to delete resource', 'error');
    }
  };

  const handleUpdateResource = async (updatedResource: Resource) => {
    if (!data) return;
    const success = await updateResource(updatedResource);
    if (success) {
      const newData = {
        ...data,
        resources: data.resources?.map(r => r.id === updatedResource.id ? updatedResource : r) || []
      };
      saveDataToState(newData);
    } else {
      showToast('Failed to update resource', 'error');
    }
  };

  const handleAddLibraryResource = async (resourceData: Omit<LibraryResource, 'id'>) => {
    if (!data) return;
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

  const handleDataReset = async () => {
    setIsLoading(true);
    try {
      const appData = await fetchAppData();
      const currentPrefs = getSettings()?.preferences || DEFAULT_SETTINGS.preferences;
      const activeCurr = currentPrefs.selectedCurriculum || 'TVET_CDACC';
      appData.curriculum = resolveCurriculum(KENYAN_CURRICULA[activeCurr]);
      setData(appData);
    } catch (error) {
      console.error('Failed to reload data:', error);
      showToast('Failed to refresh data after configuration change.', 'error');
    } finally {
      setIsLoading(false);
    }
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

      {currentView === 'icon-gallery' && (
        <IconGallery key="icon-gallery" onNavigate={handleNavigate} />
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
          onNavigate={handleNavigate}
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

      {currentView === 'curriculum' && (
        <Suspense fallback={<LoadingSpinner />}>
          <Curriculum
            key="curriculum"
            data={data}
            onNavigate={handleNavigate}
            onUpdateStudent={handleUpdateStudent}
            onAddScheduleSlot={handleAddScheduleSlot}
          />
        </Suspense>
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
          onUpdateScheduleSlot={handleEditScheduleSlot}
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
          onNavigate={handleNavigate}
          pendingMeetCode={pendingMeetCode || undefined}
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
    <div className="app-shell flex relative h-full bg-[var(--md-sys-color-background)] overflow-hidden">
      {/* Global Animated Background */}
      <AnimatedBackground />

      <div className="flex relative h-full w-full z-10 transition-all duration-500">
        {/* Command Palette */}
        <CommandPalette data={data} onNavigate={handleNavigate} />

        {/* Sidebar Navigation */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} data={data} />

        {/* Main Content Area */}
        <div className="app-main-surface flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 lg:rounded-l-[28px]">
          {(() => {
            const isAppView = currentView === 'communications' || currentView === 'schedule';
            return (
              <main className={clsx(
                "flex-1 overflow-x-hidden relative scroll-smooth",
                isAppView ? "overflow-hidden" : "overflow-y-auto"
              )}>
                <div className={clsx(
                   "page-shell mx-auto w-full transition-all duration-300",
                  isAppView 
                    ? "app-view-container p-0 max-w-none"
                    : "p-4 md:p-6 lg:p-8 pb-32 lg:pb-8 max-w-[1600px]"
                )} style={{ paddingBottom: isAppView ? undefined : 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))' }}>
                  <ErrorBoundary key={currentView}>
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

        {/* Sally AI Companion */}
        <SallyChat currentView={currentView} />

        {/* Keyboard Shortcuts Guide */}
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} userRole={user?.role} />
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
  const [logoTaps, setLogoTaps] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    let tapTimeout: any;
    const handleLogoTap = () => {
      setLogoTaps((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setShowEasterEgg(true);
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
          return 0;
        }
        clearTimeout(tapTimeout);
        tapTimeout = setTimeout(() => {
          setLogoTaps(0);
        }, 3000);
        return next;
      });
    };
    window.addEventListener('prism-logo-tap', handleLogoTap);
    return () => {
      window.removeEventListener('prism-logo-tap', handleLogoTap);
      clearTimeout(tapTimeout);
    };
  }, []);

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
            
            {/* Secret Launch Easter Egg */}
            <EasterEgg isOpen={showEasterEgg} onClose={() => { setLogoTaps(0); setShowEasterEgg(false); }} />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

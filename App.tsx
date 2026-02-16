import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAppData, saveAppData, addStudent, deleteStudent, addScheduleSlot, deleteScheduleSlot, addResource, deleteResource } from './services/storageService';
import { AppData, Student, ScheduleSlot, Resource } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import BackgroundLayout from './components/backgrounds/BackgroundLayout';
import SplashScreen from './components/SplashScreen';

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

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full animate-fade-in">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-[var(--md-sys-color-primary)] to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <span className="text-white font-black text-xl">P</span>
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
  const [data, setData] = useState<AppData | null>(() => {
    try {
      return getAppData();
    } catch (error) {
      console.error('Failed to load app data:', error);
      return null;
    }
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!data);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { showToast } = useToast();

  // Navigation handler with optional student ID
  const handleNavigate = (view: string, studentId?: number) => {
    setCurrentView(view);
    if (studentId !== undefined) {
      setSelectedStudentId(studentId);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts help with Shift + ? (or just ?)
      if (e.key === '?' && e.shiftKey) {
        setShowShortcuts(prev => !prev);
      }

      // Close shortcuts on Esc
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }

      // Alt + Number navigation
      if (e.altKey) {
        switch (e.key) {
          case '1': handleNavigate('dashboard'); break;
          case '2': handleNavigate('analytics'); break;
          case '3': handleNavigate('schedule'); break;
          case '4': handleNavigate('students-manage'); break;
          case '5': handleNavigate('student-analytics'); break;
          case '6': handleNavigate('attendance'); break;
          case '7': handleNavigate('assessment'); break;
          case '8': handleNavigate('resources'); break;
          case '9': handleNavigate('settings'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect to handle load error toast if needed, since we can't use hook in initializer
  useEffect(() => {
    if (!data && !isLoading) {
      showToast('Failed to load data. Using defaults.', 'error');
    }
  }, []);

  // Save handler wrapper
  const saveData = (newData: AppData, showNotification = false) => {
    try {
      setData(newData);
      saveAppData(newData);
      if (showNotification) {
        showToast('Changes saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      showToast('Failed to save changes', 'error');
    }
  };

  const handleUpdateStudent = (updatedStudent: Student, notify = false) => {
    if (!data) return;
    const newData = {
      ...data,
      students: data.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    };
    saveData(newData, notify);
  };

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    if (!data) return;
    const newData = addStudent(data, studentData);
    saveData(newData);
    showToast(`${studentData.name} added successfully!`, 'success');
  };

  const handleDeleteStudent = (studentId: number) => {
    if (!data) return;
    const student = data.students.find(s => s.id === studentId);
    const newData = deleteStudent(data, studentId);
    saveData(newData);
    if (student) {
      showToast(`${student.name} has been removed`, 'info');
    }
  };

  const handleUpdateSchedule = (slotId: string, status: ScheduleSlot['status']) => {
    if (!data) return;
    const newData = {
      ...data,
      schedule: data.schedule.map(s => s.id === slotId ? { ...s, status } : s)
    };
    saveData(newData);
    showToast(`Schedule updated`, 'success');
  };

  const handleAddScheduleSlot = (slotData: Omit<ScheduleSlot, 'id'>) => {
    if (!data) return;
    const newData = addScheduleSlot(data, slotData);
    saveData(newData);
    showToast('New class added to schedule', 'success');
  };

  const handleDeleteScheduleSlot = (slotId: string) => {
    if (!data) return;
    const newData = deleteScheduleSlot(data, slotId);
    saveData(newData);
    showToast('Class removed from schedule', 'info');
  };

  const handleAddResource = (resourceData: Omit<Resource, 'id'>) => {
    if (!data) return;
    const newData = addResource(data, resourceData);
    saveData(newData);
    showToast('Resource added successfully', 'success');
  };

  const handleDeleteResource = (resourceId: string) => {
    if (!data) return;
    const newData = deleteResource(data, resourceId);
    saveData(newData);
    showToast('Resource removed', 'info');
  };

  const handleUpdateResource = (updatedResource: Resource) => {
    if (!data) return;
    const newData = {
      ...data,
      resources: data.resources.map(r =>
        r.id === updatedResource.id ? updatedResource : r
      )
    };
    saveData(newData);
    showToast('Resource updated successfully', 'success');
  };

  const handleDataReset = () => {
    const freshData = getAppData();
    setData(freshData);
  };

  if (!data) {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ backgroundColor: 'var(--md-sys-color-background)' }}>
        <p style={{ color: 'var(--md-sys-color-secondary)' }}>No data found. Please reset application.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans relative" style={{ color: 'var(--md-sys-color-on-surface)', backgroundColor: 'var(--md-sys-color-background)' }}>
      {/* Dynamic background animations */}
      <BackgroundLayout currentView={currentView} />

      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-auto relative z-10 p-4 lg:p-6 scroll-smooth custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {/* View Router */}
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
                    onDeleteSlot={handleDeleteScheduleSlot}
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
                  />
                )}

                {currentView === 'settings' && (
                  <Settings
                    key="settings"
                    onDataReset={handleDataReset}
                  />
                )}
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Keyboard Shortcuts Help */}
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';

// Use environment variable for Client ID
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLocked, isLoading } = useAuth();

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
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
              >
                <LoginPage />
              </motion.div>
            )}
          </AnimatePresence>
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
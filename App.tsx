import React, { useState, useEffect, Suspense, lazy } from 'react';
import { getAppData, saveAppData, addStudent, deleteStudent, addScheduleSlot, deleteScheduleSlot } from './services/storageService';
import { AppData, Student, ScheduleSlot } from './types';
import { ToastProvider, useToast } from './components/Toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

// Lazy load components for code splitting
const Schedule = lazy(() => import('./components/Schedule'));
const StudentProfile = lazy(() => import('./components/StudentProfile'));
const Students = lazy(() => import('./components/Students'));
const StudentAnalytics = lazy(() => import('./components/StudentAnalytics'));
const Assessment = lazy(() => import('./components/Assessment'));
const Settings = lazy(() => import('./components/Settings'));
const Analytics = lazy(() => import('./components/Analytics'));
const Attendance = lazy(() => import('./components/Attendance'));

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
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
  const { showToast } = useToast();

  // Navigation handler with optional student ID
  const handleNavigate = (view: string, studentId?: number) => {
    setCurrentView(view);
    if (studentId !== undefined) {
      setSelectedStudentId(studentId);
    }
  };

  // Initial Load
  useEffect(() => {
    const loadData = () => {
      try {
        const loadedData = getAppData();
        setData(loadedData);
      } catch (error) {
        console.error('Failed to load app data:', error);
        showToast('Failed to load data. Using defaults.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
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

  const handleDataReset = () => {
    const freshData = getAppData();
    setData(freshData);
  };

  if (isLoading || !data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-6">
            <span className="text-white font-black text-3xl">P</span>
          </div>
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-google font-bold tracking-widest uppercase text-sm text-gray-600">Loading PRISM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 bg-[#f8f9fa] font-sans">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 overflow-auto relative p-4 lg:p-6 scroll-smooth custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {/* View Router */}
              {currentView === 'dashboard' && <Dashboard data={data} onNavigate={handleNavigate} />}

              {currentView === 'analytics' && <Analytics data={data} onNavigate={handleNavigate} />}

              {currentView === 'schedule' && (
                <Schedule
                  data={data}
                  onUpdateSchedule={handleUpdateSchedule}
                  onUpdateStudent={handleUpdateStudent}
                  onAddSlot={handleAddScheduleSlot}
                  onDeleteSlot={handleDeleteScheduleSlot}
                />
              )}

              {currentView === 'students' && (
                <StudentProfile
                  data={data}
                  onUpdateStudent={handleUpdateStudent}
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              )}

              {currentView === 'students-manage' && (
                <Students
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
                  data={data}
                  studentId={selectedStudentId}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'student-analytics' && !selectedStudentId && (
                <Students
                  data={data}
                  onUpdateStudent={handleUpdateStudent}
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onNavigate={handleNavigate}
                />
              )}

              {currentView === 'assessment' && (
                <Assessment
                  data={data}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}

              {currentView === 'attendance' && (
                <Attendance
                  data={data}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}

              {currentView === 'settings' && (
                <Settings
                  onDataReset={handleDataReset}
                />
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ToastProvider>
  );
}
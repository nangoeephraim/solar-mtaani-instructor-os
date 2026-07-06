import React, { useState, useMemo } from 'react';
import { AppData, Resource, ResourceUsageLog, ScheduleSlot, LibraryResource } from '../types';
import PageHeader from './PageHeader';
import { createPortal } from 'react-dom';
import { 
    Box, Trash2, Plus, Monitor, Layout, MapPin, Users, CheckCircle, 
    AlertCircle, Wrench, Filter, X, Edit3, Calendar, History, 
    FileText, Clock, Search, ChevronRight, Link2, BookOpen, 
    TrendingUp, Award, Activity, ShieldAlert, CheckCircle2, ChevronDown 
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getLevelShortLabel } from '../constants/educationLevels';
import LibraryTab from './LibraryTab';
import { getSubjectPill } from '../utils/subjectUtils';
import { calculateResourceUtilization, timeToMinutes, doTimesOverlap } from '../utils/scheduling';

interface ResourcesProps {
    data: AppData;
    onAddResource: (resource: Omit<Resource, 'id'>) => void;
    onDeleteResource: (id: string) => void;
    onUpdateResource: (resource: Resource) => void;
    onAddLibraryResource: (resourceData: Omit<LibraryResource, 'id'>, fileData?: string) => void;
    onDeleteLibraryResource: (resourceId: string) => void;
    onUpdateLibraryResource: (updatedResource: LibraryResource, fileData?: string) => void;
    onUpdateScheduleSlot?: (slot: ScheduleSlot) => void; // Added for resource allocation
}

const RESOURCE_TYPES = [
    { value: 'room', label: 'Room / Hall', icon: Layout, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { value: 'equipment', label: 'Equipment', icon: Monitor, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { value: 'other', label: 'Other', icon: Box, color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20' },
];

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available', icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
    { value: 'in-use', label: 'In Use', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
];

type DrawerTab = 'edit' | 'schedule' | 'history';
type MainTab = 'physical' | 'library';

// Utilization Ring Visual Component
const UtilizationRing = ({ percentage }: { percentage: number }) => {
    const strokeDashoffset = 100 - percentage;
    const strokeColor = percentage > 80 ? 'stroke-red-500' : percentage > 50 ? 'stroke-amber-500' : 'stroke-indigo-500';
    return (
        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0" title={`Utilization: ${percentage}% of standard 40hr week`}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                    className={clsx("transition-all duration-700 ease-out", strokeColor)}
                    strokeWidth="3.5"
                    strokeDasharray="100, 100"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                />
            </svg>
            <span className="absolute text-[10px] font-black text-[var(--md-sys-color-on-surface)]">{percentage}%</span>
        </div>
    );
};

export default function Resources({
    data,
    onAddResource,
    onDeleteResource,
    onUpdateResource,
    onAddLibraryResource,
    onDeleteLibraryResource,
    onUpdateLibraryResource,
    onUpdateScheduleSlot
}: ResourcesProps) {
    const { user } = useAuth();
    const { preferences } = useTheme();
    const [mainTab, setMainTab] = useState<MainTab>('physical');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>('edit');
    const [editForm, setEditForm] = useState<Partial<Resource>>({});
    const [newResource, setNewResource] = useState<Partial<Resource>>({
        name: '',
        type: 'room',
        capacity: undefined,
        location: '',
        status: 'available',
        notes: ''
    });

    const { showToast } = useToast();

    // Generate unique ID
    const generateId = () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create usage log entry
    const createLogEntry = (action: ResourceUsageLog['action'], note?: string, slotId?: string): ResourceUsageLog => ({
        id: generateId(),
        date: new Date().toISOString(),
        action,
        note,
        slotId
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newResource.name) return;

        const initialLog = createLogEntry('created', `Resource "${newResource.name}" was created`);

        onAddResource({
            name: newResource.name,
            type: newResource.type as any || 'room',
            capacity: newResource.capacity,
            location: newResource.location,
            status: newResource.status as any || 'available',
            notes: newResource.notes,
            usageHistory: [initialLog]
        });

        setNewResource({ name: '', type: 'room', capacity: undefined, location: '', status: 'available', notes: '' });
        setShowAddModal(false);
    };

    const handleOpenDrawer = (resource: Resource) => {
        setSelectedResource(resource);
        setEditForm({ ...resource });
        setDrawerTab('edit');
    };

    const handleCloseDrawer = () => {
        setSelectedResource(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        if (!selectedResource || !editForm.name) return;

        const hasChanges = JSON.stringify(selectedResource) !== JSON.stringify(editForm);
        if (!hasChanges) {
            handleCloseDrawer();
            return;
        }

        // Detect modifications for audit log
        const changedFields: string[] = [];
        if (selectedResource.name !== editForm.name) changedFields.push('name');
        if (selectedResource.type !== editForm.type) changedFields.push('type');
        if (selectedResource.status !== editForm.status) changedFields.push('status');
        if (selectedResource.capacity !== editForm.capacity) changedFields.push('capacity');
        if (selectedResource.location !== editForm.location) changedFields.push('location');
        if (selectedResource.notes !== editForm.notes) changedFields.push('notes');

        const editLog = createLogEntry('updated', `Modified details: ${changedFields.join(', ')}`);

        const updatedResource: Resource = {
            id: selectedResource.id,
            name: editForm.name,
            type: editForm.type as any || 'room',
            status: editForm.status as any || 'available',
            capacity: editForm.capacity,
            location: editForm.location,
            notes: editForm.notes,
            usageHistory: [...(selectedResource.usageHistory || []), editLog]
        };

        onUpdateResource(updatedResource);
        setSelectedResource(updatedResource);
        handleCloseDrawer();
        showToast('Resource updated successfully', 'success');
    };

    const handleQuickStatusChange = (resource: Resource, newStatus: Resource['status']) => {
        if (!newStatus || resource.status === newStatus) return;

        let statusLog: ResourceUsageLog;
        if (newStatus === 'in-use') {
            statusLog = createLogEntry('assigned', 'Marked as in use');
        } else if (newStatus === 'maintenance') {
            statusLog = createLogEntry('maintenance-start', 'Marked for maintenance');
        } else if (resource.status === 'maintenance') {
            statusLog = createLogEntry('maintenance-end', 'Maintenance completed');
        } else {
            statusLog = createLogEntry('updated', `Status changed to ${newStatus}`);
        }

        const updatedResource: Resource = {
            ...resource,
            status: newStatus,
            usageHistory: [...(resource.usageHistory || []), statusLog]
        };

        onUpdateResource(updatedResource);
        showToast(`Status updated to ${newStatus}`, 'success');
    };

    const IconMap: Record<string, any> = {
        'room': Layout,
        'equipment': Monitor,
        'other': Box
    };

    const StatusIcon: Record<string, any> = {
        'available': CheckCircle,
        'in-use': AlertCircle,
        'maintenance': Wrench
    };

    // Filter resources
    const filteredResources = useMemo(() => {
        return (data.resources || []).filter(resource => {
            if (filterType !== 'all' && resource.type !== filterType) return false;
            if (filterStatus !== 'all' && resource.status !== filterStatus) return false;
            if (searchQuery && !resource.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [data.resources, filterType, filterStatus, searchQuery]);

    // Get schedule slots that use a specific resource
    const getResourceScheduleSlots = (resourceId: string): ScheduleSlot[] => {
        return (data.schedule || []).filter(slot => slot.resourceIds?.includes(resourceId));
    };

    // Stats
    const totalResources = data.resources?.length || 0;
    const availableCount = data.resources?.filter(r => r.status === 'available' || !r.status).length || 0;
    const inUseCount = data.resources?.filter(r => r.status === 'in-use').length || 0;
    const maintenanceCount = data.resources?.filter(r => r.status === 'maintenance').length || 0;

    // Day name helper
    const getDayName = (dayOfWeek: number) => {
        const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayOfWeek] || 'Unknown';
    };

    // Format date helper
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Action label helper
    const getActionLabel = (action: ResourceUsageLog['action']) => {
        const labels: Record<string, { text: string; color: string }> = {
            'created': { text: 'Created', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' },
            'updated': { text: 'Updated', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800' },
            'assigned': { text: 'Assigned', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' },
            'released': { text: 'Released', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800' },
            'maintenance-start': { text: 'Maintenance Start', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800' },
            'maintenance-end': { text: 'Maintenance End', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' }
        };
        return labels[action] || { text: action, color: 'text-gray-600 bg-gray-50' };
    };

    // Smart Scheduling Recommendation Flow
    const slotAllocations = useMemo(() => {
        if (!selectedResource) return [];

        return (data.schedule || [])
            .filter(slot => slot.status !== 'Cancelled')
            .map(slot => {
                const isAssigned = slot.resourceIds?.includes(selectedResource.id) || false;
                
                // Overlap Check on the same Day
                const slotStart = timeToMinutes(slot.startTime);
                const sameDayResourceBookings = (data.schedule || []).filter(s => 
                    s.id !== slot.id && 
                    s.status !== 'Cancelled' && 
                    s.dayOfWeek === slot.dayOfWeek && 
                    s.resourceIds?.includes(selectedResource.id)
                );

                let hasConflict = false;
                let conflictingSlot: ScheduleSlot | undefined;
                
                for (const booking of sameDayResourceBookings) {
                    const bStart = timeToMinutes(booking.startTime);
                    if (doTimesOverlap(slotStart, slot.durationMinutes || 60, bStart, booking.durationMinutes || 60)) {
                        hasConflict = true;
                        conflictingSlot = booking;
                        break;
                    }
                }

                // Capacity check
                const studentCount = data.students?.filter(s => s.grade === slot.grade && s.subject === slot.subject).length || 0;
                let isCapacityWarning = false;
                let capacityGap = 0;
                
                if (selectedResource.capacity) {
                    capacityGap = selectedResource.capacity - studentCount;
                    if (selectedResource.capacity < studentCount) {
                        isCapacityWarning = true;
                    }
                }

                // Calculate Algorithm matching score
                let score = 100;
                if (hasConflict || selectedResource.status === 'maintenance') {
                    score = 0;
                } else {
                    if (isCapacityWarning) {
                        score -= 50; // Heavy penalty for size limit violation
                    } else if (selectedResource.capacity) {
                        // Small penalty for excessive space waste
                        const waste = selectedResource.capacity - studentCount;
                        score -= Math.min(Math.round((waste / selectedResource.capacity) * 30), 30);
                    }
                }

                return {
                    slot,
                    isAssigned,
                    hasConflict,
                    conflictingSlot,
                    studentCount,
                    isCapacityWarning,
                    capacityGap,
                    fitScore: score
                };
            })
            .sort((a, b) => {
                if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
                return b.fitScore - a.fitScore;
            });
    }, [selectedResource, data.schedule, data.students]);

    // Handle Assigning/Unassigning
    const handleAssignResource = (slot: ScheduleSlot) => {
        if (!selectedResource || !onUpdateScheduleSlot) return;
        const currentIds = slot.resourceIds || [];
        if (currentIds.includes(selectedResource.id)) return;

        const updatedIds = [...currentIds, selectedResource.id];
        
        // Add log entry to the resource
        const assignLog = createLogEntry('assigned', `Allocated to slot "${slot.subject} (Grade ${slot.grade})"`, slot.id);
        const updatedResource: Resource = {
            ...selectedResource,
            status: 'in-use',
            usageHistory: [...(selectedResource.usageHistory || []), assignLog]
        };

        onUpdateScheduleSlot({
            ...slot,
            resourceIds: updatedIds
        });
        onUpdateResource(updatedResource);
        setSelectedResource(updatedResource);
        showToast(`Resource assigned to ${slot.subject}`, 'success');
    };

    const handleUnassignResource = (slot: ScheduleSlot) => {
        if (!selectedResource || !onUpdateScheduleSlot) return;
        const updatedIds = (slot.resourceIds || []).filter(id => id !== selectedResource.id);
        
        const releaseLog = createLogEntry('released', `Released from slot "${slot.subject} (Grade ${slot.grade})"`, slot.id);
        
        // Check if resource is used elsewhere to determine if status should reset to available
        const remainingBookings = data.schedule?.filter(s => s.id !== slot.id && s.resourceIds?.includes(selectedResource.id) && s.status !== 'Cancelled') || [];
        const nextStatus = remainingBookings.length > 0 ? 'in-use' : 'available';

        const updatedResource: Resource = {
            ...selectedResource,
            status: nextStatus,
            usageHistory: [...(selectedResource.usageHistory || []), releaseLog]
        };

        onUpdateScheduleSlot({
            ...slot,
            resourceIds: updatedIds
        });
        onUpdateResource(updatedResource);
        setSelectedResource(updatedResource);
        showToast(`Resource unassigned from ${slot.subject}`, 'info');
    };

    // Calculate overall stats for headers
    const topStats = useMemo(() => {
        if (!data.resources?.length) return { mostActive: 'None', utilizationAvg: 0 };
        let totalPct = 0;
        let maxHrs = -1;
        let activeName = 'None';

        data.resources.forEach(r => {
            const { hoursBooked, percentage } = calculateResourceUtilization(r.id, data.schedule || []);
            totalPct += percentage;
            if (hoursBooked > maxHrs && hoursBooked > 0) {
                maxHrs = hoursBooked;
                activeName = r.name;
            }
        });

        return {
            mostActive: activeName,
            utilizationAvg: Math.round(totalPct / data.resources.length)
        };
    }, [data.resources, data.schedule]);

    return (
        <div className="flex flex-col h-full bg-[var(--md-sys-color-background)]">
            {/* Header */}
            <div className="flex-shrink-0 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline)] p-6 z-20 pb-0">
                <PageHeader
                    title="Resources & Library"
                    subtitle="Manage physical assets and digital learning materials"
                    icon={Box}
                    color="text-amber-500"
                    action={
                        user?.role !== 'viewer' && mainTab === 'physical' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md font-bold flex items-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <Plus size={18} /> Add Resource
                            </button>
                        )
                    }
                />

                {/* Micro Tabs */}
                <div className="flex mt-6 gap-6">
                    <button
                        onClick={() => setMainTab('physical')}
                        className={clsx(
                            "pb-4 font-bold text-sm transition-colors border-b-2",
                            mainTab === 'physical'
                                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                : "border-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Box size={16} /> Physical Assets
                        </div>
                    </button>
                    <button
                        onClick={() => setMainTab('library')}
                        className={clsx(
                            "pb-4 font-bold text-sm transition-colors border-b-2",
                            mainTab === 'library'
                                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                                : "border-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} /> Digital Library
                        </div>
                    </button>
                </div>
            </div>

            {mainTab === 'physical' ? (
                <>
                    {/* Analytics Summary Widgets */}
                    <div className="flex-shrink-0 p-6 pb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)]">
                        {/* total */}
                        <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-2xl border border-[var(--md-sys-color-outline)] flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
                                <Box size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Total Assets</p>
                                <h3 className="text-xl font-black mt-0.5">{totalResources}</h3>
                            </div>
                        </div>
                        {/* utilization */}
                        <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-2xl border border-[var(--md-sys-color-outline)] flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Avg Utilization</p>
                                <h3 className="text-xl font-black mt-0.5">{topStats.utilizationAvg}%</h3>
                            </div>
                        </div>
                        {/* active */}
                        <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-2xl border border-[var(--md-sys-color-outline)] flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-xl">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Most Active</p>
                                <h3 className="text-sm font-black mt-1.5 truncate max-w-[140px]" title={topStats.mostActive}>{topStats.mostActive}</h3>
                            </div>
                        </div>
                        {/* maintenance */}
                        <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-2xl border border-[var(--md-sys-color-outline)] flex items-center gap-4 shadow-sm">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Maintenance</p>
                                <h3 className="text-xl font-black mt-0.5">{maintenanceCount} active</h3>
                            </div>
                        </div>
                    </div>

                    {/* Filter row */}
                    <div className="flex-shrink-0 p-4 bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)] flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/25 rounded-full border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-[10px] font-bold">{availableCount} Free</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/25 rounded-full border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                <span className="text-[10px] font-bold">{inUseCount} Busy</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-48 focus:w-64 transition-all outline-none input-glow shadow-sm"
                                />
                            </div>

                            <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden">
                                <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                                    <Filter size={14} />
                                </div>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="px-2 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                                >
                                    <option value="all">All Types</option>
                                    <option value="room">Rooms</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="flex items-center bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg shadow-sm overflow-hidden">
                                <div className="pl-3 py-2 border-r border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)]">
                                    <Activity size={14} />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-2 py-2 text-sm bg-transparent border-none text-[var(--md-sys-color-on-surface)] font-medium outline-none cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="available">Available</option>
                                    <option value="in-use">In Use</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Content List of Resources */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredResources.map((resource, idx) => {
                                    const Icon = IconMap[resource.type] || Box;
                                    const StatusIconComponent = StatusIcon[resource.status || 'available'] || CheckCircle;
                                    const statusColor = resource.status === 'in-use' ? 'text-blue-600' :
                                        resource.status === 'maintenance' ? 'text-orange-600' : 'text-green-600';
                                    const assignedSlots = getResourceScheduleSlots(resource.id);
                                    
                                    // Calculate Utilization for Ring
                                    const { percentage } = calculateResourceUtilization(resource.id, data.schedule || []);

                                    return (
                                        <motion.div
                                            key={resource.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: idx * 0.02 }}
                                            onClick={() => handleOpenDrawer(resource)}
                                            className="glass-card p-5 shadow-elevation-1 hover:shadow-elevation-3 hover:border-amber-400 transition-all border border-[var(--md-sys-color-outline)] group cursor-pointer flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={clsx("p-3 rounded-xl border",
                                                            resource.type === 'room' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800" :
                                                                resource.type === 'equipment' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800" :
                                                                    "bg-gray-150 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                                        )}>
                                                            <Icon size={22} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-[var(--md-sys-color-on-surface)] text-sm md:text-base leading-tight group-hover:text-amber-500 transition-colors">{resource.name}</h3>
                                                            <span className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase tracking-wider font-extrabold">{resource.type}</span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Admin Actions */}
                                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                        {user?.role !== 'viewer' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenDrawer(resource)}
                                                                    className="p-1.5 text-[var(--md-sys-color-secondary)] hover:text-amber-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    title="Edit Resource"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm(`Delete resource "${resource.name}"?`)) onDeleteResource(resource.id);
                                                                    }}
                                                                    className="p-1.5 text-[var(--md-sys-color-secondary)] hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    title="Delete Resource"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {resource.notes && (
                                                    <p className="text-[11px] text-[var(--md-sys-color-secondary)] mb-4 line-clamp-2 italic font-google">
                                                        "{resource.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Details section */}
                                            <div className="space-y-2 border-t border-[var(--md-sys-color-outline)] pt-3 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1.5">
                                                        {/* Location */}
                                                        {resource.location && (
                                                            <div className="flex items-center gap-1.5 text-[var(--md-sys-color-secondary)] text-[11px]">
                                                                <MapPin size={12} />
                                                                <span>{resource.location}</span>
                                                            </div>
                                                        )}
                                                        {/* Capacity */}
                                                        {resource.capacity && (
                                                            <div className="flex items-center gap-1.5 text-[var(--md-sys-color-secondary)] text-[11px]">
                                                                <Users size={12} />
                                                                <span>Max Capacity: {resource.capacity}</span>
                                                            </div>
                                                        )}
                                                        {/* Slots count */}
                                                        {assignedSlots.length > 0 && (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-violet-100 dark:bg-violet-900/35 text-violet-700 dark:text-violet-400 rounded-full w-fit">
                                                                <Link2 size={10} />
                                                                <span>{assignedSlots.length} slot{assignedSlots.length > 1 ? 's' : ''}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Weekly Utilization ring badge */}
                                                    <UtilizationRing percentage={percentage} />
                                                </div>

                                                {/* Status with Quick Toggle controls */}
                                                <div className="flex items-center justify-between pt-2 border-t border-dotted border-[var(--md-sys-color-outline)]">
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusIconComponent size={12} className={statusColor} />
                                                        <span className={clsx("text-xs font-bold capitalize", statusColor)}>
                                                            {resource.status || 'Available'}
                                                        </span>
                                                    </div>

                                                    {user?.role !== 'viewer' && (
                                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                            {STATUS_OPTIONS.map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    onClick={() => handleQuickStatusChange(resource, opt.value as Resource['status'])}
                                                                    className={clsx(
                                                                        "p-1 rounded text-[10px] transition-colors border",
                                                                        resource.status === opt.value
                                                                            ? opt.color
                                                                            : "text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                    )}
                                                                    title={opt.label}
                                                                >
                                                                    <opt.icon size={10} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {filteredResources.length === 0 && (
                                <div className="col-span-full py-16 text-center text-[var(--md-sys-color-on-surface-variant)] flex flex-col items-center">
                                    <Box size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">No assets match the search/filters</p>
                                    <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1">Try resetting the type or status dropdowns.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PHYSICAL DETAILS DRAWER */}
                    <AnimatePresence>
                        {selectedResource && typeof document !== 'undefined' && createPortal(
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black z-45"
                                    onClick={handleCloseDrawer}
                                />

                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed top-0 right-0 h-full w-full max-w-lg bg-[var(--md-sys-color-surface)] shadow-2xl z-50 overflow-hidden flex flex-col border-l border-[var(--md-sys-color-outline)]"
                                >
                                    {/* Header */}
                                    <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                        <div>
                                            <h2 className="text-xl font-black">{selectedResource.name}</h2>
                                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mt-0.5">Asset · {selectedResource.type}</p>
                                        </div>
                                        <button
                                            onClick={handleCloseDrawer}
                                            className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                                            aria-label="Close details"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]">
                                        {[
                                            { id: 'edit' as DrawerTab, label: user?.role === 'viewer' ? 'Details' : 'Edit info', icon: Edit3 },
                                            { id: 'schedule' as DrawerTab, label: 'Timeline & Booking', icon: Calendar },
                                            { id: 'history' as DrawerTab, label: 'Audit History', icon: History }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setDrawerTab(tab.id)}
                                                className={clsx(
                                                    "flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors relative",
                                                    drawerTab === tab.id
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                                                )}
                                            >
                                                <tab.icon size={14} />
                                                {tab.label}
                                                {drawerTab === tab.id && (
                                                    <motion.div
                                                        layoutId="activeDrawerTab"
                                                        className="absolute bottom-0 left-4 right-4 h-[2px] bg-amber-500"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 overflow-auto p-6 space-y-6">
                                        {/* EDIT TAB */}
                                        {drawerTab === 'edit' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1">Resource Name</label>
                                                    <input
                                                        type="text"
                                                        disabled={user?.role === 'viewer'}
                                                        className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-amber-500 text-sm font-bold disabled:opacity-50"
                                                        value={editForm.name || ''}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1.5">Asset Type</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {RESOURCE_TYPES.map(type => (
                                                            <button
                                                                key={type.value}
                                                                type="button"
                                                                disabled={user?.role === 'viewer'}
                                                                onClick={() => setEditForm({ ...editForm, type: type.value as any })}
                                                                className={clsx(
                                                                    "p-2 border rounded-xl flex flex-col items-center gap-1 transition-all text-xs font-bold",
                                                                    editForm.type === type.value
                                                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                                                        : "border-[var(--md-sys-color-outline)] hover:border-slate-400 text-slate-500",
                                                                    user?.role === 'viewer' && "opacity-50"
                                                                )}
                                                            >
                                                                <type.icon size={16} />
                                                                {type.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1">Max Capacity</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={user?.role === 'viewer'}
                                                            className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-amber-500 text-xs font-bold"
                                                            value={editForm.capacity || ''}
                                                            onChange={e => setEditForm({ ...editForm, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1">Location</label>
                                                        <input
                                                            type="text"
                                                            disabled={user?.role === 'viewer'}
                                                            className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-amber-500 text-xs font-bold"
                                                            value={editForm.location || ''}
                                                            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1.5">Asset Status</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {STATUS_OPTIONS.map(status => (
                                                            <button
                                                                key={status.value}
                                                                type="button"
                                                                disabled={user?.role === 'viewer'}
                                                                onClick={() => setEditForm({ ...editForm, status: status.value as any })}
                                                                className={clsx(
                                                                    "p-2 border rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold",
                                                                    editForm.status === status.value
                                                                        ? clsx("border-2", status.color)
                                                                        : "border-[var(--md-sys-color-outline)] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                                                                    user?.role === 'viewer' && "opacity-50"
                                                                )}
                                                            >
                                                                <status.icon size={12} />
                                                                {status.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-extrabold uppercase tracking-wide text-[var(--md-sys-color-secondary)] mb-1">Notes / Asset Notes</label>
                                                    <textarea
                                                        rows={4}
                                                        disabled={user?.role === 'viewer'}
                                                        className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl outline-none focus:border-amber-500 text-xs font-medium resize-none"
                                                        value={editForm.notes || ''}
                                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                                    />
                                                </div>

                                                {user?.role !== 'viewer' && (
                                                    <div className="pt-4">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SCHEDULE / TIMELINE TAB */}
                                        {drawerTab === 'schedule' && (
                                            <div className="space-y-5">
                                                {/* Header Stats */}
                                                <div className="bg-slate-50 dark:bg-slate-800/30 border border-[var(--md-sys-color-outline)] p-4 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Weekly Booked Hours</p>
                                                        <h4 className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-0.5">
                                                            {calculateResourceUtilization(selectedResource.id, data.schedule || []).hoursBooked} hrs / 40 hrs
                                                        </h4>
                                                    </div>
                                                    <UtilizationRing percentage={calculateResourceUtilization(selectedResource.id, data.schedule || []).percentage} />
                                                </div>

                                                {/* Actions block */}
                                                {user?.role !== 'viewer' && onUpdateScheduleSlot && (
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-black uppercase text-[var(--md-sys-color-secondary)] tracking-wide">Timetable Allocations</h4>
                                                        <button
                                                            onClick={() => setShowAssignModal(true)}
                                                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                                                        >
                                                            <Plus size={12} /> Assign to Class Slot
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Day-by-Day bookings view */}
                                                <div className="space-y-4">
                                                    {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
                                                        const daySlots = slotAllocations.filter(sa => sa.slot.dayOfWeek === dayIndex && sa.isAssigned);
                                                        
                                                        return (
                                                            <div key={dayIndex} className="border border-[var(--md-sys-color-outline)] rounded-xl overflow-hidden bg-[var(--md-sys-color-surface)] shadow-sm">
                                                                <div className="p-3 bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)] flex items-center justify-between">
                                                                    <span className="font-extrabold text-xs text-[var(--md-sys-color-on-surface)]">{getDayName(dayIndex)}</span>
                                                                    <span className="text-[10px] text-[var(--md-sys-color-secondary)] font-bold">{daySlots.length} Bookings</span>
                                                                </div>

                                                                <div className="divide-y divide-[var(--md-sys-color-outline)]">
                                                                    {daySlots.length > 0 ? (
                                                                        daySlots.map(({ slot }) => (
                                                                            <div key={slot.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={clsx("w-2 h-2 rounded-full", getSubjectPill(slot.subject || '').bg)} />
                                                                                    <div>
                                                                                        <p className="font-bold">{slot.subject} ({preferences.terminology?.classLabel || 'Level'} {getLevelShortLabel(slot.studentGroup || 'Academy', slot.grade)})</p>
                                                                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5">{slot.startTime} · {slot.durationMinutes} min</p>
                                                                                    </div>
                                                                                </div>
                                                                                {user?.role !== 'viewer' && onUpdateScheduleSlot && (
                                                                                    <button
                                                                                        onClick={() => handleUnassignResource(slot)}
                                                                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded"
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="p-3 text-[11px] text-[var(--md-sys-color-secondary)] italic text-center">No classes scheduled on this day</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* AUDIT LOG TIMELINE */}
                                        {drawerTab === 'history' && (
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase text-[var(--md-sys-color-secondary)] tracking-wide">Audit Trail</h4>
                                                
                                                {selectedResource.usageHistory && selectedResource.usageHistory.length > 0 ? (
                                                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-5 space-y-5 py-2">
                                                        {selectedResource.usageHistory.map((log) => {
                                                            const badge = getActionLabel(log.action);
                                                            return (
                                                                <div key={log.id} className="relative text-xs">
                                                                    {/* dot indicator */}
                                                                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700" />
                                                                    
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className={clsx("text-[9px] font-bold px-1.5 py-0.2 rounded border", badge.color)}>
                                                                            {badge.text}
                                                                        </span>
                                                                        <span className="text-[10px] text-[var(--md-sys-color-secondary)]">
                                                                            {formatDate(log.date)}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {log.note && (
                                                                        <p className="text-[11px] text-[var(--md-sys-color-on-surface)] mt-1 font-google leading-snug">
                                                                            {log.note}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)]">
                                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                                        <p className="font-bold">No logs recorded</p>
                                                        <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1">This asset has no usage or audit history.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>,
                            document.body
                        )}
                    </AnimatePresence>

                    {/* SMART ASSIGN MODAL */}
                    <AnimatePresence>
                        {showAssignModal && selectedResource && typeof document !== 'undefined' && createPortal(
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="glass-panel shadow-elevation-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
                                >
                                    {/* Header */}
                                    <div className="p-5 border-b border-[var(--md-sys-color-outline)] bg-indigo-600 text-white rounded-t-3xl flex justify-between items-center">
                                        <div>
                                            <h3 className="font-extrabold text-base">Assign Slot to {selectedResource.name}</h3>
                                            <p className="text-[10px] text-white/80 mt-0.5">Select a schedule slot. Recommendations based on size & availability.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAssignModal(false)}
                                            className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Slot Options List */}
                                    <div className="p-4 overflow-y-auto space-y-3 flex-1">
                                        {slotAllocations.filter(sa => !sa.isAssigned).length > 0 ? (
                                            slotAllocations
                                                .filter(sa => !sa.isAssigned)
                                                .map(({ slot, fitScore, hasConflict, conflictingSlot, studentCount, isCapacityWarning }) => {
                                                    const subjectInfo = getSubjectPill(slot.subject || '');
                                                    const isAvailable = !hasConflict && selectedResource.status !== 'maintenance';

                                                    return (
                                                        <div 
                                                            key={slot.id} 
                                                            className={clsx(
                                                                "p-3.5 border rounded-xl flex items-center justify-between gap-4 text-xs transition-colors",
                                                                hasConflict 
                                                                    ? "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10 opacity-70" 
                                                                    : isCapacityWarning 
                                                                        ? "border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5"
                                                                        : "border-[var(--md-sys-color-outline)] hover:border-indigo-400 bg-[var(--md-sys-color-surface)]"
                                                            )}
                                                        >
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className={clsx("font-extrabold text-xs px-2 py-0.5 rounded-full border", subjectInfo.bg, subjectInfo.text)}>
                                                                        {slot.subject}
                                                                    </span>
                                                                    <span className="font-bold text-[11px] text-[var(--md-sys-color-on-surface)]">
                                                                        {preferences.terminology?.classLabel || 'Level'} {getLevelShortLabel(slot.studentGroup || 'Academy', slot.grade)}
                                                                    </span>
                                                                    <span className="text-[10px] text-[var(--md-sys-color-secondary)]">
                                                                        · {studentCount} students
                                                                    </span>
                                                                </div>

                                                                <p className="text-[11px] text-[var(--md-sys-color-secondary)] font-medium">
                                                                    {getDayName(slot.dayOfWeek)} at {slot.startTime} ({slot.durationMinutes} min)
                                                                </p>

                                                                {/* Alerts / Matches detail */}
                                                                {hasConflict && conflictingSlot && (
                                                                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                                        <ShieldAlert size={12} />
                                                                        Schedule Clash: Resource already assigned to {conflictingSlot.subject} at this time.
                                                                    </p>
                                                                )}
                                                                {!hasConflict && isCapacityWarning && (
                                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                                                        <AlertCircle size={12} />
                                                                        Capacity warning: Class size ({studentCount}) exceeds asset capacity ({selectedResource.capacity}).
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Score and action */}
                                                            <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] text-[var(--md-sys-color-secondary)] font-extrabold uppercase">Match Score</span>
                                                                    <span className={clsx(
                                                                        "text-xs font-black px-1.5 py-0.5 rounded",
                                                                        fitScore > 80 ? "text-green-600 bg-green-50 dark:bg-green-950/20" :
                                                                            fitScore > 40 ? "text-amber-600 bg-amber-50 dark:bg-amber-950/20" :
                                                                                "text-red-600 bg-red-50 dark:bg-red-950/20"
                                                                    )}>
                                                                        {fitScore}%
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        handleAssignResource(slot);
                                                                        setShowAssignModal(false);
                                                                    }}
                                                                    disabled={!isAvailable}
                                                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white text-[11px] font-black rounded-lg transition-colors shadow-sm disabled:shadow-none"
                                                                >
                                                                    Assign
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <p className="py-8 text-center text-xs text-[var(--md-sys-color-secondary)] italic">All active schedule slots already have this resource assigned.</p>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>,
                            document.body
                        )}
                    </AnimatePresence>

                    {/* Add Resource Modal */}
                    <AnimatePresence>
                        {showAddModal && typeof document !== 'undefined' && createPortal(
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="glass-panel shadow-elevation-3 w-full max-w-lg overflow-hidden"
                                >
                                    <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)] rounded-t-3xl">
                                        <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Add New Resource</h3>
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="p-2 hover:bg-[var(--md-sys-color-surface)] rounded-full text-[var(--md-sys-color-on-surface-variant)]"
                                            aria-label="Close modal"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreate} className="p-6 space-y-5">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Resource Name *</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google font-bold text-sm"
                                                placeholder="e.g. Projector A, Lab 1"
                                                value={newResource.name}
                                                onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                            />
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2">Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {RESOURCE_TYPES.map(type => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setNewResource({ ...newResource, type: type.value as any })}
                                                        className={clsx(
                                                            "p-3 border rounded-xl flex flex-col items-center gap-1 transition-all text-xs font-bold",
                                                            newResource.type === type.value
                                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm"
                                                                : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
                                                        )}
                                                    >
                                                        <type.icon size={20} />
                                                        {type.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Capacity & Location Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Capacity</label>
                                                <div className="relative">
                                                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google text-xs font-bold"
                                                        placeholder="e.g. 30"
                                                        value={newResource.capacity || ''}
                                                        onChange={e => setNewResource({ ...newResource, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Location</label>
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                                                    <input
                                                        type="text"
                                                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] font-google text-xs font-bold"
                                                        placeholder="e.g. Building A"
                                                        value={newResource.location || ''}
                                                        onChange={e => setNewResource({ ...newResource, location: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2">Status</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {STATUS_OPTIONS.map(status => (
                                                    <button
                                                        key={status.value}
                                                        type="button"
                                                        onClick={() => setNewResource({ ...newResource, status: status.value as any })}
                                                        className={clsx(
                                                            "p-2.5 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium",
                                                            newResource.status === status.value
                                                                ? clsx("border-2", status.color)
                                                                : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                                        )}
                                                    >
                                                        <status.icon size={14} />
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">
                                                <FileText size={14} className="inline mr-1" />
                                                Notes / Description
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl focus:outline-none input-glow transition-all text-[var(--md-sys-color-on-surface)] resize-none font-google text-xs"
                                                placeholder="Add notes about this resource..."
                                                value={newResource.notes || ''}
                                                onChange={e => setNewResource({ ...newResource, notes: e.target.value })}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-4 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddModal(false)}
                                                className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-semibold hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!newResource.name}
                                                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                            >
                                                Create Resource
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>,
                            document.body
                        )}
                    </AnimatePresence>
                </>
            ) : (
                <LibraryTab
                    data={data}
                    onAddLibraryResource={onAddLibraryResource}
                    onDeleteLibraryResource={onDeleteLibraryResource}
                    onUpdateLibraryResource={onUpdateLibraryResource}
                />
            )}
        </div>
    );
}

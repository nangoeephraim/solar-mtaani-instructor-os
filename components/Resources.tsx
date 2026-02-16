import React, { useState, useMemo } from 'react';
import { AppData, Resource, ResourceUsageLog, ScheduleSlot } from '../types';
import PageHeader from './PageHeader';
import { Box, Trash2, Plus, Monitor, Layout, MapPin, Users, CheckCircle, AlertCircle, Wrench, Filter, X, Edit3, Calendar, History, FileText, Clock, Search, ChevronRight, Link2 } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface ResourcesProps {
    data: AppData;
    onAddResource: (resource: Omit<Resource, 'id'>) => void;
    onDeleteResource: (id: string) => void;
    onUpdateResource: (resource: Resource) => void;
}

const RESOURCE_TYPES = [
    { value: 'room', label: 'Room / Hall', icon: Layout },
    { value: 'equipment', label: 'Equipment', icon: Monitor },
    { value: 'other', label: 'Other', icon: Box },
];

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available', icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
    { value: 'in-use', label: 'In Use', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
];

type DrawerTab = 'edit' | 'schedule' | 'history';

export default function Resources({ data, onAddResource, onDeleteResource, onUpdateResource }: ResourcesProps) {
    const [showAddModal, setShowAddModal] = useState(false);
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
    const { user } = useAuth();

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
        showToast('Resource created successfully', 'success');
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

        // Create update log
        const updateLog = createLogEntry('updated', 'Resource details updated');
        const existingHistory = selectedResource.usageHistory || [];

        // Check if status changed
        let statusLog: ResourceUsageLog | null = null;
        if (editForm.status !== selectedResource.status) {
            if (editForm.status === 'maintenance') {
                statusLog = createLogEntry('maintenance-start', 'Marked for maintenance');
            } else if (selectedResource.status === 'maintenance') {
                statusLog = createLogEntry('maintenance-end', 'Maintenance completed');
            }
        }

        const updatedResource: Resource = {
            ...selectedResource,
            ...editForm,
            usageHistory: statusLog
                ? [...existingHistory, updateLog, statusLog]
                : [...existingHistory, updateLog]
        };

        onUpdateResource(updatedResource);
        handleCloseDrawer();
    };

    const handleQuickStatusChange = (resource: Resource, newStatus: Resource['status']) => {
        if (resource.status === newStatus) return;

        let statusLog: ResourceUsageLog;
        if (newStatus === 'maintenance') {
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
            'created': { text: 'Created', color: 'text-blue-600 bg-blue-50' },
            'updated': { text: 'Updated', color: 'text-purple-600 bg-purple-50' },
            'assigned': { text: 'Assigned', color: 'text-green-600 bg-green-50' },
            'released': { text: 'Released', color: 'text-gray-600 bg-gray-50' },
            'maintenance-start': { text: 'Maintenance Started', color: 'text-orange-600 bg-orange-50' },
            'maintenance-end': { text: 'Maintenance Ended', color: 'text-green-600 bg-green-50' }
        };
        return labels[action] || { text: action, color: 'text-gray-600 bg-gray-50' };
    };

    return (
        <div className="flex flex-col h-full bg-[var(--md-sys-color-background)]">
            {/* Header */}
            <div className="flex-shrink-0 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline)] p-6 z-20">
                <PageHeader
                    title="Resources"
                    subtitle="Manage classrooms, labs, and equipment"
                    icon={Box}
                    color="text-amber-500"
                    action={
                        user?.role !== 'viewer' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                <Plus size={18} /> Add Resource
                            </button>
                        )
                    }
                />
            </div>

            {/* Stats Row */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]">
                        <Box size={16} className="text-amber-500" />
                        <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{totalResources} Total</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">{availableCount} Available</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <AlertCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{inUseCount} In Use</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                        <Wrench size={16} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{maintenanceCount} Maintenance</span>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)] w-40 focus:w-56 transition-all focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <Filter size={14} className="text-[var(--md-sys-color-secondary)]" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)]"
                            aria-label="Filter by resource type"
                        >
                            <option value="all">All Types</option>
                            <option value="room">Rooms</option>
                            <option value="equipment">Equipment</option>
                            <option value="other">Other</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-[var(--md-sys-color-on-surface)]"
                            aria-label="Filter by status"
                        >
                            <option value="all">All Status</option>
                            <option value="available">Available</option>
                            <option value="in-use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredResources.map((resource, idx) => {
                            const Icon = IconMap[resource.type] || Box;
                            const StatusIconComponent = StatusIcon[resource.status || 'available'] || CheckCircle;
                            const statusColor = resource.status === 'in-use' ? 'text-blue-600' :
                                resource.status === 'maintenance' ? 'text-orange-600' : 'text-green-600';
                            const assignedSlots = getResourceScheduleSlots(resource.id);

                            return (
                                <motion.div
                                    key={resource.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleOpenDrawer(resource)}
                                    className="bg-[var(--md-sys-color-surface)] p-5 rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-lg transition-all group cursor-pointer hover:border-amber-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("p-3 rounded-xl",
                                                resource.type === 'room' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" :
                                                    resource.type === 'equipment' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" :
                                                        "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                            )}>
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">{resource.name}</h3>
                                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider font-semibold">{resource.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {user?.role !== 'viewer' && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDrawer(resource);
                                                        }}
                                                        className="p-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        aria-label="Edit resource"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Delete this resource?')) onDeleteResource(resource.id);
                                                        }}
                                                        className="p-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        aria-label="Delete resource"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes Preview */}
                                    {resource.notes && (
                                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3 line-clamp-2 italic">
                                            "{resource.notes}"
                                        </p>
                                    )}

                                    {/* Details */}
                                    <div className="space-y-2 border-t border-[var(--md-sys-color-outline)] pt-4">
                                        {/* Status with Quick Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <StatusIconComponent size={14} className={statusColor} />
                                                <span className={clsx("text-sm font-medium capitalize", statusColor)}>
                                                    {resource.status || 'Available'}
                                                </span>
                                            </div>
                                            {/* Quick Status Buttons */}
                                            {user?.role !== 'viewer' && (
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {STATUS_OPTIONS.map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickStatusChange(resource, opt.value as Resource['status']);
                                                            }}
                                                            className={clsx(
                                                                "p-1 rounded transition-colors",
                                                                resource.status === opt.value
                                                                    ? opt.color
                                                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                            )}
                                                            title={opt.label}
                                                            aria-label={`Set status to ${opt.label}`}
                                                        >
                                                            <opt.icon size={12} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Location */}
                                        {resource.location && (
                                            <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                                                <MapPin size={14} />
                                                <span className="text-sm">{resource.location}</span>
                                            </div>
                                        )}

                                        {/* Capacity */}
                                        {resource.capacity && (
                                            <div className="flex items-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
                                                <Users size={14} />
                                                <span className="text-sm">Capacity: {resource.capacity}</span>
                                            </div>
                                        )}

                                        {/* Schedule Link Badge */}
                                        {assignedSlots.length > 0 && (
                                            <div className="flex items-center gap-2 text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-lg w-fit">
                                                <Link2 size={12} />
                                                <span className="text-xs font-medium">{assignedSlots.length} class{assignedSlots.length > 1 ? 'es' : ''}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Indicator */}
                                    <div className="flex items-center justify-end mt-3 text-xs text-[var(--md-sys-color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to view details <ChevronRight size={14} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {filteredResources.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[var(--md-sys-color-on-surface-variant)] flex flex-col items-center">
                            <Box size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">No resources found</p>
                            <p className="text-sm">
                                {filterType !== 'all' || filterStatus !== 'all' || searchQuery
                                    ? 'Try adjusting your filters'
                                    : 'Add one to get started'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail/Edit Drawer */}
            <AnimatePresence>
                {selectedResource && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end"
                        onClick={handleCloseDrawer}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[var(--md-sys-color-surface)] h-full shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedResource.name}</h2>
                                    <p className="text-white/80 text-sm capitalize">{selectedResource.type}</p>
                                </div>
                                <button
                                    onClick={handleCloseDrawer}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                    aria-label="Close drawer"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-[var(--md-sys-color-outline)]">
                                {[
                                    { id: 'edit' as DrawerTab, label: user?.role === 'viewer' ? 'Details' : 'Edit', icon: Edit3 },
                                    { id: 'schedule' as DrawerTab, label: 'Schedule', icon: Calendar },
                                    { id: 'history' as DrawerTab, label: 'History', icon: History }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDrawerTab(tab.id)}
                                        className={clsx(
                                            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                                            drawerTab === tab.id
                                                ? "text-amber-600"
                                                : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                                        )}
                                        aria-label={tab.label}
                                    >
                                        <tab.icon size={16} />
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

                            {/* Tab Content */}
                            <div className="flex-1 overflow-auto p-6">
                                {/* Edit Tab */}
                                {drawerTab === 'edit' && (
                                    <div className="space-y-5">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Resource Name</label>
                                            <input
                                                type="text"
                                                disabled={user?.role === 'viewer'}
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                                                value={editForm.name || ''}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                aria-label="Resource Name"
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
                                                        disabled={user?.role === 'viewer'}
                                                        onClick={() => setEditForm({ ...editForm, type: type.value as any })}
                                                        className={clsx(
                                                            "p-3 border rounded-xl flex flex-col items-center gap-1 transition-all",
                                                            editForm.type === type.value
                                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm"
                                                                : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]",
                                                            user?.role === 'viewer' && "opacity-70 cursor-not-allowed"
                                                        )}
                                                        aria-label={`Type: ${type.label}`}
                                                    >
                                                        <type.icon size={20} />
                                                        <span className="text-xs font-medium">{type.label}</span>
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
                                                        disabled={user?.role === 'viewer'}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                                                        value={editForm.capacity || ''}
                                                        onChange={e => setEditForm({ ...editForm, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                                        aria-label="Capacity"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Location</label>
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                                                    <input
                                                        type="text"
                                                        disabled={user?.role === 'viewer'}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)] disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                                                        value={editForm.location || ''}
                                                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                                        aria-label="Location"
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
                                                        disabled={user?.role === 'viewer'}
                                                        onClick={() => setEditForm({ ...editForm, status: status.value as any })}
                                                        className={clsx(
                                                            "p-2.5 border rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-medium",
                                                            editForm.status === status.value
                                                                ? clsx("border-2", status.color)
                                                                : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]",
                                                            user?.role === 'viewer' && "opacity-70 cursor-not-allowed"
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
                                                rows={4}
                                                disabled={user?.role === 'viewer'}
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)] resize-none disabled:opacity-70 disabled:bg-gray-50 dark:disabled:bg-gray-800/50"
                                                placeholder="Add notes about this resource..."
                                                value={editForm.notes || ''}
                                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Schedule Tab */}
                                {drawerTab === 'schedule' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--md-sys-color-secondary)] mb-4">
                                            Classes that use this resource are shown below. Assign resources from the Schedule tab.
                                        </p>

                                        {getResourceScheduleSlots(selectedResource.id).length > 0 ? (
                                            <div className="space-y-3">
                                                {getResourceScheduleSlots(selectedResource.id).map(slot => (
                                                    <div
                                                        key={slot.id}
                                                        className="p-4 bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={clsx(
                                                                "p-2 rounded-lg",
                                                                slot.subject === 'Solar' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                            )}>
                                                                <Calendar size={18} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                                                                    {slot.subject} - Grade {slot.grade}
                                                                </p>
                                                                <p className="text-sm text-[var(--md-sys-color-secondary)]">
                                                                    {getDayName(slot.dayOfWeek)} at {slot.startTime} ({slot.durationMinutes}min)
                                                                </p>
                                                            </div>
                                                            <span className={clsx(
                                                                "px-2 py-1 rounded text-xs font-medium",
                                                                slot.status === 'Completed' ? "bg-green-100 text-green-700" :
                                                                    slot.status === 'Pending' ? "bg-yellow-100 text-yellow-700" :
                                                                        "bg-gray-100 text-gray-700"
                                                            )}>
                                                                {slot.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)]">
                                                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-medium">No scheduled classes</p>
                                                <p className="text-sm">This resource isn't assigned to any classes yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* History Tab */}
                                {drawerTab === 'history' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-[var(--md-sys-color-secondary)] mb-4">
                                            Usage history and activity log for this resource.
                                        </p>

                                        {(selectedResource.usageHistory || []).length > 0 ? (
                                            <div className="relative">
                                                {/* Timeline Line */}
                                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[var(--md-sys-color-outline)]" />

                                                <div className="space-y-4">
                                                    {[...(selectedResource.usageHistory || [])].reverse().map((log, idx) => {
                                                        const actionInfo = getActionLabel(log.action);
                                                        return (
                                                            <div key={log.id || idx} className="relative pl-10">
                                                                {/* Timeline Dot */}
                                                                <div className={clsx(
                                                                    "absolute left-2 top-2 w-4 h-4 rounded-full border-2 border-[var(--md-sys-color-surface)]",
                                                                    actionInfo.color.replace('text-', 'bg-').split(' ')[0]
                                                                )} />

                                                                <div className="p-3 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", actionInfo.color)}>
                                                                            {actionInfo.text}
                                                                        </span>
                                                                        <span className="text-xs text-[var(--md-sys-color-secondary)]">
                                                                            <Clock size={10} className="inline mr-1" />
                                                                            {formatDate(log.date)}
                                                                        </span>
                                                                    </div>
                                                                    {log.note && (
                                                                        <p className="text-sm text-[var(--md-sys-color-on-surface)]">{log.note}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-[var(--md-sys-color-on-surface-variant)]">
                                                <History size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="font-medium">No history yet</p>
                                                <p className="text-sm">Activity will be logged here</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions (Edit Tab Only) */}
                            {drawerTab === 'edit' && user?.role !== 'viewer' && (
                                <div className="p-4 border-t border-[var(--md-sys-color-outline)] flex gap-3">
                                    <button
                                        onClick={handleCloseDrawer}
                                        className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-semibold hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={!editForm.name}
                                        className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]">
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
                                        className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)]"
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
                                                    "p-3 border rounded-xl flex flex-col items-center gap-1 transition-all",
                                                    newResource.type === type.value
                                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm"
                                                        : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
                                                )}
                                            >
                                                <type.icon size={20} />
                                                <span className="text-xs font-medium">{type.label}</span>
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
                                                className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)]"
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
                                                className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)]"
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
                                        className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-[var(--md-sys-color-on-surface)] resize-none"
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
                                        className="flex-1 px-4 py-2.5 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-semibold hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newResource.name}
                                        className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:bg-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create Resource
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

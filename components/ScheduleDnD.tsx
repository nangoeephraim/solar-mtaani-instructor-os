import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScheduleSlot, Holiday } from '../types';
import clsx from 'clsx';

// Draggable Slot Component
export const DraggableSlot = ({
    slot,
    onSlotClick,
    children,
    className,
    style: propStyle,
    disabled
}: {
    slot: ScheduleSlot;
    hourHeight: number;
    onSlotClick: () => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: slot.id,
        data: { slot },
        disabled: disabled,
    });

    const style = {
        ...propStyle,
        ...(transform ? {
            transform: CSS.Translate.toString(transform),
            zIndex: 50,
            opacity: 0.9,
        } : undefined)
    };

    return (
        <div
            ref={setNodeRef}
            // eslint-disable-next-line react/forbid-dom-props
            style={style}
            // Accessibility labels
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${slot.subject} class for grade ${slot.grade} at ${slot.startTime}. Status: ${slot.status}`}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSlotClick();
                }
            }}
            className={clsx(
                className,
                "transition-[box-shadow,transform,filter] duration-200 outline-none hover:scale-[1.02] hover:z-30 backdrop-blur-md",
                // Focus styling for keyboard accessibility
                "focus-visible:ring-4 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                isDragging ? "z-50 shadow-2xl scale-[1.03] ring-2 ring-violet-500/50 cursor-grabbing" : "z-10 cursor-grab"
            )}
            {...attributes}
            {...listeners}
        >
            <div onPointerDown={(e) => {
                // Prevent click when dragging, but this is handled by dnd-kit usually.
            }} onClick={(e) => {
                // Ignore clicks if they originate from an interactive element inside like a toggle button
                const target = e.target as HTMLElement;
                if (target.closest('button, [role="button"]') && target !== e.currentTarget) {
                    return;
                }
                if (!isDragging) onSlotClick();
            }} className="h-full w-full">
                {children}
            </div>
        </div>
    );
};

// Droppable Day Column
export const DroppableDayColumn = ({
    date,
    dateIdx,
    children,
    hourHeight,
    holiday,
    hoursCount = 24
}: {
    date: Date;
    dateIdx: number;
    children: React.ReactNode;
    hourHeight: number;
    holiday?: Holiday;
    hoursCount?: number;
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${date.getDay()}`, // Use day of week (0-6) as ID
        data: { date, isHoliday: !!holiday },
        disabled: !!holiday // Disable dropping if holiday
    });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "border-r border-[var(--md-sys-color-outline-variant)] relative transition-colors h-full",
                isOver ? "bg-[var(--md-sys-color-primary-container)]/30 ring-2 ring-inset ring-[var(--md-sys-color-primary)]/50" : ""
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ height: hoursCount * hourHeight }} // dynamic slots count
        >
            {holiday ? (
                <div 
                    className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-[3px] p-4 text-center select-none"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(148, 163, 184, 0.04) 10px, rgba(148, 163, 184, 0.04) 20px)',
                        backgroundColor: 'rgba(241, 245, 249, 0.4)'
                    }}
                >
                    <div className="bg-[var(--md-sys-color-surface)]/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-lg flex flex-col items-center max-w-[90%] transform hover:scale-105 transition-all">
                        <span className="text-2xl mb-1 select-none animate-bounce">🎉</span>
                        <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-0.5">Public Holiday</span>
                        <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] truncate w-full" title={holiday.name}>
                            {holiday.name}
                        </span>
                    </div>
                </div>
            ) : children}
        </div>
    );
};

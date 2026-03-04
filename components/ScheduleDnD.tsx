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
                "transition-[box-shadow,transform,filter] outline-none",
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
    holiday
}: {
    date: Date;
    dateIdx: number;
    children: React.ReactNode;
    hourHeight: number;
    holiday?: Holiday;
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
            style={{ height: 24 * hourHeight }} // 24 slots (00:00 - 23:00)
        >
            {holiday ? (
                <div className="absolute inset-0 bg-[var(--md-sys-color-surface-variant)]/80 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                    <span className="text-3xl mb-3 drop-shadow-sm">🎉</span>
                    <span className="font-bold text-[var(--md-sys-color-on-surface-variant)] transform -rotate-12 uppercase border-2 border-[var(--md-sys-color-on-surface-variant)] p-2.5 rounded-xl opacity-80 shadow-sm text-sm tracking-wider">
                        {holiday.name}
                    </span>
                </div>
            ) : children}
        </div>
    );
};

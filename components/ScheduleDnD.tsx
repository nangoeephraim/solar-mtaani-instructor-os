import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScheduleSlot, Holiday } from '../types';
import clsx from 'clsx';

// Draggable Slot Component
export const DraggableSlot = ({
    slot,
    // hourHeight, // Not used directly in wrapper but passed for logic? No, just children wrapper.
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
            opacity: 0.8,
        } : undefined)
    };

    return (
        <div
            ref={setNodeRef}
            // eslint-disable-next-line react/forbid-dom-props
            style={style}
            className={clsx(className, isDragging ? "z-50 shadow-2xl scale-105" : "z-10")}
            {...attributes}
            {...listeners}
        >
            <div onPointerDown={(e) => {
                // Prevent click when dragging, but this is handled by dnd-kit usually.
                // We want click to open modal.
                // dnd-kit distinguishes drag vs click via sensors activation constraints.
            }} onClick={() => {
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
                "border-r border-gray-100 relative transition-colors h-full",
                isOver ? "bg-blue-50/50 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-400" : ""
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={{ height: 9 * hourHeight }} // 9 slots (08:00 - 17:00)
        >
            {holiday ? (
                <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <span className="text-3xl mb-2">🎉</span>
                    <span className="font-bold text-gray-500 transform -rotate-12 uppercase border-2 border-gray-400 p-2 rounded-lg opacity-70">
                        {holiday.name}
                    </span>
                </div>
            ) : children}
        </div>
    );
};

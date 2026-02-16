import React, { CSSProperties, useCallback, useRef, useState, useEffect } from 'react';

export interface VirtualListProps<T> {
    /** Array of items to render */
    items: T[];
    /** Height of each item in pixels */
    itemHeight: number;
    /** Total height of the list container in pixels */
    height: number;
    /** Width of the list container (number in pixels or CSS string) */
    width?: number | string;
    /** Render function for each item */
    renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
    /** Unique key extractor for each item */
    keyExtractor: (item: T, index: number) => string | number;
    /** Optional class name for the container */
    className?: string;
    /** Number of items to overscan (render ahead) */
    overscanCount?: number;
    /** Optional empty state component */
    emptyState?: React.ReactNode;
    /** Optional loading state */
    isLoading?: boolean;
    /** Optional loading component */
    loadingComponent?: React.ReactNode;
}

/**
 * VirtualList - High-performance list component for large datasets
 * Renders only visible items in the viewport for better performance
 * Uses windowing technique to minimize DOM nodes
 * 
 * @example
 * <VirtualList
 *   items={students}
 *   itemHeight={80}
 *   height={600}
 *   keyExtractor={(student) => student.id}
 *   renderItem={(student, index, style) => (
 *     <div style={style}>
 *       <StudentCard student={student} />
 *     </div>
 *   )}
 * />
 */
export function VirtualList<T>({
    items,
    itemHeight,
    height,
    width = '100%',
    renderItem,
    keyExtractor,
    className = '',
    overscanCount = 5,
    emptyState,
    isLoading = false,
    loadingComponent,
}: VirtualListProps<T>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // Calculate container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Calculate visible range
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const visibleCount = Math.ceil(height / itemHeight) + 2 * overscanCount;
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

    // Loading state
    if (isLoading && loadingComponent) {
        return <div className={className}>{loadingComponent}</div>;
    }

    // Empty state
    if (items.length === 0 && emptyState) {
        return <div className={className}>{emptyState}</div>;
    }

    // Build visible items
    const visibleItems: React.ReactNode[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
        const item = items[i];
        const style: CSSProperties = {
            position: 'absolute',
            top: i * itemHeight,
            height: itemHeight,
            width: '100%',
        };
        visibleItems.push(
            <div key={keyExtractor(item, i)} style={style}>
                {renderItem(item, i, style)}
            </div>
        );
    }

    const resolvedWidth = typeof width === 'number' ? `${width}px` : width;

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                height,
                width: resolvedWidth,
                overflow: 'auto',
                position: 'relative',
            }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems}
            </div>
        </div>
    );
}

export default VirtualList;

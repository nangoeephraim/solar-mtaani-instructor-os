import { useState, useCallback, useRef } from 'react';

interface OptimisticState<T> {
    value: T;
    isOptimistic: boolean;
    isPending: boolean;
    error: Error | null;
}

interface OptimisticActions<T> {
    /** Update value optimistically and run async operation */
    update: (newValue: T, asyncOperation: () => Promise<T>) => Promise<void>;
    /** Manually set value without async operation */
    set: (value: T) => void;
    /** Reset to initial value */
    reset: () => void;
    /** Manually rollback to previous value */
    rollback: () => void;
}

/**
 * useOptimistic - Optimistic UI updates for better perceived performance
 * Updates UI immediately while async operation runs in background
 * Automatically rolls back on error
 * 
 * @param initialValue - The initial value
 * @returns [state, actions] - Current state and action methods
 * 
 * @example
 * const [{ value: student, isPending }, { update }] = useOptimistic(initialStudent);
 * 
 * const handleSave = () => {
 *   update(updatedStudent, async () => {
 *     const result = await api.updateStudent(updatedStudent);
 *     return result;
 *   });
 * };
 */
export function useOptimistic<T>(
    initialValue: T
): [OptimisticState<T>, OptimisticActions<T>] {
    const [state, setState] = useState<OptimisticState<T>>({
        value: initialValue,
        isOptimistic: false,
        isPending: false,
        error: null,
    });

    const previousValueRef = useRef<T>(initialValue);

    const update = useCallback(
        async (newValue: T, asyncOperation: () => Promise<T>): Promise<void> => {
            // Store current value for potential rollback
            previousValueRef.current = state.value;

            // Optimistically update the UI
            setState({
                value: newValue,
                isOptimistic: true,
                isPending: true,
                error: null,
            });

            try {
                // Run the actual async operation
                const result = await asyncOperation();

                // Replace optimistic value with server response
                setState({
                    value: result,
                    isOptimistic: false,
                    isPending: false,
                    error: null,
                });
            } catch (error) {
                // Rollback on error
                setState({
                    value: previousValueRef.current,
                    isOptimistic: false,
                    isPending: false,
                    error: error as Error,
                });
                throw error; // Re-throw to allow handling in component
            }
        },
        [state.value]
    );

    const set = useCallback((value: T) => {
        previousValueRef.current = state.value;
        setState({
            value,
            isOptimistic: false,
            isPending: false,
            error: null,
        });
    }, [state.value]);

    const reset = useCallback(() => {
        setState({
            value: initialValue,
            isOptimistic: false,
            isPending: false,
            error: null,
        });
        previousValueRef.current = initialValue;
    }, [initialValue]);

    const rollback = useCallback(() => {
        setState({
            value: previousValueRef.current,
            isOptimistic: false,
            isPending: false,
            error: null,
        });
    }, []);

    return [
        state,
        { update, set, reset, rollback },
    ];
}

export default useOptimistic;

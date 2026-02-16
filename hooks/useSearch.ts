import { useMemo, useState, useCallback } from 'react';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { useDebounce } from './useDebounce';

export interface SearchResult<T> {
    item: T;
    score: number;
    matches?: ReadonlyArray<{
        indices: readonly [number, number][];
        key?: string;
        value?: string;
    }>;
}

export interface UseSearchOptions<T> {
    /** Keys to search in the items */
    keys: (keyof T | string)[];
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Minimum query length to trigger search */
    minQueryLength?: number;
    /** Fuse.js threshold (0.0 = exact match, 1.0 = match anything) */
    threshold?: number;
    /** Include score in results */
    includeScore?: boolean;
    /** Include matches in results */
    includeMatches?: boolean;
    /** Enable extended search patterns */
    useExtendedSearch?: boolean;
    /** Limit number of results */
    limit?: number;
}

/**
 * useSearch - Fuzzy search hook powered by Fuse.js with debouncing
 * Perfect for searching through students, schedules, or any collection
 * 
 * @example
 * const { query, setQuery, results, isSearching } = useSearch(students, {
 *   keys: ['name', 'email', 'guardianName'],
 *   threshold: 0.3,
 *   debounceMs: 300
 * });
 */
export function useSearch<T>(
    items: T[],
    options: UseSearchOptions<T>
) {
    const {
        keys,
        debounceMs = 300,
        minQueryLength = 1,
        threshold = 0.4,
        includeScore = true,
        includeMatches = true,
        useExtendedSearch = false,
        limit = 50,
    } = options;

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, debounceMs);

    // Create Fuse instance with memoization
    const fuse = useMemo(() => {
        const fuseOptions: IFuseOptions<T> = {
            keys: keys as string[],
            threshold,
            includeScore,
            includeMatches,
            useExtendedSearch,
            minMatchCharLength: 2,
            ignoreLocation: true,
        };
        return new Fuse(items, fuseOptions);
    }, [items, keys, threshold, includeScore, includeMatches, useExtendedSearch]);

    // Perform search
    const results: SearchResult<T>[] = useMemo(() => {
        if (debouncedQuery.length < minQueryLength) {
            return [];
        }

        const searchResults = fuse.search(debouncedQuery, { limit });

        return searchResults.map((result: FuseResult<T>) => ({
            item: result.item,
            score: result.score ?? 0,
            matches: result.matches,
        }));
    }, [fuse, debouncedQuery, minQueryLength, limit]);

    // Filtered items (original items if no search, or just the matching items)
    const filteredItems: T[] = useMemo(() => {
        if (debouncedQuery.length < minQueryLength) {
            return items;
        }
        return results.map(r => r.item);
    }, [debouncedQuery, minQueryLength, items, results]);

    // Clear search
    const clearSearch = useCallback(() => {
        setQuery('');
    }, []);

    // Check if currently searching (query is non-empty and debouncing)
    const isSearching = query.length > 0 && query !== debouncedQuery;

    return {
        /** Current search query */
        query,
        /** Update the search query */
        setQuery,
        /** Debounced search query (for display) */
        debouncedQuery,
        /** Search results with scores and matches */
        results,
        /** Items filtered by search (or all items if no search) */
        filteredItems,
        /** Clear the search query */
        clearSearch,
        /** True while debouncing */
        isSearching,
        /** True if there are any results */
        hasResults: results.length > 0,
        /** True if search is active but no results found */
        noResults: debouncedQuery.length >= minQueryLength && results.length === 0,
    };
}

export default useSearch;

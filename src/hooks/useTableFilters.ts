import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type FilterOperator = 'contains' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';

export interface FilterState {
    [field: string]: string;
}

export interface OperatorState {
    [field: string]: FilterOperator;
}

export interface UseTableFiltersResult {
    filters: FilterState;
    operators: OperatorState;
    showFilters: boolean;
    toggleFilters: () => void;
    setFilter: (field: string, value: string, op?: FilterOperator) => void;
    clearFilters: () => void;
    queryParams: Record<string, any>;
    activeFiltersCount: number;
}

export function useTableFilters(initialFilters: FilterState = {}): UseTableFiltersResult {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    // Local state for immediate UI updates
    const [filters, setFilters] = useState<FilterState>(() => {
        // Init from URL or initial
        const urlFilters: FilterState = {};
        searchParams.forEach((value, key) => {
            // Parse filters[field]
            const match = key.match(/^filters\[(.*)\]$/);
            if (match) {
                urlFilters[match[1]] = value;
            }
        });
        return { ...initialFilters, ...urlFilters };
    });

    const [operators, setOperators] = useState<OperatorState>(() => {
        const urlOps: OperatorState = {};
        searchParams.forEach((value, key) => {
            // Parse op[field]
            const match = key.match(/^op\[(.*)\]$/);
            if (match) {
                urlOps[match[1]] = value as FilterOperator;
            }
        });
        return urlOps;
    });

    // Debounce filters for URL sync to avoid spamming history
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [filters]);

    // Sync URL when filters change
    useEffect(() => {
        const newParams = new URLSearchParams(searchParams);

        // Clear old filter params
        Array.from(newParams.keys()).forEach(key => {
            if (key.startsWith('filters[') || key.startsWith('op[')) {
                newParams.delete(key);
            }
        });

        // Add current filters
        Object.entries(debouncedFilters).forEach(([key, value]) => {
            if (value) {
                newParams.set(`filters[${key}]`, value);
            }
        });

        // Add specific operators if set (default validation handled by BE mostly, but good to preserve)
        Object.entries(operators).forEach(([key, value]) => {
            // Only valid if filter has value or explicit
            if (debouncedFilters[key]) {
                newParams.set(`op[${key}]`, value);
            }
        });

        // Preserve other params like page (handled by other hooks usually, but careful about overwriting)
        // setSearchParams merges? No, it replaces. So we read `searchParams` above.
        // Important: Paging should probably reset to 1 on filter change?
        // Usually yes. But that dependency is external.

        // Only update if changed (naive check provided by useEffect dependency)
        setSearchParams(newParams, { replace: true });
    }, [debouncedFilters, operators, setSearchParams]);

    const toggleFilters = useCallback(() => setShowFilters(prev => !prev), []);

    const setFilter = useCallback((field: string, value: string, op: FilterOperator = 'contains') => {
        setFilters(prev => {
            if (!value) {
                const next = { ...prev };
                delete next[field];
                return next;
            }
            return { ...prev, [field]: value };
        });

        setOperators(prev => ({ ...prev, [field]: op }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setOperators({});
    }, []);

    const activeFiltersCount = useMemo(() => Object.keys(filters).length, [filters]);

    // Construct query params object for API
    const queryParams = useMemo(() => {
        const params: any = {};
        Object.entries(filters).forEach(([k, v]) => {
            params[`filters[${k}]`] = v;
        });
        Object.entries(operators).forEach(([k, v]) => {
            if (filters[k]) {
                params[`op[${k}]`] = v;
            }
        });
        return params;
    }, [filters, operators]);

    return {
        filters,
        operators,
        showFilters,
        toggleFilters,
        setFilter,
        clearFilters,
        queryParams,
        activeFiltersCount
    };
}

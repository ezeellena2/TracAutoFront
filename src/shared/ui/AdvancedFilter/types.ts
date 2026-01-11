import { LucideIcon } from 'lucide-react';

export type FilterType = 'text' | 'select' | 'boolean' | 'date' | 'number';

export interface FilterOption {
    value: string | number | boolean;
    label: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    type: FilterType;
    placeholder?: string;
    options?: FilterOption[]; // For select
    icon?: LucideIcon;
    className?: string;
}

export interface AdvancedFilterProps {
    config: FilterConfig[];
    filters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onClearFilters: () => void;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

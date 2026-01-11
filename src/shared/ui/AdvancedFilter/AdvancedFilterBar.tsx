import { useState } from 'react';
import { Filter, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Drawer } from '../Drawer';
import { FilterConfig } from './types';
import { FilterFactory } from './FilterInputs';

interface AdvancedFilterBarProps {
    config: FilterConfig[];
    filters: Record<string, any>;
    onFilterChange: (key: string, value: any) => void;
    onClearFilters: () => void;
}

export function AdvancedFilterBar({
    config,
    filters,
    onFilterChange,
    onClearFilters
}: AdvancedFilterBarProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const activeFiltersCount = Object.keys(filters).length;

    // Helper to get display label for a filter
    const getFilterLabel = (key: string, value: any) => {
        const conf = config.find(c => c.key === key);
        if (!conf) return `${key}: ${value}`;

        if (conf.type === 'boolean') {
            const isTrue = value === 'true' || value === true;
            return `${conf.label}: ${isTrue ? t('common.yes') : t('common.no')}`;
        }

        if (conf.type === 'select' && conf.options) {
            const option = conf.options.find(o => String(o.value) === String(value));
            return `${conf.label}: ${option?.label || value}`;
        }

        return `${conf.label}: ${value}`;
    };

    return (
        <>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between gap-4">

                    {/* Active Filters List (Desktop) / Summary */}
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                        {activeFiltersCount === 0 && (
                            <span className="text-sm text-text-muted italic flex items-center gap-2">
                                <Filter size={14} />
                                {t('filters.noFiltersActive')}
                            </span>
                        )}

                        {Object.entries(filters).map(([key, value]) => (
                            <Badge
                                key={key}
                                variant="default" // Using default which is usually primary/neutral
                                className="pl-3 pr-1 py-1 flex items-center gap-2"
                            >
                                <span className="max-w-[150px] truncate">
                                    {getFilterLabel(key, value)}
                                </span>
                                <button
                                    onClick={() => onFilterChange(key, '')}
                                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </Badge>
                        ))}

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={onClearFilters}
                                className="text-xs text-text-muted hover:text-error transition-colors ml-2 underline decoration-dotted"
                            >
                                {t('filters.clearAll')}
                            </button>
                        )}
                    </div>

                    {/* Filter Trigger Button */}
                    <Button
                        variant={activeFiltersCount > 0 ? 'primary' : 'outline'}
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 shrink-0"
                    >
                        <Filter size={16} />
                        {t('filters.title')}
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filter Drawer */}
            <Drawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={t('filters.title')}
                width="md"
                footer={
                    <div className="flex justify-between w-full">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                onClearFilters();
                                setIsOpen(false);
                            }}
                            disabled={activeFiltersCount === 0}
                            className="text-text-muted hover:text-error"
                        >
                            <Trash2 size={16} className="mr-2" />
                            {t('filters.clearAll')}
                        </Button>
                        <Button onClick={() => setIsOpen(false)}>
                            {t('common.apply')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <p className="text-sm text-text-muted">
                        {t('filters.description')}
                    </p>

                    <div className="grid gap-5">
                        {config.map((filterConf) => (
                            <div key={filterConf.key}>
                                <FilterFactory
                                    config={filterConf}
                                    value={filters[filterConf.key]}
                                    onChange={(val) => onFilterChange(filterConf.key, val)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Drawer>
        </>
    );
}

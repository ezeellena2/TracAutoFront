import { FilterConfig } from './types';
import { useTranslation } from 'react-i18next';

interface FilterInputProps {
    config: FilterConfig;
    value: any;
    onChange: (value: any) => void;
}

export const FilterText = ({ config, value, onChange }: FilterInputProps) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-text block">
                {config.label}
            </label>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.placeholder || t('filters.placeholder.text')}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
        </div>
    );
};

export const FilterNumber = ({ config, value, onChange }: FilterInputProps) => {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-text block">
                {config.label}
            </label>
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={config.placeholder || '0'}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
        </div>
    );
};

export const FilterSelect = ({ config, value, onChange }: FilterInputProps) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-text block">
                {config.label}
            </label>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
            >
                <option value="">{config.placeholder || t('common.all')}</option>
                {config.options?.map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export const FilterBoolean = ({ config, value, onChange }: FilterInputProps) => {
    const { t } = useTranslation();

    // Convert boolean/string value to string for select
    const normalizedValue = value === true || value === 'true' ? 'true' :
        value === false || value === 'false' ? 'false' : '';

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-text block">
                {config.label}
            </label>
            <div className="flex bg-background border border-border rounded-lg p-1">
                <button
                    onClick={() => onChange('')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${!normalizedValue ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
                        }`}
                >
                    {t('common.all')}
                </button>
                <button
                    onClick={() => onChange('true')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${normalizedValue === 'true' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                        }`}
                >
                    {t('common.yes')}
                </button>
                <button
                    onClick={() => onChange('false')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${normalizedValue === 'false' ? 'bg-error/10 text-error shadow-sm' : 'text-text-muted hover:text-text'
                        }`}
                >
                    {t('common.no')}
                </button>
            </div>
        </div>
    );
};

export const FilterFactory = (props: FilterInputProps) => {
    switch (props.config.type) {
        case 'select': return <FilterSelect {...props} />;
        case 'boolean': return <FilterBoolean {...props} />;
        case 'number': return <FilterNumber {...props} />;
        case 'text':
        default: return <FilterText {...props} />;
    }
};

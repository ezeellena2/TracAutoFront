import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string | number;
    label: React.ReactNode;
    triggerLabel?: React.ReactNode;
}

interface SelectProps {
    label?: React.ReactNode;
    value?: string | number;
    onChange?: (value: string | number) => void;
    options: Option[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    required?: boolean;
}

export function Select({
    label,
    value,
    onChange,
    options,
    placeholder = 'Seleccionar...',
    error,
    disabled,
    className = '',
    dropdownClassName = '',
    buttonClassName = '',
}: SelectProps & { dropdownClassName?: string; buttonClassName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string | number) => {
        if (disabled) return;
        onChange?.(optionValue);
        setIsOpen(false);
    };

    const inputId = typeof label === 'string' ? label.toLowerCase().replace(/\s/g, '-') : undefined;

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-text mb-1.5"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    id={inputId}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
            w-full px-4 py-2 rounded-lg text-left flex items-center justify-between
            bg-surface border border-border 
            text-text transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-error focus:ring-error' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isOpen ? 'ring-2 ring-primary border-transparent' : ''}
            ${buttonClassName}
          `}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className={`block truncate ${!selectedOption ? 'text-text-muted' : ''}`}>
                        {selectedOption ? (selectedOption.triggerLabel || selectedOption.label) : placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className={`absolute z-50 mt-1.5 bg-surface border border-border rounded-lg shadow-xl max-h-[182px] overflow-auto animate-fade-in max-w-[95vw] ${dropdownClassName || 'w-full'}`}>
                        <ul role="listbox" className="py-1">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <li
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                      cursor-pointer select-none relative py-2 pl-4 pr-5 
                      ${isSelected ? 'bg-primary text-white' : 'text-text hover:bg-border'}
                      transition-colors duration-150
                    `}
                                    >
                                        <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white">
                                                <Check size={16} />
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-error">{error}</p>
            )}
        </div>
    );
}

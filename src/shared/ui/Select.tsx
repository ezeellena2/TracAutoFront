import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    /** Render dropdown in a portal so it escapes overflow-hidden containers */
    usePortal?: boolean;
    onBlur?: React.FocusEventHandler<HTMLButtonElement>;
    onFocus?: React.FocusEventHandler<HTMLButtonElement>;
}

export function Select({
    label,
    value,
    onChange,
    options,
    placeholder,
    error,
    disabled,
    className = '',
    dropdownClassName = '',
    buttonClassName = '',
    usePortal = false,
    onBlur,
    onFocus,
}: SelectProps & { dropdownClassName?: string; buttonClassName?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

    const selectedOption = options.find((opt) => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(target))
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Calculate position for portal dropdown
    const updatePortalPosition = useCallback(() => {
        if (!usePortal || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPortalStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            zIndex: 99999,
        });
    }, [usePortal]);

    useEffect(() => {
        if (isOpen && usePortal) {
            updatePortalPosition();
            // Reposition on scroll/resize
            window.addEventListener('scroll', updatePortalPosition, true);
            window.addEventListener('resize', updatePortalPosition);
            return () => {
                window.removeEventListener('scroll', updatePortalPosition, true);
                window.removeEventListener('resize', updatePortalPosition);
            };
        }
    }, [isOpen, usePortal, updatePortalPosition]);

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
                    ref={buttonRef}
                    id={inputId}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onBlur={onBlur}
                    onFocus={onFocus}
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
                {isOpen && (() => {
                    const dropdownContent = (
                        <div
                            ref={dropdownRef}
                            className={`${usePortal ? '' : 'absolute'} z-50 mt-1.5 bg-surface border border-border rounded-lg shadow-xl max-h-[182px] overflow-auto animate-fade-in max-w-[95vw] ${dropdownClassName || 'w-full'}`}
                            style={usePortal ? portalStyle : undefined}
                        >
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
                    );
                    return usePortal ? createPortal(dropdownContent, document.body) : dropdownContent;
                })()}
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-error">{error}</p>
            )}
        </div>
    );
}

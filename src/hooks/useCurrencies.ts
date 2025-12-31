import { useState, useEffect, useCallback } from 'react';
import { systemApi } from '@/services/endpoints';
import { CurrencyInfo } from '@/shared/types/api';

interface UseCurrenciesReturn {
    currencies: CurrencyInfo[];
    isLoading: boolean;
    error: string | null;
    formatPrice: (amount: number | null | undefined, currencyCode?: string) => string;
    getSymbol: (currencyCode: string) => string;
}

// Cache local simple para evitar refetching constante en la misma sesión
let currenciesCache: CurrencyInfo[] | null = null;

export const useCurrencies = (): UseCurrenciesReturn => {
    const [currencies, setCurrencies] = useState<CurrencyInfo[]>(currenciesCache || []);
    const [isLoading, setIsLoading] = useState(!currenciesCache);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currenciesCache) return;

        const loadCurrencies = async () => {
            try {
                const data = await systemApi.getCurrencies();
                currenciesCache = data;
                setCurrencies(data);
            } catch (err) {
                console.error('Error loading currencies configuration:', err);
                setError('Error al cargar configuración de monedas');
                // Fallback default para que la UI no se rompa totalmente
                setCurrencies([
                    { code: 'ARS', symbol: '$', name: 'Peso Argentino', cultureInfo: 'es-AR' },
                    { code: 'USD', symbol: 'u$s', name: 'Dólar Estadounidense', cultureInfo: 'en-US' }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        void loadCurrencies();
    }, []);

    const getCurrencyInfo = useCallback((code: string): CurrencyInfo | undefined => {
        return currencies.find(c => c.code === code);
    }, [currencies]);

    const formatPrice = useCallback((amount: number | null | undefined, currencyCode: string = 'ARS'): string => {
        if (amount === null || amount === undefined) return '-';

        const currency = getCurrencyInfo(currencyCode);
        // Si tenemos config del backend, usamos su cultura y símbolo
        // Si no (todavía cargando o error), fallback a lógica básica
        const culture = currency?.cultureInfo || 'es-AR';

        try {
            return new Intl.NumberFormat(culture, {
                style: 'currency',
                currency: currencyCode,
                maximumFractionDigits: 0,
            }).format(amount);
        } catch (error) {
            console.warn(`Error formatting currency ${currencyCode}:`, error);
            return `${currencyCode} ${amount}`;
        }
    }, [getCurrencyInfo]);

    const getSymbol = useCallback((currencyCode: string): string => {
        return getCurrencyInfo(currencyCode)?.symbol || '$';
    }, [getCurrencyInfo]);

    return {
        currencies,
        isLoading,
        error,
        formatPrice,
        getSymbol
    };
};

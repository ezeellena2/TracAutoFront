/**
 * Formatea un valor numérico a moneda
 * @param value Valor a formatear
 * @param currency Código de moneda (ARS, USD, EUR)
 * @param culture Cultura (ej: es-AR, en-US)
 */
export const formatCurrency = (
    value: number | null | undefined,
    currency: string = 'ARS',
    culture: string = 'es-AR'
): string => {
    if (value === null || value === undefined) return '-';

    try {
        return new Intl.NumberFormat(culture, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0, // Generalmente para autos no usamos centavos
        }).format(value);
    } catch (error) {
        console.error('Error formatting currency:', error);
        return `${currency} ${value}`;
    }
};

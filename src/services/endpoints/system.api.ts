import { apiClient } from '../http/apiClient';
import { CurrencyInfo } from '@/shared/types/api';

const BASE_URL = '/system';

export const systemApi = {
    getCurrencies: async (): Promise<CurrencyInfo[]> => {
        const response = await apiClient.get<CurrencyInfo[]>(`${BASE_URL}/currencies`);
        return response.data;
    },
};

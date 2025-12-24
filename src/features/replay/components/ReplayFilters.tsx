/**
 * ReplayFilters component
 * Device selector and date preset picker
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Loader2 } from 'lucide-react';
import { DatePreset, DATE_PRESET_LABELS } from '../types';
import { getDispositivos } from '@/services/endpoints/dispositivos.api';
import { DispositivoDto } from '@/shared/types/api';
import { formatDateForInput } from '@/shared/utils';

interface ReplayFiltersProps {
  selectedDispositivoId: string | null;
  preset: DatePreset;
  from: Date;
  to: Date;
  isLoading: boolean;
  onDispositivoChange: (id: string | null) => void;
  onPresetChange: (preset: DatePreset) => void;
  onDateRangeChange: (from: Date, to: Date) => void;
  onLoadClick: () => void;
}

export function ReplayFilters({
  selectedDispositivoId,
  preset,
  from,
  to,
  isLoading,
  onDispositivoChange,
  onPresetChange,
  onDateRangeChange,
  onLoadClick,
}: ReplayFiltersProps) {
  const { t } = useTranslation();
  const [dispositivos, setDispositivos] = useState<DispositivoDto[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await getDispositivos({ soloActivos: true, tamanoPagina: 100 });
        setDispositivos(response.items);
      } catch (err) {
        console.error('Error loading dispositivos:', err);
      } finally {
        setLoadingDevices(false);
      }
    };
    loadDevices();
  }, []);

  // Filter devices by search
  const filteredDispositivos = dispositivos.filter(d =>
    d.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.uniqueId?.toString().includes(searchTerm)
  );

  const presets = Object.entries(DATE_PRESET_LABELS) as [DatePreset, string][];

  return (
    <div className="bg-surface border-b border-border p-4 space-y-4">
      {/* Device selector */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {t('replay.device')}
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={t('replay.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg bg-background">
          {loadingDevices ? (
            <div className="p-3 text-center text-text-muted">
              <Loader2 size={16} className="animate-spin inline mr-2" />
              {t('replay.loadingDevices')}
            </div>
          ) : filteredDispositivos.length === 0 ? (
            <div className="p-3 text-center text-text-muted text-sm">
              {t('replay.noDevices')}
            </div>
          ) : (
            filteredDispositivos.map((d) => (
              <button
                key={d.id}
                onClick={() => onDispositivoChange(d.id)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  selectedDispositivoId === d.id
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'hover:bg-background-hover text-text'
                }`}
              >
                <div className="font-medium">{d.nombre || `Dispositivo ${d.uniqueId}`}</div>
                <div className="text-xs text-text-muted">ID: {d.uniqueId}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Date preset */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {t('replay.period')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(([key]) => (
            <button
              key={key}
              onClick={() => onPresetChange(key)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                preset === key
                  ? 'bg-primary text-white'
                  : 'bg-background border border-border text-text hover:bg-background-hover'
              }`}
            >
              {t(`replay.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range (only when preset is 'custom') */}
      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">{t('replay.from')}</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="datetime-local"
                value={formatDateForInput(from)}
                onChange={(e) => onDateRangeChange(new Date(e.target.value), to)}
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded text-text"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">{t('replay.to')}</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="datetime-local"
                value={formatDateForInput(to)}
                onChange={(e) => onDateRangeChange(from, new Date(e.target.value))}
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded text-text"
              />
            </div>
          </div>
        </div>
      )}

      {/* Load button */}
      <button
        onClick={onLoadClick}
        disabled={!selectedDispositivoId || isLoading}
        className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t('replay.loading')}
          </>
        ) : (
          t('replay.load')
        )}
      </button>
    </div>
  );
}

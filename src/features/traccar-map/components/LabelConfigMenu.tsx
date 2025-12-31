import { useTranslation } from 'react-i18next';
import { useTraccarMapStore } from '../store/traccarMap.store';

interface LabelConfigMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LabelConfigMenu({ isOpen, onClose: _onClose }: LabelConfigMenuProps) {
  const { t } = useTranslation();
  const { labelConfig, toggleLabelField, setLabelConfig } = useTraccarMapStore();

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    setLabelConfig({ enabled: !labelConfig.enabled });
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-[1001]">
      <div className="p-3 border-b border-border bg-background/50">
        <h3 className="text-sm font-semibold text-text">
          {t('map.labelConfig.title')}
        </h3>
      </div>

      <div className="p-3 space-y-3">
        {/* Toggle principal */}
        <div className="pb-2 border-b border-border">
          <label className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-background cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={labelConfig.enabled}
              onChange={handleToggleEnabled}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm text-text font-medium">
              {t('map.labelConfig.enableLabels')}
            </span>
          </label>
        </div>

        {/* Campos individuales - mejor espaciado vertical */}
        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-background cursor-pointer transition-colors ${!labelConfig.enabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <input
              type="checkbox"
              checked={labelConfig.showImei}
              onChange={() => toggleLabelField('showImei')}
              disabled={!labelConfig.enabled}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-text">
              {t('map.labelConfig.showImei')}
            </span>
          </label>

          <label
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-background cursor-pointer transition-colors ${!labelConfig.enabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <input
              type="checkbox"
              checked={labelConfig.showPatente}
              onChange={() => toggleLabelField('showPatente')}
              disabled={!labelConfig.enabled}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-text">
              {t('map.labelConfig.showPatente')}
            </span>
          </label>

          <label
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-background cursor-pointer transition-colors ${!labelConfig.enabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <input
              type="checkbox"
              checked={labelConfig.showEstado}
              onChange={() => toggleLabelField('showEstado')}
              disabled={!labelConfig.enabled}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-text">
              {t('map.labelConfig.showEstado')}
            </span>
          </label>

          <label
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-background cursor-pointer transition-colors ${!labelConfig.enabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <input
              type="checkbox"
              checked={labelConfig.showOrganizacionAsociada}
              onChange={() => toggleLabelField('showOrganizacionAsociada')}
              disabled={!labelConfig.enabled}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-text">
              {t('map.labelConfig.showOrganizacionAsociada')}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}


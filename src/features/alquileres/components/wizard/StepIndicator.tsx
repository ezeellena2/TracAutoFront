import { useTranslation } from 'react-i18next';
import { User, Car, Settings2, ClipboardCheck } from 'lucide-react';
import type { WizardStep } from '../../types';

const PASOS: { key: WizardStep; icon: typeof User }[] = [
  { key: 'cliente', icon: User },
  { key: 'vehiculo', icon: Car },
  { key: 'opciones', icon: Settings2 },
  { key: 'resumen', icon: ClipboardCheck },
];

const PASO_INDEX: Record<WizardStep, number> = {
  cliente: 0,
  vehiculo: 1,
  opciones: 2,
  resumen: 3,
};

interface StepIndicatorProps {
  pasoActual: WizardStep;
}

export function StepIndicator({ pasoActual }: StepIndicatorProps) {
  const { t } = useTranslation();
  const actualIdx = PASO_INDEX[pasoActual];

  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-2">
      {PASOS.map((paso, idx) => {
        const Icon = paso.icon;
        const esCompletado = idx < actualIdx;
        const esActual = idx === actualIdx;
        const esFuturo = idx > actualIdx;

        return (
          <div key={paso.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  esCompletado
                    ? 'bg-primary text-white'
                    : esActual
                      ? 'bg-primary/20 text-primary ring-2 ring-primary'
                      : 'bg-surface-secondary text-text-muted'
                }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  esFuturo ? 'text-text-muted' : 'text-text'
                }`}
              >
                {t(`alquileres.wizard.pasos.${paso.key}`)}
              </span>
            </div>

            {idx < PASOS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-1rem] ${
                  idx < actualIdx ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { User, ClipboardCheck, CreditCard } from 'lucide-react';

type Paso = 1 | 2 | 3;

const PASOS: { paso: Paso; icon: typeof User; key: string }[] = [
  { paso: 1, icon: User, key: 'datosPersonales' },
  { paso: 2, icon: ClipboardCheck, key: 'resumen' },
  { paso: 3, icon: CreditCard, key: 'confirmacion' },
];

interface StepIndicatorPublicoProps {
  pasoActual: Paso;
}

export function StepIndicatorPublico({ pasoActual }: StepIndicatorPublicoProps) {
  const { t } = useTranslation();

  return (
    <div
      role="progressbar"
      aria-valuenow={pasoActual}
      aria-valuemin={1}
      aria-valuemax={3}
      className="flex items-center justify-between px-2 sm:px-6 py-4"
    >
      {PASOS.map(({ paso, icon: Icon, key }, idx) => {
        const esCompletado = paso < pasoActual;
        const esActual = paso === pasoActual;

        return (
          <div key={paso} className="flex items-center flex-1 last:flex-none">
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
                className={`text-xs mt-1.5 font-medium hidden sm:block ${
                  esCompletado || esActual ? 'text-text' : 'text-text-muted'
                }`}
              >
                {t(`alquilerPublico.reserva.pasos.${key}`)}
              </span>
            </div>

            {idx < PASOS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 mt-[-1rem] sm:mt-[-1.5rem] ${
                  esCompletado ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

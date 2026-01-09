/**
 * Selector de hora simple (HH:mm)
 * Usa input nativo type="time" con estilos personalizados
 */

interface TimePickerProps {
  /** Valor actual en formato "HH:mm" */
  value: string;
  /** Callback cuando cambia el valor */
  onChange: (value: string) => void;
  /** Label del campo */
  label?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Error de validación */
  error?: string;
  /** Clase adicional */
  className?: string;
  /** ID del input */
  id?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
  disabled = false,
  error,
  className = '',
  id,
}: TimePickerProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label 
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          px-3 py-2 rounded-lg border
          text-sm font-mono
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
            : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          }
          ${error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600'
          }
        `}
      />
      
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

interface TimeRangePickerProps {
  /** Hora de inicio */
  startValue: string;
  /** Hora de fin */
  endValue: string;
  /** Callback cuando cambia inicio */
  onStartChange: (value: string) => void;
  /** Callback cuando cambia fin */
  onEndChange: (value: string) => void;
  /** Labels personalizados */
  startLabel?: string;
  endLabel?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Errores */
  startError?: string;
  endError?: string;
  /** Si cruza medianoche (para mostrar indicador) */
  cruzaMedianoche?: boolean;
}

export function TimeRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startLabel = 'Inicio',
  endLabel = 'Fin',
  disabled = false,
  startError,
  endError,
  cruzaMedianoche = false,
}: TimeRangePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <TimePicker
          id="hora-inicio"
          value={startValue}
          onChange={onStartChange}
          label={startLabel}
          disabled={disabled}
          error={startError}
        />
        
        <span className="pb-2 text-gray-400">—</span>
        
        <TimePicker
          id="hora-fin"
          value={endValue}
          onChange={onEndChange}
          label={endLabel}
          disabled={disabled}
          error={endError}
        />
        
        {cruzaMedianoche && (
          <span 
            className="pb-2 text-xs text-amber-600 dark:text-amber-400 font-medium"
            title="Este turno cruza medianoche"
          >
            (+1 día)
          </span>
        )}
      </div>
      
      {cruzaMedianoche && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ⚠️ Este turno cruza la medianoche. Ejemplo: 20:00 - 06:00 significa desde las 20:00 hasta las 06:00 del día siguiente.
        </p>
      )}
    </div>
  );
}

// Feature: Turnos de Taxi
// Gestión de turnos y zonas geográficas para operaciones de taxi

// Types
export * from './types';

// API
export { turnosTaxiApi, geofenceVinculosApi } from './api';

// Store
export { useTurnosTaxiStore } from './store/turnosTaxi.store';

// Hooks
export { useTurnosTaxi } from './hooks/useTurnosTaxi';

// Components
export {
  DiasSelector,
  TimePicker,
  TimeRangePicker,
  TurnosTaxiTable,
  TurnoTaxiModal,
  GeofenceSelector,
  TurnosTaxiFilters,
  TurnosTimeline,
  SimuladorHora,
  AlertaCruceMedianoche,
  AlertaSolapamiento,
  InfoDiasActivos,
  TurnoStatusBadge,
  TurnoTooltipContent,
} from './components';

// Pages
export { TurnosTaxiPage } from './pages/TurnosTaxiPage';

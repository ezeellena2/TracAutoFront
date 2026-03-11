import { AppProviders } from '@/app/providers';
import { AlquilerRouter } from './routes';

export function AlquilerApp() {
  return (
    <AppProviders>
      <AlquilerRouter />
    </AppProviders>
  );
}

export default AlquilerApp;

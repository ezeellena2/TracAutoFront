import { AppProviders } from '@/app/providers';
import { B2BRouter } from './routes';
import { PWAInstallPrompt } from '@/shared/ui';

export function B2BApp() {
  return (
    <AppProviders>
      <B2BRouter />
      <PWAInstallPrompt />
    </AppProviders>
  );
}

export default B2BApp;

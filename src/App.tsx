import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/routes';
import { PWAInstallPrompt } from '@/shared/ui';

export function App() {
  return (
    <AppProviders>
      <AppRouter />
      <PWAInstallPrompt />
    </AppProviders>
  );
}

export default App;

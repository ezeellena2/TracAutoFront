import { AppProviders } from '@/app/providers';
import { MarketplaceRouter } from './routes';

export function MarketplaceApp() {
  return (
    <AppProviders>
      <MarketplaceRouter />
    </AppProviders>
  );
}

export default MarketplaceApp;

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt component
 * Shows a banner when the app can be installed as a PWA
 * Handles the beforeinstallprompt event
 */
export function PWAInstallPrompt() {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed in this session
        const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
        if (wasDismissed) {
            setDismissed(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the default browser prompt
            e.preventDefault();
            // Store the event for later use
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show our custom banner
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user's choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            // User accepted, hide banner
            setShowBanner(false);
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        setDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't render if no prompt is available, already dismissed, or banner is hidden
    if (!showBanner || dismissed || !deferredPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-surface border border-border rounded-xl shadow-2xl p-4 z-50 animate-slide-in">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Download size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text">
                        {t('pwa.installTitle', 'Instalar TracAuto')}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                        {t('pwa.installDescription', 'Instalá la app para acceso rápido desde tu pantalla de inicio')}
                    </p>
                    <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={handleInstall}>
                            {t('pwa.install', 'Instalar')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleDismiss}>
                            {t('pwa.later', 'Más tarde')}
                        </Button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 text-text-muted hover:text-text transition-colors flex-shrink-0"
                    aria-label={t('common.close', 'Cerrar')}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

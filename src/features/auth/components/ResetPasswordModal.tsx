import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Button, Input, Alert, Modal } from '@/shared/ui';
import { authApi } from '@/services/endpoints';
import { authService } from '@/services/auth.service';
import { PasswordSchema } from '@/shared/types/api';
import { useNavigate } from 'react-router-dom';
import { useErrorHandler, useDebounce } from '@/hooks';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    token: string;
}

export function ResetPasswordModal({ isOpen, onClose, email, token }: ResetPasswordModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { parseError } = useErrorHandler();
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const debouncedNuevaPassword = useDebounce(nuevaPassword, 800);
    const debouncedConfirmPassword = useDebounce(confirmPassword, 800);

    const [touched, setTouched] = useState({
        nuevaPassword: false,
        confirmPassword: false,
    });

    const validatePassword = (pass: string) => {
        if (!pass) return t('common.required');
        const parseResult = PasswordSchema.safeParse(pass);
        if (!parseResult.success) {
            // Zod returns an array of issues, we just show the first one
            return t(parseResult.error.issues[0].message);
        }
        return '';
    };

    const validateConfirm = (conf: string) => {
        if (!conf) return t('common.required');
        if (conf !== nuevaPassword) return t('auth.errors.passwordMismatch');
        return '';
    };

    const nuevaPasswordError = (touched.nuevaPassword && nuevaPassword === debouncedNuevaPassword)
        ? validatePassword(debouncedNuevaPassword)
        : '';

    // Solo mostramos el error si el usuario dejó de escribir (value === debouncedValue)
    const confirmPasswordError = (touched.confirmPassword && confirmPassword === debouncedConfirmPassword)
        ? validateConfirm(debouncedConfirmPassword)
        : '';

    const isFormValid = !validatePassword(nuevaPassword) && !validateConfirm(confirmPassword);

    const handleResetPassword = async () => {
        setIsLoading(true);
        setError('');

        try {
            await authApi.resetPassword({
                email,
                token,
                nuevaPassword,
            });

            setSuccess(true);
            setRetryCount(0);

            // Intentar login automático con la nueva contraseña
            const loginResult = await authService.login(email, nuevaPassword, true);

            if (loginResult.success) {
                // Redirigir al dashboard tras 1.5s para que vea el éxito
                setTimeout(() => {
                    onClose();
                    navigate('/', { replace: true });
                }, 1500);
            } else {
                // Si el auto-login falla, redirigir al login normal con mensaje
                setTimeout(() => {
                    onClose();
                    navigate('/login', {
                        state: { message: t('auth.success.passwordResetOk') },
                        replace: true
                    });
                }, 3000);
            }

        } catch (err: any) {
            const parsed = parseError(err);
            
            if (parsed.status === 500) {
                const newCount = retryCount + 1;
                setRetryCount(newCount);
                
                if (newCount >= 3) {
                    setError(t('errors.HTTP_500'));
                } else {
                    setError(parsed.message);
                }
            } else {
                setError(parsed.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        await handleResetPassword();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Lock size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-text text-lg leading-tight">
                                {t('auth.resetPasswordTitle')}
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                {t('auth.resetPasswordSubtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 -mr-1 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="py-4 space-y-4">
                        <Alert
                            type="success"
                            message={t('auth.success.passwordResetOk')}
                        />
                        <div className="flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <Input
                            label={t('auth.newPasswordLabel')}
                            type={showPassword ? 'text' : 'password'}
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            onFocus={() => setError('')}
                            onBlur={() => setTouched(prev => ({ ...prev, nuevaPassword: true }))}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            error={nuevaPasswordError}
                            disabled={isLoading}
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-text-muted hover:text-text"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        />

                        <Input
                            label={t('auth.confirmPasswordLabel')}
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setError('')}
                            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            error={confirmPasswordError}
                            disabled={isLoading}
                        />

                        {error && (
                            <Alert 
                                type="error" 
                                message={error} 
                                onRetry={(retryCount > 0 && retryCount < 3) ? handleResetPassword : undefined}
                            />
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isLoading || !isFormValid}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" aria-hidden="true" />
                                        <span>{t('auth.resettingPasswordButton')}</span>
                                    </>
                                ) : (
                                    t('auth.resetPasswordButton')
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

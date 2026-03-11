import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Button, Input, Alert, Modal } from '@/shared/ui';
import { authApi } from '@/services/endpoints';
import { authService } from '@/services/auth.service';
import { useNavigate } from 'react-router-dom';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    token: string;
}

export function ResetPasswordModal({ isOpen, onClose, email, token }: ResetPasswordModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [touched, setTouched] = useState({
        nuevaPassword: false,
        confirmPassword: false,
    });

    const validatePassword = (pass: string) => {
        if (!pass) return t('common.required');
        if (pass.length < 8) return t('auth.errors.passwordMinLength');
        return '';
    };

    const validateConfirm = (conf: string) => {
        if (!conf) return t('common.required');
        if (conf !== nuevaPassword) return t('auth.errors.passwordsMustMatch');
        return '';
    };

    const nuevaPasswordError = touched.nuevaPassword ? validatePassword(nuevaPassword) : '';
    const confirmPasswordError = touched.confirmPassword ? validateConfirm(confirmPassword) : '';
    const isFormValid = !validatePassword(nuevaPassword) && !validateConfirm(confirmPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsLoading(true);
        setError('');

        try {
            await authApi.resetPassword({
                email,
                token,
                nuevaPassword,
            });

            setSuccess(true);

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
            // El usuario prefiere un mensaje genérico para el error de reset
            setError(t('auth.errors.resetPasswordError'));
        } finally {
            setIsLoading(false);
        }
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
                                {t('auth.resetPasswordTitle', 'Restablecer Contraseña')}
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                {t('auth.resetPasswordSubtitle', 'Ingrese su nueva contraseña de acceso.')}
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
                            message={t('auth.success.passwordResetOk', '¡Contraseña restablecida con éxito! Redirigiendo...')}
                        />
                        <div className="flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {error && <Alert type="error" message={error} />}

                        <Input
                            label={t('auth.newPasswordLabel', 'Nueva Contraseña')}
                            type={showPassword ? 'text' : 'password'}
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
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
                            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            error={confirmPasswordError}
                            disabled={isLoading}
                        />

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
                                        <Loader2 size={18} className="animate-spin mr-2" />
                                        {t('common.processing', 'Procesando...')}
                                    </>
                                ) : (
                                    t('auth.resetPasswordButton', 'Cambiar Contraseña')
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

/** Constantes del módulo SolicitudesCambio (frontend) */
export const SolicitudCambioLimits = {
    /**
     * Máximo de mensajes de usuario por solicitud.
     * ⚠️ Debe mantenerse en sync con SolicitudCambioLimits.MaxMensajesUsuario (backend).
     * La IA puede cerrar el ticket antes si tiene suficiente información.
     */
    MAX_MENSAJES_USUARIO: 10,
} as const;

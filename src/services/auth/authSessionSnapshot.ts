import {
  ActivarCuentaResponse,
  AppleAuthResponse,
  AuthSessionSnapshotDto,
  GoogleAuthResponse,
  RefreshTokenResponse,
  VerificacionCuentaResponse,
} from '@/shared/types/api';

export function ensureAuthSessionSnapshot(snapshot: AuthSessionSnapshotDto): AuthSessionSnapshotDto {
  return {
    ...snapshot,
    modulosActivos: snapshot.modulosActivos ?? [],
    capacidadesEfectivas: snapshot.capacidadesEfectivas ?? [],
    contextoActivo: {
      ...snapshot.contextoActivo,
      modulosActivos: snapshot.contextoActivo?.modulosActivos ?? snapshot.modulosActivos ?? [],
      capacidadesEfectivas: snapshot.contextoActivo?.capacidadesEfectivas ?? snapshot.capacidadesEfectivas ?? [],
    },
    contextosDisponibles: (snapshot.contextosDisponibles ?? []).map((contexto) => ({
      ...contexto,
      modulosActivos: contexto.modulosActivos ?? [],
      capacidadesEfectivas: contexto.capacidadesEfectivas ?? [],
    })),
  };
}

export function snapshotFromGoogleAuthResponse(response: GoogleAuthResponse): AuthSessionSnapshotDto | null {
  if (!response.usuarioId || !response.nombreUsuario || !response.token || !response.contextoActivo) {
    return null;
  }

  return ensureAuthSessionSnapshot({
    usuarioId: response.usuarioId,
    personaId: response.personaId ?? null,
    organizacionId: response.organizacionId ?? null,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion ?? null,
    rol: response.rol ?? null,
    theme: response.theme,
    modulosActivos: response.modulosActivos ?? [],
    capacidadesEfectivas: response.capacidadesEfectivas ?? [],
    contextoActivo: response.contextoActivo,
    contextosDisponibles: response.contextosDisponibles ?? [],
  });
}

export function snapshotFromAppleAuthResponse(response: AppleAuthResponse): AuthSessionSnapshotDto | null {
  if (!response.usuarioId || !response.nombreUsuario || !response.token || !response.contextoActivo) {
    return null;
  }

  return ensureAuthSessionSnapshot({
    usuarioId: response.usuarioId,
    personaId: response.personaId ?? null,
    organizacionId: response.organizacionId ?? null,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion ?? null,
    rol: response.rol ?? null,
    theme: response.theme ?? null,
    modulosActivos: response.modulosActivos ?? [],
    capacidadesEfectivas: response.capacidadesEfectivas ?? [],
    contextoActivo: response.contextoActivo,
    contextosDisponibles: response.contextosDisponibles ?? [],
  });
}

export function snapshotFromActivationResponse(response: ActivarCuentaResponse): AuthSessionSnapshotDto | null {
  if (!response.usuarioId || !response.nombreUsuario || !response.email || !response.contextoActivo) {
    return null;
  }

  return ensureAuthSessionSnapshot({
    usuarioId: response.usuarioId,
    personaId: response.personaId ?? null,
    organizacionId: response.organizacionId ?? null,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion ?? null,
    rol: response.rol ?? null,
    theme: response.theme ?? null,
    modulosActivos: response.modulosActivos ?? [],
    capacidadesEfectivas: response.capacidadesEfectivas ?? [],
    contextoActivo: response.contextoActivo,
    contextosDisponibles: response.contextosDisponibles ?? [],
  });
}

export function snapshotFromVerificationResponse(response: VerificacionCuentaResponse): AuthSessionSnapshotDto {
  return ensureAuthSessionSnapshot({
    usuarioId: response.usuarioId,
    personaId: response.personaId ?? null,
    organizacionId: response.organizacionId ?? null,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion ?? null,
    rol: response.rol ?? null,
    theme: response.theme ?? null,
    modulosActivos: response.modulosActivos ?? [],
    capacidadesEfectivas: response.capacidadesEfectivas ?? [],
    contextoActivo: response.contextoActivo,
    contextosDisponibles: response.contextosDisponibles ?? [],
  });
}

export function snapshotFromRefreshResponse(response: RefreshTokenResponse): AuthSessionSnapshotDto {
  return ensureAuthSessionSnapshot({
    usuarioId: response.usuarioId,
    personaId: response.personaId ?? null,
    organizacionId: response.organizacionId ?? null,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion ?? null,
    rol: response.rol ?? null,
    theme: response.theme ?? null,
    modulosActivos: response.modulosActivos ?? [],
    capacidadesEfectivas: response.capacidadesEfectivas ?? [],
    contextoActivo: response.contextoActivo,
    contextosDisponibles: response.contextosDisponibles ?? [],
  });
}

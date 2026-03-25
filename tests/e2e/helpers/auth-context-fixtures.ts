import type { Page, Route } from '@playwright/test';

const API_PREFIX = '/api/v1';
const MODULO_FLOTA = 1;
const MODULO_MARKETPLACE = 3;

type ContextType = 'Personal' | 'Organizacion';
type UserRole = 'Admin' | 'Operador' | 'Analista' | 'SuperAdmin' | null;

interface MockContext {
  tipo: ContextType;
  id: string | null;
  nombre: string;
  organizacionId: string | null;
  rol: UserRole;
  modulosActivos: number[];
  capacidadesEfectivas: string[];
}

interface MockSessionDefinition {
  userId: string;
  personaId: string;
  email: string;
  nombreUsuario: string;
  contexts: MockContext[];
  activeContextKey: string;
}

interface MockIdentityState {
  session: MockSessionDefinition;
  refreshCount: number;
  lastReenviarCodigoBody: Record<string, unknown> | null;
}

export interface MockApiController {
  getRefreshCount(): number;
  getLastReenviarCodigoBody(): Record<string, unknown> | null;
  setActiveContext(contextKey: string): void;
  getActiveContext(): MockContext;
}

export interface InstallMocksOptions {
  session?: MockSessionDefinition;
  requireAuthorizationOnDataRequests?: boolean;
  loginMode?: 'success' | 'not-verified';
}

function contextKey(context: MockContext): string {
  return `${context.tipo}:${context.id ?? 'personal'}`;
}

function getContextByKey(session: MockSessionDefinition, key: string): MockContext {
  const found = session.contexts.find((context) => contextKey(context) === key);
  if (!found) {
    throw new Error(`Unknown context key "${key}"`);
  }
  return found;
}

function getActiveContext(state: MockIdentityState): MockContext {
  return getContextByKey(state.session, state.session.activeContextKey);
}

function buildTheme() {
  return {
    primary: '#0f766e',
    primaryDark: '#115e59',
    secondary: '#1d4ed8',
  };
}

function buildSnapshot(state: MockIdentityState) {
  const active = getActiveContext(state);
  const isOrganization = active.tipo === 'Organizacion';

  return {
    usuarioId: state.session.userId,
    personaId: state.session.personaId,
    organizacionId: isOrganization ? active.organizacionId : null,
    nombreUsuario: state.session.nombreUsuario,
    email: state.session.email,
    nombreOrganizacion: isOrganization ? active.nombre : null,
    rol: isOrganization ? active.rol : null,
    theme: isOrganization ? buildTheme() : null,
    modulosActivos: active.modulosActivos,
    capacidadesEfectivas: active.capacidadesEfectivas,
    contextoActivo: {
      tipo: active.tipo,
      id: active.id,
      nombre: active.nombre,
      modulosActivos: active.modulosActivos,
      capacidadesEfectivas: active.capacidadesEfectivas,
    },
    contextosDisponibles: state.session.contexts.map((context) => ({
      tipo: context.tipo,
      id: context.id,
      nombre: context.nombre,
      organizacionId: context.organizacionId,
      rol: context.rol,
      theme: context.tipo === 'Organizacion' ? buildTheme() : null,
      modulosActivos: context.modulosActivos,
      capacidadesEfectivas: context.capacidadesEfectivas,
    })),
  };
}

function buildPersistedAuth(state: MockIdentityState) {
  const snapshot = buildSnapshot(state);
  return {
    state: {
      isAuthenticated: true,
      user: {
        id: snapshot.usuarioId,
        personaId: snapshot.personaId,
        nombre: snapshot.nombreUsuario,
        email: snapshot.email,
        rol: snapshot.rol,
        organizationId: snapshot.organizacionId,
        organizationName: snapshot.nombreOrganizacion,
        contextoActivo: snapshot.contextoActivo,
        contextosDisponibles: snapshot.contextosDisponibles,
      },
      personaId: snapshot.personaId,
      organizationId: snapshot.organizacionId,
    },
    version: 0,
  };
}

function buildPersistedTenant(state: MockIdentityState) {
  const active = getActiveContext(state);
  return {
    state: {
      currentOrganization: active.tipo === 'Organizacion'
        ? {
            id: active.organizacionId,
            name: active.nombre,
            logo: '',
            modulosActivos: active.modulosActivos,
            theme: {
              primary: '#0f766e',
              primaryDark: '#115e59',
              secondary: '#1d4ed8',
            },
          }
        : null,
    },
    version: 0,
  };
}

function buildPagedResponse<T>(items: T[]) {
  return {
    items,
    paginaActual: 1,
    tamanoPagina: 10,
    totalPaginas: 1,
    totalRegistros: items.length,
  };
}

function buildVehiclePositions() {
  return [];
}

function isDataEndpoint(pathname: string): boolean {
  return !pathname.startsWith(`${API_PREFIX}/auth/`);
}

function hasAuthorizationHeader(route: Route): boolean {
  const authHeader = route.request().headers().authorization;
  return Boolean(authHeader && authHeader.startsWith('Bearer '));
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function maybeRejectUnauthorized(route: Route, options: InstallMocksOptions) {
  if (!options.requireAuthorizationOnDataRequests) {
    return false;
  }

  if (hasAuthorizationHeader(route)) {
    return false;
  }

  await fulfillJson(route, 401, {
    code: 'HTTP_401',
    detail: 'HTTP_401',
    status: 401,
  });
  return true;
}

export const sessions = {
  personalPure(): MockSessionDefinition {
    return {
      userId: 'user-personal-e2e',
      personaId: 'persona-personal-e2e',
      email: 'personal@tracauto.test',
      nombreUsuario: 'Valentina Personal',
      activeContextKey: 'Personal:personal',
      contexts: [
        {
          tipo: 'Personal',
          id: null,
          nombre: 'Valentina Personal',
          organizacionId: null,
          rol: null,
          modulosActivos: [MODULO_FLOTA],
          capacidadesEfectivas: ['vehiculos:propios', 'dispositivos:propios'],
        },
      ],
    };
  },

  multiContext(): MockSessionDefinition {
    return {
      userId: 'user-multi-e2e',
      personaId: 'persona-multi-e2e',
      email: 'multi@tracauto.test',
      nombreUsuario: 'Micaela Multi',
      activeContextKey: 'Personal:personal',
      contexts: [
        {
          tipo: 'Personal',
          id: null,
          nombre: 'Micaela Multi',
          organizacionId: null,
          rol: null,
          modulosActivos: [MODULO_FLOTA],
          capacidadesEfectivas: ['vehiculos:propios', 'dispositivos:propios'],
        },
        {
          tipo: 'Organizacion',
          id: 'org-1',
          nombre: 'Acme Fleet',
          organizacionId: 'org-1',
          rol: 'Admin',
          modulosActivos: [MODULO_FLOTA, MODULO_MARKETPLACE],
          capacidadesEfectivas: ['usuarios:gestionar', 'organizacion:editar'],
        },
      ],
    };
  },

  orgOperator(): MockSessionDefinition {
    return {
      userId: 'user-operator-e2e',
      personaId: 'persona-operator-e2e',
      email: 'operador@tracauto.test',
      nombreUsuario: 'Olivia Operadora',
      activeContextKey: 'Organizacion:org-2',
      contexts: [
        {
          tipo: 'Organizacion',
          id: 'org-2',
          nombre: 'Beta Logistics',
          organizacionId: 'org-2',
          rol: 'Operador',
          modulosActivos: [MODULO_FLOTA],
          capacidadesEfectivas: ['vehiculos:operar'],
        },
      ],
    };
  },
};

export async function seedPersistedSession(page: Page, session: MockSessionDefinition) {
  const state: MockIdentityState = {
    session,
    refreshCount: 0,
    lastReenviarCodigoBody: null,
  };

  await page.addInitScript(({ auth, tenant }) => {
    window.localStorage.setItem('tracauto-auth', JSON.stringify(auth));
    window.localStorage.setItem('tracauto-tenant', JSON.stringify(tenant));
  }, {
    auth: buildPersistedAuth(state),
    tenant: buildPersistedTenant(state),
  });
}

export async function installIdentityMocks(page: Page, options: InstallMocksOptions = {}): Promise<MockApiController> {
  const state: MockIdentityState = {
    session: options.session ?? sessions.personalPure(),
    refreshCount: 0,
    lastReenviarCodigoBody: null,
  };

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (!pathname.includes(`${API_PREFIX}/`)) {
      await route.continue();
      return;
    }

    const method = request.method();

    if (pathname === `${API_PREFIX}/auth/login` && method === 'POST') {
      if (options.loginMode === 'not-verified') {
        await fulfillJson(route, 401, {
          code: 'Auth.EmailNoVerificado',
          detail: 'Auth.EmailNoVerificado',
          status: 401,
          extensions: {
            emailVerificado: false,
            telefonoVerificado: true,
            usuarioId: state.session.userId,
          },
        });
        return;
      }

      await fulfillJson(route, 200, {
        token: 'access-token-login',
        ...buildSnapshot(state),
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/activar-cuenta/activation-ok` && method === 'GET') {
      await fulfillJson(route, 200, {
        nombre: 'Cuenta Activada E2E',
        email: state.session.email,
        expirada: false,
        cuentaYaActivada: false,
        mensaje: 'Token valido',
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/activar-cuenta` && method === 'POST') {
      await fulfillJson(route, 200, {
        requiereLogin: false,
        mensaje: 'Cuenta activada correctamente.',
        token: 'activation-access-token',
        ...buildSnapshot(state),
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/reenviar-codigo` && method === 'POST') {
      state.lastReenviarCodigoBody = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(route, 200, {
        usuarioId: state.session.userId,
        organizacionId: null,
        nombreOrganizacion: null,
        mensaje: 'Codigo reenviado.',
        enviadoPorEmail: true,
        enviadoPorSms: false,
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/solicitar-reset-password` && method === 'POST') {
      await route.fulfill({ status: 200, body: '' });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/cambiar-contexto` && method === 'POST') {
      const payload = request.postDataJSON() as { tipoContexto: ContextType; contextoId?: string | null };
      const nextKey = `${payload.tipoContexto}:${payload.contextoId ?? 'personal'}`;
      state.session.activeContextKey = nextKey;

      await fulfillJson(route, 200, {
        accessToken: `context-access-token-${nextKey}`,
        ...buildSnapshot(state),
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/refresh` && method === 'POST') {
      state.refreshCount += 1;
      await fulfillJson(route, 200, {
        accessToken: `refresh-access-token-${state.refreshCount}`,
        refreshToken: 'refresh-token-e2e',
        expiresAt: '2030-01-01T00:00:00Z',
        ...buildSnapshot(state),
      });
      return;
    }

    if (pathname === `${API_PREFIX}/auth/logout` && method === 'POST') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (await maybeRejectUnauthorized(route, options)) {
      return;
    }

    if (pathname === `${API_PREFIX}/personal/vehiculos` || pathname === `${API_PREFIX}/vehiculos`) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (pathname === `${API_PREFIX}/personal/dispositivos` || pathname === `${API_PREFIX}/dispositivos`) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (pathname === `${API_PREFIX}/personal/conductores` || pathname === `${API_PREFIX}/conductores`) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (pathname === `${API_PREFIX}/personal/geofences` || pathname === `${API_PREFIX}/geofences`) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (pathname === `${API_PREFIX}/personal/map/positions` || pathname === `${API_PREFIX}/map/positions`) {
      await fulfillJson(route, 200, buildVehiclePositions());
      return;
    }

    if (pathname === `${API_PREFIX}/suscripcion`) {
      const activeContext = getActiveContext(state);
      const isPersonal = activeContext.tipo === 'Personal';
      await fulfillJson(route, 200, isPersonal ? [] : [{
        codigo: MODULO_FLOTA,
        nombre: 'Flota',
        icono: 'car',
        fechaActivacion: '2026-01-10T00:00:00Z',
        activadoPorUsuarioId: state.session.userId,
        notas: null,
        soporteContexto: 'Ambos',
        capacidadesEfectivas: ['tracking', 'fleet'],
      }]);
      return;
    }

    if (pathname === `${API_PREFIX}/suscripcion/modulos`) {
      const activeContext = getActiveContext(state);
      const isPersonal = activeContext.tipo === 'Personal';
      await fulfillJson(route, 200, [
        {
          codigo: MODULO_FLOTA,
          nombre: 'Flota',
          descripcion: 'Seguimiento operativo de activos.',
          orden: 1,
          esBase: false,
          esGratis: isPersonal,
          estaActivo: true,
          fechaActivacion: '2026-01-10T00:00:00Z',
          cumplePrerequisitos: true,
          prerequisitosFaltantes: [],
          soporteContexto: 'Ambos',
          esOperativo: true,
          puedeGestionarse: !isPersonal,
          puedeActivarse: !isPersonal,
          capacidadesEfectivas: ['tracking', 'fleet'],
        },
        {
          codigo: MODULO_MARKETPLACE,
          nombre: 'Marketplace',
          descripcion: 'Publicaciones y catálogo comercial.',
          orden: 2,
          esBase: false,
          esGratis: false,
          estaActivo: activeContext.modulosActivos.includes(MODULO_MARKETPLACE),
          fechaActivacion: null,
          cumplePrerequisitos: true,
          prerequisitosFaltantes: [],
          soporteContexto: 'Organizacion',
          esOperativo: activeContext.tipo === 'Organizacion',
          puedeGestionarse: activeContext.tipo === 'Organizacion' && ['Admin', 'SuperAdmin'].includes(activeContext.rol ?? ''),
          puedeActivarse: activeContext.tipo === 'Organizacion',
          capacidadesEfectivas: ['marketplace'],
        },
      ]);
      return;
    }

    if (/\/api\/v1\/organizaciones\/[^/]+\/relaciones$/.test(pathname)) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (/\/api\/v1\/organizaciones\/[^/]+\/solicitudes-pendientes$/.test(pathname)) {
      await fulfillJson(route, 200, []);
      return;
    }

    if (/\/api\/v1\/organizaciones\/[^/]+\/usuarios$/.test(pathname)) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (/\/api\/v1\/organizaciones\/[^/]+\/invitaciones$/.test(pathname)) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (pathname === `${API_PREFIX}/marketplace/vehiculos`) {
      await fulfillJson(route, 200, buildPagedResponse([]));
      return;
    }

    if (isDataEndpoint(pathname)) {
      await fulfillJson(route, 200, {});
      return;
    }

    await route.continue();
  });

  return {
    getRefreshCount: () => state.refreshCount,
    getLastReenviarCodigoBody: () => state.lastReenviarCodigoBody,
    setActiveContext: (nextKey: string) => {
      state.session.activeContextKey = nextKey;
    },
    getActiveContext: () => getActiveContext(state),
  };
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderOptions,
  type RenderHookOptions,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

// Import i18n to initialize it for tests
import '@/shared/i18n/config'

/**
 * Creates a fresh QueryClient for each test (no shared state between tests).
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: React.ReactNode
}

function createWrapper(initialEntries: string[] = ['/']) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  return { Wrapper, queryClient }
}

/**
 * Custom render that wraps components with QueryClientProvider + MemoryRouter.
 */
function customRender(
  ui: ReactElement,
  options?: RenderOptions & { initialEntries?: string[] }
) {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {}
  const { Wrapper, queryClient } = createWrapper(initialEntries)

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

/**
 * Custom renderHook that wraps hooks with QueryClientProvider + MemoryRouter.
 */
function customRenderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & { initialEntries?: string[] }
) {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {}
  const { Wrapper, queryClient } = createWrapper(initialEntries)

  return {
    ...renderHook(hook, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Re-export everything from RTL
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
// Override render and renderHook with our custom versions
export { customRender as render, customRenderHook as renderHook }

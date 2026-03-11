import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test detectAppMode by importing and calling it with different window.location.hostname values

describe('detectAppMode', () => {
  beforeEach(() => {
    vi.resetModules()
    // Clear any VITE env overrides
    vi.stubEnv('VITE_APP_MODE', '')
    vi.stubEnv('MODE', '')
  })

  it('returns "marketplace" when hostname starts with "marketplace."', async () => {
    vi.stubGlobal('location', { hostname: 'marketplace.tracauto.com' })
    const { detectAppMode } = await import('@/config/appMode')
    expect(detectAppMode()).toBe('marketplace')
  })

  it('returns "alquiler" when hostname starts with "alquiler."', async () => {
    vi.stubGlobal('location', { hostname: 'alquiler.tracauto.com' })
    const { detectAppMode } = await import('@/config/appMode')
    expect(detectAppMode()).toBe('alquiler')
  })

  it('returns "b2b" for default hostname (localhost)', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    const { detectAppMode } = await import('@/config/appMode')
    expect(detectAppMode()).toBe('b2b')
  })

  it('returns "b2b" for production hostname without subdomain', async () => {
    vi.stubGlobal('location', { hostname: 'tracauto.com' })
    const { detectAppMode } = await import('@/config/appMode')
    expect(detectAppMode()).toBe('b2b')
  })

  it('returns "alquiler" when hostname starts with "alquiler." on different domain', async () => {
    vi.stubGlobal('location', { hostname: 'alquiler.traccarapp.com' })
    const { detectAppMode } = await import('@/config/appMode')
    expect(detectAppMode()).toBe('alquiler')
  })
})

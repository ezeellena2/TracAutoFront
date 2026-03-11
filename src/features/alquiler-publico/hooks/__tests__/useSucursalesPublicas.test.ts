import { renderHook, waitFor } from '@/test/test-utils'
import { useSucursalesPublicas } from '../useSucursalesPublicas'
import { describe, it, expect } from 'vitest'

describe('useSucursalesPublicas', () => {
  it('fetches sucursales and returns data', async () => {
    const { result } = renderHook(() => useSucursalesPublicas())

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.sucursales).toEqual([])

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.sucursales).toHaveLength(2)
    expect(result.current.sucursales[0].nombre).toBe('Casa Central')
    expect(result.current.sucursales[1].nombre).toBe('Sucursal Aeropuerto')
    expect(result.current.error).toBeNull()
  })

  it('returns empty array before data loads', () => {
    const { result } = renderHook(() => useSucursalesPublicas())
    expect(result.current.sucursales).toEqual([])
  })
})

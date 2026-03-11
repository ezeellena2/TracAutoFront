import { renderHook, waitFor } from '@/test/test-utils'
import { useVehiculosDisponibles } from '../useVehiculosDisponibles'
import { describe, it, expect } from 'vitest'
import type { BusquedaParams } from '../../types/busqueda'

const validParams: BusquedaParams = {
  sucursalRecogidaId: 'suc-001',
  fechaHoraRecogida: '2026-03-10T10:00:00Z',
  fechaHoraDevolucion: '2026-03-13T10:00:00Z',
}

describe('useVehiculosDisponibles', () => {
  it('fetches vehicles when params are complete', async () => {
    const { result } = renderHook(() => useVehiculosDisponibles(validParams))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.vehiculos).toHaveLength(2)
    expect(result.current.vehiculos[0].marca).toBe('Toyota')
    expect(result.current.vehiculos[1].marca).toBe('Ford')
  })

  it('does not fetch when params is null (disabled)', () => {
    const { result } = renderHook(() => useVehiculosDisponibles(null))

    // Should not be loading — query is disabled
    expect(result.current.isLoading).toBe(false)
    expect(result.current.vehiculos).toEqual([])
  })

  it('does not fetch when required fields are missing', () => {
    const incompleteParams = {
      sucursalRecogidaId: 'suc-001',
      fechaHoraRecogida: '',
      fechaHoraDevolucion: '',
    } as BusquedaParams

    const { result } = renderHook(() => useVehiculosDisponibles(incompleteParams))

    // enabled condition fails: !!params.fechaHoraRecogida is false
    expect(result.current.isLoading).toBe(false)
    expect(result.current.vehiculos).toEqual([])
  })
})

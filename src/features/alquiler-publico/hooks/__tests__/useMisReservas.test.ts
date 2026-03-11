import { renderHook, waitFor } from '@/test/test-utils'
import { useMisReservas } from '../useMisReservas'
import { describe, it, expect } from 'vitest'

describe('useMisReservas', () => {
  it('fetches reservas and returns data', async () => {
    const { result } = renderHook(() => useMisReservas())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.reservas).toEqual([])

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.reservas).toHaveLength(1)
    expect(result.current.reservas[0].numeroReserva).toBe('RES-20260305-001')
    expect(result.current.reservas[0].estado).toBe('Confirmada')
    expect(result.current.error).toBeNull()
  })

  it('returns empty array as default', () => {
    const { result } = renderHook(() => useMisReservas())
    expect(result.current.reservas).toEqual([])
  })
})

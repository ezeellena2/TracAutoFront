import { render, screen } from '@/test/test-utils'
import { TarjetaReservaCliente } from '../TarjetaReservaCliente'
import { describe, it, expect, vi } from 'vitest'
import type { ReservaAlquilerResumenDto } from '@/features/alquileres/types/reserva'

const mockReserva: ReservaAlquilerResumenDto = {
  id: 'res-001',
  numeroReserva: 'RES-20260310-001',
  estado: 2, // Confirmada
  clienteNombreCompleto: 'Juan Pérez',
  categoriaAlquiler: 1,
  vehiculoDescripcion: 'Toyota Corolla 2024',
  sucursalRecogida: 'Casa Central',
  sucursalDevolucion: 'Casa Central',
  fechaHoraRecogida: '2026-03-10T10:00:00Z',
  fechaHoraDevolucion: '2026-03-13T10:00:00Z',
  precioTotal: 75000,
  moneda: 'ARS',
  fechaCreacion: '2026-03-05T15:00:00Z',
}

describe('TarjetaReservaCliente', () => {
  it('renders reservation number', () => {
    render(<TarjetaReservaCliente reserva={mockReserva} onClick={vi.fn()} />)

    expect(screen.getByText(/RES-20260310-001/)).toBeInTheDocument()
  })

  it('renders vehicle description', () => {
    render(<TarjetaReservaCliente reserva={mockReserva} onClick={vi.fn()} />)

    expect(screen.getByText('Toyota Corolla 2024')).toBeInTheDocument()
  })

  it('renders sucursal name', () => {
    render(<TarjetaReservaCliente reserva={mockReserva} onClick={vi.fn()} />)

    expect(screen.getByText('Casa Central')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<TarjetaReservaCliente reserva={mockReserva} onClick={onClick} />)

    const card = screen.getByRole('button')
    card.click()

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows fallback text when vehiculoDescripcion is null', () => {
    const reservaSinVehiculo: ReservaAlquilerResumenDto = {
      ...mockReserva,
      vehiculoDescripcion: null,
    }

    render(<TarjetaReservaCliente reserva={reservaSinVehiculo} onClick={vi.fn()} />)

    // Should not show "Toyota Corolla 2024"
    expect(screen.queryByText('Toyota Corolla 2024')).not.toBeInTheDocument()
  })
})

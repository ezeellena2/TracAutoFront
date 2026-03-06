import { render, screen } from '@/test/test-utils'
import { CotizacionDesglose } from '../CotizacionDesglose'
import { describe, it, expect } from 'vitest'
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion'

const baseCotizacion: ResultadoCotizacionDto = {
  duracionDias: 3,
  precioBase: 75000,
  detalleTarifa: {
    tarifaId: 't-001',
    nombreTarifa: 'Tarifa Diaria Económico',
    meses: 0,
    precioMes: null,
    semanas: 0,
    precioSemana: null,
    dias: 3,
    precioDia: 25000,
    esFallback: false,
  },
  recargos: [],
  totalRecargos: 0,
  coberturas: [],
  totalCoberturas: 0,
  subtotal: 75000,
  promocion: null,
  descuento: 0,
  impuestosEstimados: null,
  precioTotal: 75000,
  depositoMinimo: 50000,
  moneda: 'ARS',
  usaFallbackVehiculo: false,
}

describe('CotizacionDesglose', () => {
  it('renders tariff name and base price', () => {
    render(<CotizacionDesglose cotizacion={baseCotizacion} />)

    expect(screen.getByText('Tarifa Diaria Económico')).toBeInTheDocument()
  })

  it('renders total price', () => {
    render(<CotizacionDesglose cotizacion={baseCotizacion} />)

    // The total should be displayed (formatted currency)
    const totalElements = screen.getAllByText(/75[.,]000/)
    expect(totalElements.length).toBeGreaterThan(0)
  })

  it('renders deposit when depositoMinimo > 0', () => {
    render(<CotizacionDesglose cotizacion={baseCotizacion} />)

    // Should show the deposit amount
    expect(screen.getByText(/50[.,]000/)).toBeInTheDocument()
  })

  it('renders recargos when present', () => {
    const cotizacionConRecargos: ResultadoCotizacionDto = {
      ...baseCotizacion,
      recargos: [
        {
          recargoId: 'r-001',
          nombre: 'GPS',
          tipoRecargo: 1,
          obligatorio: false,
          monto: 9000,
          detalleCalculo: null,
        },
      ],
      totalRecargos: 9000,
      subtotal: 84000,
      precioTotal: 84000,
    }

    render(<CotizacionDesglose cotizacion={cotizacionConRecargos} />)

    expect(screen.getByText('GPS')).toBeInTheDocument()
  })

  it('renders coberturas when present', () => {
    const cotizacionConCoberturas: ResultadoCotizacionDto = {
      ...baseCotizacion,
      coberturas: [
        {
          coberturaId: 'c-001',
          nombre: 'CDW - Colisión',
          obligatoria: false,
          precioPorDia: 5000,
          dias: 3,
          monto: 15000,
        },
      ],
      totalCoberturas: 15000,
      subtotal: 90000,
      precioTotal: 90000,
    }

    render(<CotizacionDesglose cotizacion={cotizacionConCoberturas} />)

    expect(screen.getByText('CDW - Colisión')).toBeInTheDocument()
  })

  it('renders promotion discount when present', () => {
    const cotizacionConPromo: ResultadoCotizacionDto = {
      ...baseCotizacion,
      promocion: {
        promocionId: 'p-001',
        codigo: 'BIENVENIDO',
        tipoDescuento: 1,
        valorDescuento: 15,
        descuentoCalculado: 11250,
      },
      descuento: 11250,
      precioTotal: 63750,
    }

    render(<CotizacionDesglose cotizacion={cotizacionConPromo} />)

    expect(screen.getByText(/BIENVENIDO/)).toBeInTheDocument()
  })

  it('does not render recargos section when empty', () => {
    render(<CotizacionDesglose cotizacion={baseCotizacion} />)

    // GPS should not appear
    expect(screen.queryByText('GPS')).not.toBeInTheDocument()
  })
})

import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { validarImagen, validarLoteImagenes, comprimirImagen, MAX_FOTOS } from '@/shared/utils/imageUtils';
import type { FotoInspeccionDto } from '../types/reserva';

interface FotoInspeccionProps {
  fotos: File[];
  fotosExistentes?: FotoInspeccionDto[];
  onChange: (fotos: File[]) => void;
  maxFotos?: number;
  disabled?: boolean;
}

interface PreviewItem {
  file: File;
  url: string;
}

export function FotoInspeccion({
  fotos,
  fotosExistentes = [],
  onChange,
  maxFotos = MAX_FOTOS,
  disabled = false,
}: FotoInspeccionProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar previews cuando cambian las fotos
  useEffect(() => {
    const nuevasPreviews = fotos.map(file => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(nuevasPreviews);

    return () => {
      nuevasPreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [fotos]);

  const totalFotos = fotosExistentes.length + fotos.length;
  const puedeAgregar = totalFotos < maxFotos && !disabled;

  const procesarArchivos = useCallback(async (archivos: File[]) => {
    setError(null);

    // Validar tipos individuales
    for (const archivo of archivos) {
      const errorTipo = validarImagen(archivo);
      if (errorTipo) {
        setError(t(errorTipo));
        return;
      }
    }

    // Validar lote
    const errorLote = validarLoteImagenes(archivos, totalFotos);
    if (errorLote) {
      setError(t(errorLote, { max: maxFotos }));
      return;
    }

    // Comprimir
    setIsCompressing(true);
    try {
      const comprimidas = await Promise.all(archivos.map(comprimirImagen));
      onChange([...fotos, ...comprimidas]);
    } catch {
      setError(t('alquileres.reservaDetalle.fotos.errorCompresion'));
    } finally {
      setIsCompressing(false);
    }
  }, [fotos, totalFotos, maxFotos, onChange, t]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (puedeAgregar) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!puedeAgregar) return;

    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length > 0) procesarArchivos(archivos);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    if (archivos.length > 0) procesarArchivos(archivos);
    e.target.value = '';
  };

  const handleSelectClick = () => {
    if (puedeAgregar && !isCompressing) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (index: number) => {
    const nuevas = fotos.filter((_, i) => i !== index);
    onChange(nuevas);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text">
          {t('alquileres.reservaDetalle.fotos.titulo')}
        </label>
        <span className="text-xs text-text-muted">
          {t('alquileres.reservaDetalle.fotos.contador', { actual: totalFotos, max: maxFotos })}
        </span>
      </div>

      {/* Zona drag & drop */}
      {puedeAgregar && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleSelectClick}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-sm text-text-muted">
                {t('alquileres.reservaDetalle.fotos.comprimiendo')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-text-muted" />
              <p className="text-sm text-text">
                {t('alquileres.reservaDetalle.fotos.arrastrar')}
              </p>
              <p className="text-xs text-text-muted">
                {t('alquileres.reservaDetalle.fotos.oSeleccionar')}
              </p>
              <p className="text-xs text-text-muted">
                {t('alquileres.reservaDetalle.fotos.formatos')}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isCompressing}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Grid de thumbnails */}
      {(fotosExistentes.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-5 gap-2">
          {/* Fotos existentes (read-only) */}
          {fotosExistentes.map(foto => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={foto.url}
                alt={foto.descripcion ?? ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                {t('alquileres.reservaDetalle.fotos.subida')}
              </span>
            </div>
          ))}

          {/* Fotos nuevas (con botón eliminar) */}
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={preview.url}
                alt=""
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Placeholder si puede agregar más */}
          {puedeAgregar && !isCompressing && previews.length > 0 && (
            <button
              type="button"
              onClick={handleSelectClick}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <ImageIcon size={20} className="text-text-muted" />
              <span className="text-[10px] text-text-muted">+</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

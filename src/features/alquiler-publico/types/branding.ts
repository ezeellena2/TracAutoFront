// DTO alineado con futuro endpoint público GET /api/public/v1/alquiler/branding
export interface BrandingPublicoDto {
  organizacionNombre: string;
  logoUrl: string | null;
  primary: string | null;
  primaryDark: string | null;
  secondary: string | null;
}

# TracAutoFront

Frontend React para la plataforma TracAuto - Sistema de Gestión Telemática B2B.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build producción
npm run build
```

## ⚙️ Variables de Entorno

Crear archivo `.env.local`:

```env
# API Backend URL
VITE_API_BASE_URL=http://localhost:5200/api

# Modo mock (solo desarrollo)
VITE_USE_MOCKS=false
```

**Producción:**

```env
VITE_API_BASE_URL=https://api.tracauto.com/api
```

## 🏗️ Build para Producción

```bash
npm run build
```

Genera carpeta `dist/` lista para deploy.

## 📦 Deploy Options

### Opción 1: AWS S3 + CloudFront (Recomendado)

```bash
# Build
npm run build

# Subir a S3
aws s3 sync dist/ s3://tracauto-frontend --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
```

### Opción 2: Nginx (Docker/EC2)

```nginx
server {
    listen 80;
    server_name tracauto.com;
    root /var/www/tracauto;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
    }
}
```

### Opción 3: Vercel/Netlify

1. Conectar repo GitHub
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_BASE_URL`

## 📁 Estructura del Proyecto

```
src/
├── features/           # Módulos por funcionalidad
│   ├── auth/          # Login, Registro, Verificación
│   ├── dashboard/     # Panel principal
│   └── ...
├── shared/            # Componentes compartidos
├── services/          # API calls
├── store/             # Estado global (Zustand)
└── styles/            # CSS global
```

## 🔐 Autenticación

El frontend soporta:

- ✅ Login con email/password
- ✅ Registro de empresa
- ✅ Verificación por email (AWS SES)
- ✅ Verificación por SMS (AWS SNS)
- 🔜 Login con Google OAuth

## 📝 Scripts Disponibles

| Comando           | Descripción                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Servidor desarrollo (port 5173) |
| `npm run build`   | Build producción                |
| `npm run preview` | Preview build local             |
| `npm run lint`    | Linter ESLint                   |

## 🔗 Repositorios Relacionados

- **Backend**: [TracAuto](https://github.com/Team-Devs-Track-Auto/TracAuto)
- **Frontend**: Este repositorio

---

© 2024 TracAuto - Sistema B2B para Aseguradoras

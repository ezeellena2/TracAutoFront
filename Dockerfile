# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar cÃ³digo fuente
COPY . .

# Build arguments (se pasan en build time)
ARG VITE_API_BASE_URL=http://localhost:5200/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# No se setea VITE_APP_MODE en build â€” la detecciÃ³n es por hostname en runtime.
# Un solo build sirve los subdominios vigentes.

# Build de producciÃ³n
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build a nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuraciÃ³n nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]


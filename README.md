# Wedding Backend

API del backend de la boda (Express + Prisma + PostgreSQL).

## Requisitos

- **Node.js** ≥ 18.18 (recomendado: `nvm use 18` o `nvm use 20`)
- **PostgreSQL** en ejecución (puerto 5432 por defecto)

## Configuración

1. Crea un archivo `.env` en la raíz del backend con:

   ```env
   DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/wedding"
   ```

   Sustituye `USUARIO` y `PASSWORD` por tu usuario y contraseña de PostgreSQL.

2. Crea la base de datos en PostgreSQL (solo la primera vez):

   ```bash
   createdb wedding
   ```

   O desde `psql`: `CREATE DATABASE wedding;`

## Recrear la base de datos

Con PostgreSQL **en marcha**:

```bash
npm run db:reset
```

Esto borra la base de datos, la vuelve a crear y aplica todas las migraciones.

Alternativas:

- `npm run db:generate` — solo genera el cliente de Prisma
- `npm run db:migrate` — aplica migraciones sin borrar datos

## Arrancar el servidor

```bash
npm run dev
```

El API quedará en `http://localhost:3000` (o el `PORT` que definas en `.env`).

## Cómo levantar PostgreSQL (macOS)

- **Homebrew**: `brew services start postgresql@14` (o la versión que tengas)
- **Postgres.app**: abre la app y inicia el servidor
- **Docker**: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`

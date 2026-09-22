# J.L. Pinto — sitio estático (Astro)

Sitio literario en español para J.L. Pinto: contenido en Markdown, búsqueda estática con Pagefind y despliegue en Cloudflare Pages. No requiere backend.

## Requisitos

- Node.js 18+
- npm

## Scripts npm

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera `dist/` (Astro) y reconstruye el índice Pagefind |
| `npm run preview` | Sirve la build de producción localmente |
| `npm run audit:content` | Valida frontmatter, recuentos, spam bloqueado y assets |
| `npm run import:wordpress` | Importa contenido desde el WordPress en vivo (ver abajo) |
| `npm run generate:redirects` | Regenera `public/_redirects` desde `legacyUrl` en el contenido |
| `npx astro check` | Comprobación TypeScript y de contenido Astro |

El script `build` ejecuta `astro build && pagefind --source dist`. Pagefind indexa el HTML generado y escribe `dist/pagefind/`; la página `/buscar/` carga esa UI en tiempo de ejecución. **Cada build de producción debe usar `npm run build` completo**, no solo `astro build`.

## Añadir contenido

Las colecciones viven en `src/content/`:

| Carpeta | Ruta pública | Campos extra (opcionales) |
|---------|--------------|---------------------------|
| `articles/` | `/articulos/[slug]/` | — |
| `novels/` | `/novelas/[slug]/` | `publishedYear`, `purchaseUrl`, `awards` |
| `plays/` | `/teatro/[slug]/` | `performanceDate`, `awards`, `downloadUrl` |
| `proclamations/` | `/pregones/[slug]/` | `eventDate`, `downloadUrl` |

El **slug** es el nombre del archivo sin `.md` (por ejemplo `mi-articulo.md` → `/articulos/mi-articulo/`).

Campos habituales en el frontmatter:

```yaml
---
title: Título
summary: Resumen breve
publishedDate: 2024-09-22
featured: false
legacyUrl: https://jlpinto.com/ruta-antigua/
---
```

- `draft: true` excluye la entrada de listados y builds públicos si el esquema lo activa.
- Imágenes y PDFs: colócalos en `public/assets/` y enlázalos como `/assets/...` en el Markdown.
- Tras añadir o cambiar entradas con `legacyUrl`, ejecuta `npm run generate:redirects` antes del build.

## Migración desde WordPress

El importador (`scripts/import-wordpress.mjs`) rastrea las categorías legítimas en `jlpinto.com`, convierte HTML a Markdown, descarga medios del mismo origen y filtra casino/spam.

```bash
npm run import:wordpress
npm run audit:content
npm run generate:redirects
npm run build
```

**Inventario actual:** **78 artículos**, 5 novelas, 8 obras y 4 pregones (103 páginas de contenido). Tras cambios de slug o import, ejecuta `npm run audit:content`, `npm run generate:redirects` y `npm run build`.

## Redirecciones (Cloudflare Pages)

`public/_redirects` se copia a `dist/_redirects`. Cloudflare Pages aplica estas reglas automáticamente (301/200). Regenera el archivo con `npm run generate:redirects` cuando cambien slugs o `legacyUrl`.

## Despliegue en Cloudflare Pages

1. Conecta el repositorio (o sube `dist/` manualmente).
2. **Build command:** `npm run build`
3. **Build output directory:** `dist`
4. **Node version:** 18 o superior (variable de entorno `NODE_VERSION=18` si hace falta).
5. El dominio `jlpinto.com` y el DNS son un paso aparte; este repo solo deja la build lista.

Artefactos que debe contener `dist/` tras un build correcto: `pagefind/`, `sitemap.xml`, `rss.xml`, `_redirects`, y rutas como `buscar/`, `articulos/`, etc.

## Desarrollo local

```bash
npm install
npm run dev
```

Para probar la build de producción (incluida búsqueda Pagefind):

```bash
npm run build
npm run preview
```

## Estructura breve

```
src/content/       # Markdown por colección
src/pages/         # Rutas Astro
src/components/    # Navegación, tarjetas, meta SEO
public/            # Assets estáticos, _redirects, robots.txt
scripts/           # import-wordpress, audit-content, generate-redirects
dist/              # Salida de build (no commitear)
```

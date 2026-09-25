# santiagojojoa.com

Portafolio de **Santiago Jojoa** — ingeniero de sistemas, desarrollador de software, consultor y apasionado por la ciberseguridad.

Una sola página continua, bilingüe (`/es` y `/en`), con estética tipo Apple (vidrio líquido) y animaciones guiadas por el scroll. Incluye un **analizador de seguridad web** que se ejecuta en la propia página.

## Stack

| Área | Tecnología |
|---|---|
| Framework | [Astro](https://astro.build) 7 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Animación | GSAP + ScrollTrigger, Lenis (scroll suave) |
| i18n | Enrutado nativo de Astro (`es` por defecto, `en`) |
| Servidor | Función serverless solo para `/api/analyze`; el resto es estático |
| Hosting | Vercel |

## Cómo se construyó (decisiones)

- **Vidrio sin `backdrop-filter`.** El efecto de cristal se hace con gradientes, bordes y sombras. El desenfoque en vivo provocaba artefactos de renderizado en Chrome con el backend Skia Graphite, así que se evita para que se vea igual en cualquier equipo.
- **Sin `position: fixed`.** Los fijados usan `position: sticky` (menú, texto de "Sobre mí", scroll horizontal de proyectos).
- **Accesible.** Con `prefers-reduced-motion` o sin JavaScript todo el contenido es visible y no hay animaciones.
- **Textos separados del código.** Todo el contenido vive en `src/i18n/es.ts` y `en.ts`.

## Analizador de seguridad web

Escribes la dirección de un sitio y devuelve una nota (A+ a F) según sus cabeceras de seguridad, cookies y TLS, con qué corregir y por qué importa.

**Es un análisis pasivo:** una petición `GET` normal para leer cabeceras y certificado. No escanea puertos ni prueba vulnerabilidades. No guarda direcciones ni resultados.

Como el servidor hace peticiones a una dirección que escribe el usuario, está diseñado contra **SSRF**:

- Bloquea IPs privadas y reservadas (loopback, redes privadas, `169.254.169.254`, CGNAT, multicast, etc.) y los formatos alternativos de escribir `127.0.0.1`.
- Resuelve el DNS, rechaza si **alguna** IP es interna y **conecta a la IP ya validada** (sin segunda resolución: no hay ventana para DNS rebinding). También atrapa dominios públicos que apuntan a IPs internas.
- Revalida esquema, puerto y host en **cada redirección** (máximo 5).
- Solo puertos 80 y 443, sin credenciales en la URL, con límites de tiempo y tamaño.
- Comprobación de origen, límite de peticiones por IP y por sitio objetivo.
- Los valores que vienen del sitio analizado se pintan como texto, nunca como HTML, y los valores de las cookies nunca se copian al resultado.

> El límite de peticiones vive en memoria de cada instancia serverless: es una primera defensa. En producción conviene añadir además una regla en el Firewall de Vercel.

Código en [`src/lib/analyzer`](src/lib/analyzer) y endpoint en [`src/pages/api/analyze.ts`](src/pages/api/analyze.ts).

## Desarrollo

Requiere Node ≥ 22.12 y [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # genera .vercel/output
pnpm test       # pruebas del analizador (node:test)
```

Las pruebas cubren el bloqueo SSRF (incluido DNS real), la validación de URLs, las reglas de evaluación y la puntuación. Algunas usan red (`example.com`, `localtest.me`).

## Estructura

```
src/
├── components/   sections/ (Hero, About, Services, Stack, Projects, Security…) y ui/
├── i18n/         es.ts, en.ts, utils.ts
├── lib/analyzer/ núcleo del analizador + pruebas
├── pages/        es/, en/ y api/analyze.ts
├── scripts/      Lenis y animaciones GSAP (una por sección)
└── styles/       tokens de diseño, vidrio y estados de animación
```

## Despliegue

Pensado para Vercel (`@astrojs/vercel`). [`vercel.json`](vercel.json) define las cabeceras de seguridad, incluida una CSP con el hash del único script en línea. Si se modifica ese script (`is:inline` en `Base.astro`), hay que recalcular el hash.

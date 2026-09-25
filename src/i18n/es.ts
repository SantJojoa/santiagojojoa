export const es = {
    meta: {
        title: "Santiago Jojoa — Ingeniero de Sistemas",
        description:
            "Portafolio de Santiago Jojoa: ingeniero de sistemas, desarrollador de software, consultor y apasionado por la ciberseguridad.",
    },
    nav: {
        label: "Navegación principal",
        about: "Sobre mí",
        services: "Servicios",
        projects: "Proyectos",
        security: "Ciberseguridad",
        contact: "Contacto",
        language: "Idioma",
        openMenu: "Abrir menú",
        closeMenu: "Cerrar menú",
    },
    hero: {
        eyebrow: "Santiago Jojoa · Ingeniero de Sistemas",
        lines: ["Software.", "Consultoría.", "Ciberseguridad."],
        ctaGithub: "Ver mi GitHub",
        ctaLinkedin: "Ver mi LinkedIn",
        scroll: "Desliza para explorar",
    },
    about: {
        eyebrow: "Sobre mí",
        statement:
            "Soy ingeniero de sistemas y desarrollador de software. Construyo productos web modernos, acompaño a equipos como consultor y estudio la seguridad ofensiva y defensiva para que todo lo que se construye, resista. Además, manejo el inglés con buen nivel.",
    },
    services: {
        eyebrow: "Servicios",
        title: "Lo que hago.",
        items: [
            {
                title: "Desarrollo de software",
                description:
                    "Aplicaciones web y sistemas a la medida: rápidos, mantenibles y bien diseñados, de la idea a producción.",
            },
            {
                title: "Consultoría",
                description:
                    "Arquitectura, revisión técnica y acompañamiento para tomar mejores decisiones de tecnología.",
            },
            {
                title: "Ciberseguridad",
                description:
                    "Revisión de superficie de ataque, buenas prácticas y hardening de aplicaciones y sitios web.",
            },
        ],
    },
    projects: {
        eyebrow: "Proyectos",
        title: "Trabajo destacado.",
        visit: "Ver sitio",
        inProgress: "En desarrollo",
        items: [
            {
                tag: "IDSN",
                title: "FEVRIPS · IDSN",
                description: "Sistema RIPS del Instituto Departamental de Salud de Nariño.",
                url: "https://fevrips.idsn.gov.co/",
            },
            {
                tag: "IDSN",
                title: "SIVAT · IDSN",
                description: "Sistema web del IDSN con acceso mediante inicio de sesión.",
                url: "https://sivat.idsn.gov.co/login",
            },
            {
                tag: "Sitio web",
                title: "Rastreo Satelital",
                description: "Sitio de Sistemas Virtuales: servicios de rastreo GPS y monitoreo vehicular.",
                url: "https://rastreosatelital.vercel.app",
            },
            {
                tag: "E-commerce",
                title: "Store21",
                description: "Tienda en línea de streetwear con catálogo, carrito y compra por WhatsApp.",
                url: "https://store21.shop",
            },
            {
                tag: "App",
                title: "Max — Finance App",
                description: "Aplicación de finanzas personales.",
                url: "",
            },
        ],
    },
    security: {
        eyebrow: "Ciberseguridad",
        title: "Seguridad como parte del diseño.",
        body: "Práctica y herramientas propias para entender cómo se ataca un sistema y cómo se defiende.",
    },
    stack: {
        eyebrow: "Herramientas",
        title: "Con qué trabajo.",
        groups: [
            {
                title: "Desarrollo",
                items: ["TypeScript", "React", "Astro", "NestJS", "Tailwind CSS", "Node.js", "Python", "SQL"],
            },
            {
                title: "Seguridad",
                items: ["Burp Suite", "Nmap", "Wireshark", "OWASP", "Kali Linux"],
            },
            {
                title: "Infraestructura",
                items: ["Linux", "Docker", "Git", "GitHub Actions", "Vercel"],
            },
        ],
    },
    contact: {
        eyebrow: "Contacto",
        title: "Hablemos.",
        body: "¿Tienes un proyecto, necesitas una consultoría o una revisión de seguridad? Escríbeme.",
        cta: "Escríbeme",
        email: "santiago.jojoan@icloud.com",
    },
    analyzer: {
        form: {
            label: "Dirección del sitio",
            placeholder: "ejemplo.com",
            submit: "Analizar",
            submitting: "Analizando…",
        },
        notice:
            "Análisis pasivo: se hace una petición GET normal para leer las cabeceras públicas de respuesta y el certificado. No se escanean puertos ni se prueban vulnerabilidades. Úsalo en sitios propios o con permiso de su responsable.",
        privacy:
            "No guardo las direcciones ni los resultados en ninguna base de datos.",
        results: {
            title: "Resultado",
            score: "Puntuación",
            outOf: "de 100",
            analyzed: "Dirección analizada",
            httpStatus: "Respuesta HTTP",
            redirects: "Redirecciones",
            duration: "Duración",
            tls: "TLS",
            daysLeft: "días de validez",
            issuer: "Emisor",
            noTls: "Sin cifrado",
            statusLabels: { pass: "Correcto", warn: "Mejorable", fail: "Riesgo", info: "Información" },
            why: "Por qué importa",
            fix: "Cómo corregirlo",
            rawHeaders: "Cabeceras detectadas",
            noHeaders: "No se encontraron cabeceras de seguridad.",
            cookies: "Cookies",
            cookieFlags: "Secure · HttpOnly · SameSite",
            analyzeAnother: "Analizar otro sitio",
            disclaimer:
                "La nota es orientativa: mide la configuración visible desde fuera con una sola petición, no reemplaza una auditoría de seguridad.",
            categories: {
                transport: "Transporte y HTTPS",
                headers: "Cabeceras de seguridad",
                cookies: "Cookies",
                disclosure: "Información expuesta",
                other: "Otros",
            },
            grades: {
                "A+": "Excelente",
                A: "Muy buena",
                B: "Buena",
                C: "Mejorable",
                D: "Deficiente",
                F: "Crítica",
            },
        },
        errors: {
            invalid_url: "La dirección no es válida. Escribe algo como ejemplo.com o https://ejemplo.com.",
            unsupported_protocol: "Solo se admiten direcciones http:// y https://.",
            unsupported_port: "Solo se analizan los puertos web estándar (80 y 443).",
            blocked_host: "Esa dirección apunta a una red interna o reservada y no se puede analizar.",
            dns_failed: "No se pudo resolver el dominio. Revisa que esté bien escrito.",
            connect_failed: "No se pudo conectar con el sitio.",
            timeout: "El sitio tardó demasiado en responder.",
            too_many_redirects: "El sitio redirige demasiadas veces.",
            rate_limited: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
            forbidden_origin: "Solicitud no permitida.",
            bad_request: "No se pudo procesar la solicitud.",
            payload_too_large: "No se pudo procesar la solicitud.",
            internal: "Ocurrió un error inesperado. Inténtalo de nuevo más tarde.",
            network: "No se pudo contactar con el servidor de análisis.",
        },
        codes: {
            absent: "No presente",
            "plain-http": "El sitio final se sirve por HTTP",
            downgrade: "Redirige de HTTPS a HTTP",
            "serves-plain-http": "Sirve contenido por HTTP sin redirigir",
            "port-80-closed": "Puerto 80 cerrado (no hay redirección)",
            "include-subdomains": "incluye subdominios",
            preload: "preload",
            "short-max-age": "max-age demasiado corto (< 180 días)",
            "no-tls": "Sin conexión TLS",
            "legacy-tls": "Versión de TLS obsoleta",
            "invalid-cert": "Certificado no válido",
            "expiring-soon": "Caduca pronto",
            "report-only": "Solo en modo informe: no bloquea nada",
            "weak-value": "Valor débil o no estándar",
            "leaky-value": "Valor que filtra la URL completa",
            "no-corp": "Falta CORP",
            "no-coop": "Falta COOP",
            "no-cookies": "El sitio no establece cookies en esta petición",
            "version-exposed": "Expone la versión",
            exposed: "Expone la tecnología",
            "wildcard-credentials": "Comodín (*) junto con credenciales",
            wildcard: "Comodín (*): normal en contenido público",
            "no-script-src": "Sin restricción de scripts",
            "unsafe-inline": "Permite scripts inline ('unsafe-inline')",
            "unsafe-eval": "Permite eval ('unsafe-eval')",
            "wildcard-source": "Fuentes de script demasiado amplias (*, http:, data:)",
            "object-src-open": "object-src sin restringir",
            "no-base-uri": "Falta base-uri",
        },
        findings: {
            https: {
                title: "Conexión cifrada (HTTPS)",
                why: "Sin HTTPS, cualquiera en la red (Wi-Fi público, un proveedor) puede leer o modificar lo que viaja entre el visitante y el sitio, incluidas contraseñas y sesiones.",
                fix: "Sirve todo el sitio por HTTPS con un certificado válido (por ejemplo, Let's Encrypt) y evita redirigir de HTTPS a HTTP.",
            },
            http_redirect: {
                title: "Redirección de HTTP a HTTPS",
                why: "Si alguien entra por http:// y el sitio no lo redirige, esa primera petición viaja sin cifrar y puede ser interceptada o manipulada.",
                fix: "Configura el servidor para responder a HTTP con una redirección 301 a la versión HTTPS.",
            },
            hsts: {
                title: "HSTS (Strict-Transport-Security)",
                why: "Indica al navegador que use siempre HTTPS con este sitio, lo que evita ataques de degradación (SSL stripping) en visitas posteriores.",
                fix: "Añade Strict-Transport-Security: max-age=31536000; includeSubDomains (y valora preload) cuando todo el sitio funcione por HTTPS.",
            },
            tls_version: {
                title: "Versión de TLS",
                why: "Las versiones antiguas (TLS 1.0 y 1.1) tienen debilidades conocidas y los navegadores modernos ya las rechazan. Aquí solo se ve la versión negociada, no todas las que acepta el servidor.",
                fix: "Habilita TLS 1.2 y 1.3 y desactiva las anteriores en el servidor o CDN.",
            },
            certificate: {
                title: "Certificado TLS",
                why: "Un certificado inválido o caducado hace que el navegador muestre advertencias y habitúa a los usuarios a ignorarlas.",
                fix: "Renueva el certificado antes de que caduque (automatiza la renovación) y comprueba que cubra el dominio y la cadena completa.",
            },
            csp: {
                title: "Content-Security-Policy",
                why: "Limita qué scripts y recursos puede cargar la página; es la defensa más fuerte contra XSS (inyección de código).",
                fix: "Define una política que restrinja script-src (idealmente con nonces o hashes), incluya object-src 'none' y base-uri 'self', y evite 'unsafe-inline' y 'unsafe-eval'. Pruébala antes con Content-Security-Policy-Report-Only.",
            },
            frame_protection: {
                title: "Protección contra clickjacking",
                why: "Sin ella, otro sitio puede incrustar esta página en un iframe invisible y engañar al usuario para que haga clic en botones sin saberlo.",
                fix: "Añade Content-Security-Policy: frame-ancestors 'none' (o 'self'), o X-Frame-Options: DENY / SAMEORIGIN.",
            },
            nosniff: {
                title: "X-Content-Type-Options",
                why: "Evita que el navegador «adivine» el tipo de un archivo, lo que puede convertir una subida inocente en código ejecutable.",
                fix: "Añade X-Content-Type-Options: nosniff.",
            },
            referrer_policy: {
                title: "Referrer-Policy",
                why: "Controla cuánta información de la URL de origen se envía a otros sitios; las URLs con tokens o datos personales pueden filtrarse.",
                fix: "Usa Referrer-Policy: strict-origin-when-cross-origin o una más restrictiva.",
            },
            permissions_policy: {
                title: "Permissions-Policy",
                why: "Permite desactivar funciones del navegador (cámara, micrófono, geolocalización…) que la página no necesita, reduciendo el daño si se inyecta código.",
                fix: "Añade una política que desactive lo que no uses, por ejemplo Permissions-Policy: camera=(), microphone=(), geolocation=().",
            },
            cross_origin: {
                title: "Aislamiento entre orígenes (COOP / CORP)",
                why: "Ayudan a aislar la página de otras ventanas y sitios, mitigando ataques de canal lateral como Spectre y filtraciones entre pestañas.",
                fix: "Añade Cross-Origin-Opener-Policy: same-origin y Cross-Origin-Resource-Policy: same-origin (o same-site), comprobando que no rompan integraciones como pagos o ventanas emergentes.",
            },
            cookies: {
                title: "Cookies seguras",
                why: "Sin Secure viajan por HTTP; sin HttpOnly un script inyectado puede robarlas; sin SameSite son más vulnerables a CSRF.",
                fix: "Marca las cookies de sesión con Secure; HttpOnly; SameSite=Lax (o Strict) y usa el prefijo __Host- cuando sea posible.",
            },
            server_header: {
                title: "Cabecera Server",
                why: "Publicar el software y su versión exacta ayuda a un atacante a buscar vulnerabilidades conocidas de esa versión.",
                fix: "Oculta o reduce la cabecera Server (por ejemplo, server_tokens off en Nginx o ServerTokens Prod en Apache).",
            },
            tech_disclosure: {
                title: "Tecnología expuesta",
                why: "Cabeceras como X-Powered-By revelan el lenguaje o framework y su versión, facilitando ataques dirigidos.",
                fix: "Elimina X-Powered-By, X-AspNet-Version y similares en la configuración del framework o del servidor.",
            },
            security_txt: {
                title: "security.txt",
                why: "Es un archivo estándar (RFC 9116) que indica a los investigadores cómo reportar vulnerabilidades de forma responsable.",
                fix: "Publica /.well-known/security.txt con al menos un campo Contact: y otro Expires:.",
            },
            cors: {
                title: "CORS (Access-Control-Allow-Origin)",
                why: "Un comodín * junto con credenciales, o reflejar cualquier origen, puede permitir que otros sitios lean respuestas autenticadas.",
                fix: "Permite solo orígenes concretos de confianza y evita Access-Control-Allow-Origin: * junto con Access-Control-Allow-Credentials: true.",
            },
        },
    },
    footer: {
        rights: "Todos los derechos reservados.",
    },
};

export type Dictionary = typeof es;

![Logo de MinData](public/mindata-logo.png)

# RIU Frontend | Gestión de Súper Héroes

Aplicación SPA con Angular 21, TypeScript, RxJS y Angular Material, desarrollada como challenge frontend para administrar una colección de súper héroes. Incluye búsqueda, paginación, alta, edición y eliminación, con una interfaz adaptable a escritorio, tablet y móvil y una paleta inspirada en el logo de MinData.

## Demo

<video controls preload="metadata" width="100%">
  <source src="docs/media/hero-crud-demo.mp4" type="video/mp4">
  Tu navegador no puede reproducir este video. [Ver demo](docs/media/hero-crud-demo.mp4).
</video>

## Funcionalidades

- Listado inicial de 10 héroes y paginación configurable de 5, 10 o 20 elementos.
- Búsqueda por nombre o alias.
- Alta, consulta, edición y eliminación con confirmación.
- Formularios reactivos con validaciones y mensajes de error.
- Directiva `appUppercase` para ingresar el alias en mayúsculas.
- Vistas de tabla en pantallas amplias y tarjetas en móvil.
- Navegación mediante rutas lazy-loaded.
- Estados de carga, error, reintento y lista vacía.

## Arquitectura y criterios de calidad

- `src/app/core`: modelos tipados y servicios de dominio.
- `src/app/shared`: directivas y componentes reutilizables.
- `src/app/features/heroes`: páginas standalone para listado y formulario.
- TypeScript estricto y plantillas Angular con comprobación estricta.
- Responsabilidades separadas siguiendo principios SOLID y Clean Code.
- Estado del servicio actualizado de forma inmutable.
- Pruebas unitarias y de integración para servicios, directiva, componentes y flujo CRUD.

## Datos

Los diez héroes iniciales y las operaciones CRUD se administran en memoria mediante `HeroService`. No se necesita backend para ejecutar el challenge. Los cambios se conservan durante la sesión actual de la aplicación y vuelven al conjunto inicial al recargarla.

## Requisitos

- Node.js 20.19 o superior y npm.
- Para ejecutar las pruebas en modo headless: Chrome o Chromium.
- Para ejecutar con contenedor: Docker y Docker Compose.

## Desarrollo local

Instalar dependencias y arrancar Angular:

```bash
npm ci
npm start
```

Abrir [http://localhost:4200](http://localhost:4200).

## Pruebas y build

Ejecutar la suite Jasmine/Karma en Chrome headless:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Crear el bundle de producción:

```bash
npm run build
```

## Docker

Construir la imagen de producción y levantar el frontend:

```bash
docker compose up --build
```

Abrir [http://localhost:8080](http://localhost:8080). La imagen usa una etapa Node para compilar la aplicación y Nginx para servir los archivos estáticos y resolver las rutas de la SPA.

Detener el contenedor:

```bash
docker compose down
```

Docker Compose levanta únicamente el frontend. No configura un backend ni almacenamiento persistente.


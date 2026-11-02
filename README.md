# ObraPlan · Planificador de visitas técnicas

Aplicación web de práctica para planificar visitas de cuatro técnicos a obras de distintos municipios. Está construida con React, TypeScript, Tailwind CSS 4, Vite y Supabase (PostgreSQL).

## Qué incluye

- Alta de visitas indicando técnico, obra, fecha, hora de inicio y duración.
- Validación en PostgreSQL de solapamientos, desplazamiento mínimo y jornada laboral.
- Bloqueo transaccional por técnico para evitar que dos peticiones simultáneas reserven el mismo hueco.
- Cancelación lógica: la visita permanece visible como `Cancelada`, pero deja de bloquear el horario.
- Listado ordenado por fecha y hora, con filtros por técnico y fecha.
- Cuatro técnicos, seis obras y siete visitas ficticias precargadas desde SQL.

## Arranque rápido (objetivo: menos de 10 minutos)

**Requisitos:** Node.js 20.19+ (o 22.12+) y npm. Necesitas un proyecto de Supabase; para esta demo no hace falta instalar Docker ni Supabase CLI.

1. **Clona el repositorio e instala dependencias.**

   ```bash
   git clone https://github.com/TU-USUARIO/planificador-visitas.git
   cd planificador-visitas
   npm install
   ```

2. **Crea un proyecto gratuito en Supabase** desde [supabase.com/dashboard](https://supabase.com/dashboard). Puedes usar uno ya existente.

3. **Crea la base de datos.** En el panel de Supabase abre `SQL Editor` → `New query`. Copia todo el contenido de [`supabase/setup.sql`](supabase/setup.sql), ejecútalo y comprueba que termina sin errores. Este script crea las tablas, índices, políticas RLS, funciones RPC y datos de ejemplo. Para comprobar los registros, ejecuta después [`supabase/verify.sql`](supabase/verify.sql). Para probar las reglas (el script revierte sus datos de prueba), ejecuta [`supabase/test_rules.sql`](supabase/test_rules.sql).

4. **Configura las credenciales públicas del proyecto.** En Supabase abre `Project Settings` → `API` (o `Connect`) y copia la Project URL y la Publishable key. En la raíz del repositorio, crea un archivo `.env` a partir del ejemplo:

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   CMD:

   ```cmd
   copy .env.example .env
   ```

   Edita `.env` y sustituye los valores:

   ```dotenv
   VITE_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
   ```

   En proyectos antiguos de Supabase puedes pegar la `anon` key en esa misma variable. **No pongas nunca la `service_role` key ni una Secret key en el frontend.**

5. **Arranca la aplicación.**

   ```bash
   npm run dev
   ```

   Abre la URL local que indique Vite (normalmente `http://localhost:5173`). Para comprobar también la compilación de producción:

   ```bash
   npm run build
   ```

> El repositorio no contiene `.env`. Cada persona configura su propio proyecto Supabase y sus claves. El archivo está excluido de Git mediante `.gitignore`.

## Publicar el repositorio en GitHub

Crea un repositorio **público y vacío** en GitHub (sin añadir README, licencia ni `.gitignore`, porque ya están en este proyecto). Desde la carpeta raíz del proyecto ejecuta:

```bash
git init
git add .
git commit -m "Initial version"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/planificador-visitas.git
git push -u origin main
```

Antes de hacer `git add`, comprueba que has editado `.env` solo en local: `.gitignore` lo excluye. Puedes verificarlo con `git status --short`.

## Comandos para crear el proyecto desde cero (alternativa)

El repositorio ya contiene estos archivos, por lo que no necesitas repetir este paso al clonarlo. Si quisieras reconstruir el esqueleto manualmente:

```bash
npm create vite@latest planificador-visitas -- --template react-ts
cd planificador-visitas
npm install
npm install @supabase/supabase-js
npm install -D tailwindcss @tailwindcss/vite
```

La integración de Tailwind se hace con el plugin `@tailwindcss/vite` y `@import "tailwindcss"` en `src/index.css`.

## Estructura del repositorio

```text
planificador-visitas/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── .env.example
├── .gitignore
├── README.md
├── supabase/
│   ├── setup.sql          # Esquema, RLS, funciones y datos ficticios
│   ├── verify.sql         # Consultas de comprobación
│   └── test_rules.sql     # Pruebas de humo con rollback
└── src/
    ├── main.tsx           # Entrada React
    ├── App.tsx             # Estado, carga de datos y composición de pantalla
    ├── index.css           # Tailwind y estilos globales
    ├── components/
    │   ├── VisitForm.tsx   # Formulario de programación
    │   └── VisitsTable.tsx # Tabla, estados y cancelación
    ├── lib/
    │   └── supabase.ts     # Cliente Supabase y lectura de variables de entorno
    ├── services/
    │   └── scheduleService.ts # Consultas y llamadas RPC
    ├── types/
    │   └── index.ts        # Tipos de dominio
    └── utils/
        └── date.ts         # Formato de fecha y hora local
```

## Modelo de datos y reglas

- `technicians`: técnicos de la empresa.
- `works`: obras, con municipio y dirección de ejemplo.
- `visits`: técnico, obra, fecha, hora inicial, duración, hora final calculada y estado.

La hora final es una columna generada en PostgreSQL. El cliente no puede escribir directamente en las tablas: solo tiene permisos de lectura. Para guardar o cancelar debe llamar a `create_visit` o `cancel_visit`.

`create_visit` realiza las comprobaciones en base de datos. Antes de consultar la agenda bloquea la planificación del técnico mediante un *transaction-level advisory lock*. Así, dos altas concurrentes para el mismo técnico no pueden validar simultáneamente una agenda antigua y reservar ambas el mismo intervalo. Se comprueban:

1. **Solapamiento:** dos visitas activas del mismo técnico no pueden cruzarse, aunque sean en la misma obra.
2. **Desplazamiento:** si las obras son distintas, deben quedar al menos 30 minutos libres entre el final de una visita y el inicio de la otra. Se evalúa tanto si la visita nueva se coloca después como si se coloca antes de una visita ya existente.
3. **Jornada:** la visita completa debe quedar entre las 08:00 y las 17:00.

La cancelación cambia el estado a `cancelled`; no borra la visita. Las consultas de validación solo consideran filas con estado `scheduled`.

## Justificación, alcance y supuestos

**Qué he hecho y qué queda pendiente.** He implementado el flujo básico de consulta, programación, validación y cancelación, más filtros y datos de demostración. Quedan fuera la autenticación, los permisos por usuario/empresa, la edición de visitas, festivos, calendarios por técnico, cálculo real de rutas y tiempos de desplazamiento, notificaciones y pruebas automatizadas de extremo a extremo.

**Decisiones principales.** Vite permite un arranque y compilación sencillos; TypeScript ayuda a detectar errores de forma temprana; Tailwind permite mantener la interfaz en el propio componente; Supabase aporta PostgreSQL y una API lista para consumir desde React. La validación crítica vive en funciones SQL para que no dependa de que el formulario se comporte correctamente. RLS está habilitado y las tablas no conceden permisos de escritura directa al cliente.

**Supuestos.** La empresa trabaja en una única zona horaria operativa (Europe/Madrid); por eso la fecha y la hora se guardan como `date` y `time` locales, no como instantes UTC. Las visitas no cruzan de día. La duración se expresa en minutos, entre 15 y 540, en múltiplos de 15. Los intervalos se interpretan como `[inicio, fin)`: una visita puede empezar justo cuando termina otra si no hay desplazamiento que aplicar. La regla de 30 minutos solo se aplica entre obras distintas; se asume que no hay desplazamiento adicional cuando dos visitas son en la misma obra. Los 30 minutos son un margen fijo, no una ruta calculada por municipio. La jornada admite terminar exactamente a las 17:00.

**Uso de IA y revisión.** Se ha utilizado IA como apoyo para diseñar el modelo, generar el esqueleto de React y redactar la primera versión de las funciones SQL. La primera propuesta generada para la regla de desplazamiento solo contemplaba la visita anterior; la corregí para comprobar también la visita posterior cuando la nueva reserva se inserta antes de otra que ya existe. También revisé que la validación crítica no se quedara en React: la trasladé a PostgreSQL y añadí un bloqueo transaccional por técnico para cubrir peticiones concurrentes. El resultado se debe contrastar con los casos de prueba antes de usarlo con datos reales.

## Seguridad y límites de la demo

La `Publishable key` (o la antigua `anon key`) está pensada para estar en el cliente; **no es una contraseña**. RLS limita la lectura y evita escrituras directas sobre las tablas. Las funciones RPC se han concedido a los roles `anon` y `authenticated` para que la demo funcione sin pantalla de login. Eso significa que cualquier persona que pueda abrir una instancia pública conectada a ese proyecto puede consultar y modificar la agenda de demostración llamando a esas funciones, no solo desde la interfaz.

Por tanto, usa datos ficticios y un proyecto Supabase dedicado a esta práctica. Antes de producción hay que añadir Supabase Auth, identificar la empresa/usuario y restringir cada operación por pertenencia y permisos. No publiques nunca una `service_role` key ni una Secret key en variables `VITE_*`, porque Vite las incorpora al código del navegador.

## Documentación oficial

- [Vite · Getting started](https://vite.dev/guide/)
- [Tailwind CSS · Instalación con Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Supabase · JavaScript client](https://supabase.com/docs/reference/javascript/installing)
- [Supabase · Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase · Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

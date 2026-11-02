# ObraPlan · Planificador de visitas técnicas

Aplicación web de práctica para planificar y gestionar visitas de cuatro técnicos a obras situadas en distintos municipios. Permite programar visitas, validar las restricciones de agenda, cancelarlas y registrar valoraciones del trabajo realizado.

Está construida con **React, TypeScript, Tailwind CSS 4, Vite y Supabase (PostgreSQL)**. Las reglas críticas de planificación se ejecutan en PostgreSQL para evitar depender exclusivamente de las validaciones del cliente.

## Qué incluye

- **Programación de visitas:** selección de técnico, obra, fecha, hora de inicio y duración.
- **Validación centralizada en PostgreSQL:** control de solapamientos, desplazamiento mínimo entre obras y jornada laboral.
- **Control de concurrencia:** bloqueo transaccional por técnico para evitar que dos peticiones simultáneas reserven el mismo intervalo.
- **Cancelación lógica:** las visitas canceladas permanecen en el historial, pero dejan de bloquear la agenda.
- **Listado y filtros:** visitas ordenadas por fecha y hora, con filtros por técnico y fecha.
- **Notificaciones de interfaz:** mensajes de confirmación y error mediante un componente reutilizable.
- **Datos de demostración:** cuatro técnicos, seis obras y siete visitas ficticias precargadas mediante SQL.

### Funcionalidad extra

- **Valoración de visitas:** puntuación de 1 a 5 y campo de anotaciones. Las valoraciones pueden crearse y editarse posteriormente.
  
## Arranque rápido (objetivo: menos de 10 minutos)

### Requisitos

- Node.js 20.19+ (o 22.12+).
- npm.
- Un proyecto de Supabase.

Para esta demo no es necesario instalar Docker ni Supabase CLI.

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/TU-USUARIO/planificador-visitas.git
cd planificador-visitas
npm install
```

### 2. Crear un proyecto de Supabase

Crea un proyecto gratuito desde [Supabase Dashboard](https://supabase.com/dashboard). También puedes utilizar un proyecto existente.

### 3. Crear la base de datos

En el panel de Supabase, abre `SQL Editor` → `New query`.

Copia el contenido completo de `supabase/setup.sql` y ejecútalo. Este script prepara la base de datos para una instalación nueva: tablas, índices, políticas RLS, funciones RPC y datos ficticios, incluidas las valoraciones de ejemplo.

Puedes comprobar que los registros se han creado correctamente ejecutando:

- `supabase/verify.sql`: consultas de comprobación.
- `supabase/test_rules.sql`: pruebas de las reglas de planificación. El script revierte sus datos de prueba.

### 4. Configurar las credenciales de Supabase

En Supabase, abre `Project Settings` → `API` o `Connect` y copia la Project URL y la Publishable key.

En la raíz del repositorio, crea un archivo `.env` a partir del ejemplo.

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

En proyectos antiguos de Supabase puedes utilizar la clave `anon` en esa misma variable.

**No introduzcas nunca una `service_role` key ni una Secret key en el frontend.** Las variables con prefijo `VITE_` se incorporan al código que recibe el navegador.

### 5. Arrancar la aplicación

```bash
npm run dev
```

Abre la URL local que indique Vite, normalmente `http://localhost:5173`.

Para comprobar la compilación de producción:

```bash
npm run build
```

El repositorio no contiene el archivo `.env`. Cada persona configura sus propias credenciales y conexión a Supabase. Este archivo está excluido de Git mediante `.gitignore`.

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
│   ├── setup.sql                  # Esquema, RLS, RPC y datos ficticios
│   ├── verify.sql                 # Consultas de comprobación
│   └── test_rules.sql             # Pruebas de reglas con rollback
└── src/
    ├── main.tsx                   # Entrada de React
    ├── App.tsx                    # Estado, carga de datos y composición
    ├── index.css                  # Tailwind y estilos globales
    ├── components/
    │   ├── visits/                # Formulario de programación
    │   │   ├── VisitFilter.tsx         # Filtros por técnico y fecha
    │   │   ├── VisitsTable.tsx         # Tabla, filtros, estados y valoraciones
    │   │   ├── VisitRatingModal.tsx    # Creación y edición de valoraciones
    │   │   └── VisitForm.tsx           # Formulario de programación de visitas
    │   ├── feedback/              # Notificaciones de interfaz
    │   │   ├── FeedbackBanner.tsx      # Notificaciones de éxito y error
    │   │   └── SetupNotice.tsx         # Aviso de configuración de Supabase
    │   ├── dashboard/             # Estructura de la página y tarjetas de estadísticas
    │   │   └──  StatCard.tsx            # Tarjeta de estadísticas
    │   ├── layout/                # Estructura de la cabecera
    │   │   └──  AppHeader.tsx           # Cabecera de la aplicación
    ├── lib/
    │   └── supabase.ts            # Cliente Supabase y variables de entorno
    ├── hooks/
    │   └── useSupabase.ts         # Carga de datos y estado de la aplicación
    ├── services/
    │   └── scheduleService.ts     # Consultas y llamadas RPC
    ├── types/
    │   └── index.ts               # Tipos de dominio y mensajes
    └── utils/
        └── date.ts                # Formato de fecha y hora local
```

## Modelo de datos y reglas de negocio

### Modelo de datos

La aplicación utiliza cuatro tablas principales:

- `technicians`: técnicos de la empresa.
- `works`: obras, con municipio y dirección de ejemplo.
- `visits`: visitas programadas, con técnico, obra, fecha, hora de inicio, duración, hora final calculada y estado.
- `visit_ratings`: valoraciones asociadas a las visitas, con puntuación, anotaciones y fechas de creación y actualización.

Una visita puede tener una única valoración. La relación se establece mediante `visit_id`, que también actúa como clave primaria de `visit_ratings`.

La puntuación debe estar comprendida entre 1 y 5. Las anotaciones son opcionales y tienen un límite de longitud.

### Funciones de base de datos

La aplicación utiliza funciones RPC de PostgreSQL para realizar las operaciones de escritura:

- `create_visit`: programa una visita después de validar las restricciones de agenda.
- `cancel_visit`: cancela una visita sin eliminar su registro.
- `save_visit_rating`: crea o actualiza la valoración de una visita.

La hora final de cada visita es una columna generada en PostgreSQL.

El cliente no dispone de permisos de escritura directa sobre las tablas. Las operaciones de escritura se realizan mediante las funciones RPC correspondientes.

### Reglas de planificación

`create_visit` realiza las comprobaciones en la base de datos. Antes de consultar la agenda, bloquea la planificación del técnico mediante un *transaction-level advisory lock*.

Así, dos altas concurrentes para un mismo técnico no pueden validar simultáneamente una agenda desactualizada y reservar ambas el mismo intervalo.

Se comprueban las siguientes reglas:

1. **Solapamiento:** dos visitas activas del mismo técnico no pueden cruzarse, aunque correspondan a la misma obra.
2. **Desplazamiento:** si las obras son distintas, deben quedar al menos 30 minutos libres entre el final de una visita y el inicio de la siguiente. Se comprueba tanto cuando la nueva visita se programa después de otra como cuando se inserta antes de una ya existente.
3. **Jornada laboral:** la visita completa debe quedar dentro del horario comprendido entre las 08:00 y las 17:00.

La cancelación cambia el estado de la visita a `cancelled`, pero no elimina el registro. Las comprobaciones de disponibilidad únicamente consideran visitas con estado `scheduled`.

Las valoraciones se guardan de forma independiente de la programación. Una valoración puede modificarse sin alterar la fecha, duración o estado de la visita.

## Justificación, alcance y supuestos

### Qué se ha implementado y qué queda pendiente

Se ha implementado el flujo de consulta, programación, validación y cancelación de visitas, junto con los filtros y los datos de demostración. También se ha añadido la posibilidad de registrar y modificar valoraciones con anotaciones.

Propuestas fuera del alcance actual de la prueba:

- Autenticación y permisos por usuario o empresa.
- Edición de los datos de una visita ya programada, junto con la posibilidad de añadir más estados de visita.
- Gestión de festivos y calendarios individuales por técnico.
- Cálculo real de rutas y tiempos de desplazamiento entre municipios.
- Notificaciones externas.
- Pruebas automatizadas de extremo a extremo.

### Decisiones técnicas

- **Vite** simplifica el desarrollo local y la compilación de producción.
- **TypeScript** permite detectar incompatibilidades de tipos durante el desarrollo.
- **Tailwind CSS 4** facilita la implementación de la interfaz mediante clases de utilidad.
- **Supabase** proporciona PostgreSQL y una API para conectar el frontend con la base de datos.
- **PostgreSQL RPC** centraliza las reglas críticas para que no dependan exclusivamente de la lógica de React.
- **Componentes reutilizables** separan responsabilidades: formulario, tabla, modal de valoración y notificaciones.

### Supuestos del sistema

- La empresa trabaja en una única zona horaria operativa: `Europe/Madrid`.
- Por este motivo, las fechas y horas se almacenan como tipos `date` y `time` locales, no como instantes UTC.
- Las visitas no pueden cruzar de día.
- La duración se expresa en minutos, entre 15 y 540, en múltiplos de 15.
- Los intervalos se interpretan como `[inicio, fin)`: una visita puede empezar justo cuando termina otra si no hay desplazamiento que aplicar.
- La regla de 30 minutos solo se aplica entre obras distintas. Se asume que no existe desplazamiento adicional cuando dos visitas corresponden a la misma obra.
- Los 30 minutos constituyen un margen fijo; no representan un tiempo de ruta calculado.
- La jornada permite terminar exactamente a las 17:00.

## Uso de IA y revisión

Se ha utilizado IA (ChatGPT en navegador) como apoyo para diseñar el modelo de datos, generar el esqueleto de React y redactar las primeras versiones de las funciones SQL.

La primera propuesta para la regla de desplazamiento solo contemplaba la visita anterior. Se corrigió para comprobar también la visita posterior cuando una nueva reserva se inserta antes de otra ya existente.

También se revisó que la validación crítica no dependiera exclusivamente del frontend: se trasladó a PostgreSQL y se añadió un bloqueo transaccional por técnico para cubrir peticiones concurrentes.

Además, se han corregido los errores de sintaxis y estilo que ha generado la IA, principalmente con clases antiguas de Tailwind CSS. Por otro lado, también se han corregido otros errores de importación de módulos y de tipado, que seguramente se deban a la falta de contexto por estar en navegador y no en modo agente.

## Seguridad y límites de la demo

La `Publishable key` (o la antigua `anon key`) está diseñada para utilizarse en el cliente y no es una contraseña. RLS está habilitado y las tablas no conceden permisos de escritura directa al cliente.

Las funciones RPC se han concedido a los roles `anon` y `authenticated` para que la demo funcione sin una pantalla de inicio de sesión. Esto incluye las funciones de programación, cancelación y valoración.

Por tanto, cualquier persona que pueda acceder a una instancia pública conectada a ese proyecto puede consultar y modificar la agenda y las valoraciones mediante las funciones RPC, no solo desde la interfaz.

Utiliza exclusivamente datos ficticios y un proyecto de Supabase dedicado a esta demostración.

Antes de utilizar la aplicación en producción sería necesario:

- Incorporar Supabase Auth.
- Identificar a cada usuario y su empresa.
- Restringir las operaciones por pertenencia y permisos.
- Revisar las políticas RLS y las funciones `SECURITY DEFINER` para que cada operación compruebe la autorización correspondiente.

**Nunca publiques una `service_role` key ni una Secret key en variables `VITE_*`**, ya que Vite las incorpora al código del navegador.

## Documentación oficial

- [Vite · Getting started](https://vite.dev/guide/)
- [Tailwind CSS · Instalación con Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Supabase · JavaScript client](https://supabase.com/docs/reference/javascript/installing)
- [Supabase · Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase · Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

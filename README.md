# EncryptedChat — Plataforma de Mensajería con Cifrado E2EE

**Autor:** StackFlow

Plataforma de mensajería instantánea enfocada en la privacidad mediante **Cifrado Extremo a Extremo (E2EE)**. El sistema está compuesto por un backend Django/ASGI y un frontend React/Vite desacoplados.

---

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración del Backend](#2-configuración-del-backend)
3. [Configuración del Frontend](#3-configuración-del-frontend)
4. [Ejecución del Proyecto](#4-ejecución-del-proyecto)
5. [API REST — Endpoints](#5-api-rest--endpoints)
6. [WebSocket](#6-websocket)
7. [Arquitectura del Proyecto](#7-arquitectura-del-proyecto)
8. [Estructura de Directorios](#8-estructura-de-directorios)

---

## 1. Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas antes de comenzar:

| Herramienta | Versión mínima recomendada |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |
| MySQL Server | 8.0+ |

---

## 2. Configuración del Backend

### 2.1 Clonar el repositorio y navegar al proyecto

```bash
git clone <url-del-repositorio>
cd 8C_SDA_EncryptedChat_Django
```

### 2.2 Crear y activar el entorno virtual

```bash
cd EncryptedChat_Backend

# Crear el entorno virtual
python -m venv venv

# Activar en Windows
venv\Scripts\activate

# Activar en macOS / Linux
source venv/bin/activate
```

### 2.3 Instalar dependencias de Python

```bash
cd EncryptedChat_Backend
pip install -r requirements.txt
```

**Dependencias principales:**

| Paquete | Versión | Propósito |
|---|---|---|
| Django | 5.2.10 | Framework web principal |
| djangorestframework | 3.16.1 | API REST |
| djangorestframework-simplejwt | 5.5.1 | Autenticación JWT |
| django-cors-headers | 4.9.0 | Gestión de CORS |
| channels | 4.3.2 | Soporte WebSocket |
| daphne | 4.2.1 | Servidor ASGI |
| cryptography | 46.0.5 | Operaciones criptográficas (E2EE) |
| django-environ | 0.13.0 | Variables de entorno |
| mysqlclient | 2.2.8 | Conector MySQL |

### 2.4 Configurar la base de datos MySQL

Crea la base de datos en tu servidor MySQL:

```sql
CREATE DATABASE encrypted_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

La configuración de la base de datos se maneja a través de variables de entorno. Crea un archivo `.env` en el directorio `EncryptedChat_Backend/` con el siguiente contenido:

```env
DB_NAME=encrypted_chat
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=3306
```

> Asegúrate de configurar los valores correctos de tu conexión local en el archivo `.env`.

### 2.5 Aplicar migraciones

```bash
# Desde EncryptedChat_Backend/
python manage.py makemigrations
python manage.py migrate
```

---

## 3. Configuración del Frontend

### 3.1 Instalar dependencias de Node.js

```bash
cd EncryptedChat_Frontend
npm install
```

**Dependencias principales:**

| Paquete | Propósito |
|---|---|
| React 19 + React DOM | Librería de UI |
| React Router DOM 7 | Enrutamiento SPA |
| Vite 7 | Bundler y servidor de desarrollo |
| TypeScript 5.9 | Tipado estático |
| Bootstrap 5 | Sistema de grillas y estilos base |
| MUI / Material Icons | Iconografía |
| Motion | Animaciones |

---

## 4. Ejecución del Proyecto

El backend y el frontend deben ejecutarse **en paralelo**, cada uno en su propia terminal.

### Terminal 1 — Backend (servidor ASGI con Daphne)

```bash
cd EncryptedChat_Backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

python manage.py runserver
```

> Daphne está registrado como app ASGI (`ASGI_APPLICATION`), por lo que `runserver` ya levanta el servidor con soporte para WebSockets de forma automática.
>
> Por defecto el backend escucha en: **`http://localhost:8000`**

### Terminal 2 — Frontend (servidor de desarrollo Vite)

```bash
cd EncryptedChat_Frontend
npm run dev
```

> Por defecto el frontend escucha en: **`http://localhost:5173`**

### URLs de acceso

| Servicio | URL |
|---|---|
| Frontend (SPA) | http://localhost:5173 |
| API REST | http://localhost:8000/api/v1/ |
| WebSocket | ws://localhost:8000/ws/chat/ |

---

## 5. API REST — Endpoints

### Autenticación — `/api/v1/users/`

| Método | Endpoint | Descripción | Auth requerida |
|---|---|---|---|
| `POST` | `/api/v1/users/register/` | Registro de nuevo usuario | No |
| `POST` | `/api/v1/users/login/` | Inicio de sesión, retorna `access` y `refresh` JWT | No |
| `POST` | `/api/v1/users/token/refresh/` | Renovar el token de acceso | No |

### Grupos de Chat — `/api/v1/groups/`

| Método | Endpoint | Descripción | Auth requerida |
|---|---|---|---|
| `GET` | `/api/v1/groups/` | Listar grupos disponibles | Sí |
| `POST` | `/api/v1/groups/` | Crear un nuevo grupo | Sí |
| `GET` | `/api/v1/groups/{id}/` | Detalle de un grupo | Sí |
| `PUT/PATCH` | `/api/v1/groups/{id}/` | Actualizar grupo | Sí (Admin) |
| `DELETE` | `/api/v1/groups/{id}/` | Eliminar grupo | Sí (Admin) |
| `POST` | `/api/v1/groups/join/` | Solicitar unirse a un grupo | Sí |
| `DELETE` | `/api/v1/groups/{id}/leave/` | Abandonar un grupo | Sí |
| `GET` | `/api/v1/groups/me/` | Grupos a los que pertenece el usuario | Sí |
| `GET` | `/api/v1/groups/{id}/roles/` | Ver roles dentro del grupo | Sí |
| `GET` | `/api/v1/groups/{id}/requests/` | Ver solicitudes de ingreso pendientes | Sí (Admin) |
| `GET` | `/api/v1/groups/{id}/members/` | Listar miembros del grupo | Sí |
| `POST` | `/api/v1/groups/{id}/kick/` | Expulsar a un miembro | Sí (Admin) |

> **Autenticación:** todos los endpoints protegidos requieren el header:
> ```
> Authorization: Bearer <access_token>
> ```

---

## 6. WebSocket

La conexión en tiempo real se establece en:

```
ws://localhost:8000/ws/chat/
```

**Autenticación WebSocket:** el token JWT debe enviarse como query parameter al momento de conectar:

```
ws://localhost:8000/ws/chat/?token=<access_token>
```

El middleware `JWTAuthMiddlewareStack` valida el token y asocia el usuario a la conexión antes de enrutar al `ChatConsumer`.

---

## 7. Arquitectura del Proyecto

### Backend — Clean Architecture

- **Patrón:** *Fat Models, Thin Views, Service Layer*. La lógica de negocio compleja (criptografía, gestión de grupos) se abstrae en capas `services/`, manteniendo las vistas enfocadas en el enrutamiento HTTP.
- **Base de Datos:** MySQL para almacenamiento relacional de usuarios, grupos, mensajes cifrados y llaves públicas RSA.
- **Tiempo Real:** Django Channels + Daphne (ASGI) para WebSockets nativos y asíncronos.
- **Seguridad E2EE:** El servidor actúa como intermediario pasivo. Los mensajes se almacenan cifrados (`encrypted_content`) y el backend solo distribuye llaves públicas RSA de los destinatarios.
- **Channel Layer:** En desarrollo usa `InMemoryChannelLayer`. Para producción se recomienda reemplazarlo por la capa Redis.

### Frontend — SPA React

- **Bundler:** Vite para tiempos de arranque y recarga ultrarrápidos.
- **Tipado estético:** TypeScript estricto en toda la codebase.
- **UI:** Bootstrap 5 para grillas y estructura; MUI Material Icons para iconografía.
- **Arquitectura:** Componentes funcionales con React Hooks, separación clara entre vistas, contextos de estado (`contexts/`) y servicios API (`api/`).

---

## 8. Estructura de Directorios

```
8C_SDA_EncryptedChat_Django/
│
├── EncryptedChat_Backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── EncryptedChat_Backend/      # Configuración del proyecto Django
│   │   ├── settings.py
│   │   ├── urls.py                 # Rutas raíz de la API
│   │   ├── asgi.py                 # Entrada ASGI (HTTP + WebSocket)
│   │   └── wsgi.py
│   └── apps/
│       ├── users/                  # Registro, login, JWT, middleware WebSocket
│       │   ├── views.py
│       │   ├── serializers.py
│       │   ├── middleware.py       # JWTAuthMiddlewareStack
│       │   ├── throttles.py
│       │   └── urls.py
│       ├── chat/                   # Grupos, mensajes, consumers WebSocket
│       │   ├── consumers.py        # ChatConsumer (WebSocket)
│       │   ├── routing.py          # ws/chat/ → ChatConsumer
│       │   ├── views.py
│       │   ├── serializers.py
│       │   └── urls.py
│       ├── security/               # Modelos y servicios criptográficos (E2EE)
│       └── integrations/           # Integraciones externas
│
└── EncryptedChat_Frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/                    # Servicios HTTP hacia el backend
        │   ├── auth-services.ts
        │   ├── chat-services.ts
        │   ├── group-services.ts
        │   └── fetch-wrapper.ts
        ├── components/layout/      # Navbar, Sidebar, AppLayout
        ├── contexts/               # WebSocketContext
        ├── features/
        │   ├── auth/views/         # Login.tsx
        │   └── chat/               # Vistas y componentes del chat
        ├── hooks/                  # useWebSocket
        └── routes/                 # AppRouter, PrivateRoute, PublicRoute
```
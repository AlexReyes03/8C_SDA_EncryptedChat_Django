# 8C_SDA_EncryptedChat_Django

**Autor:** @AlexReyes03

Este proyecto contiene la migración y reestructuración completa de una aplicación de chat cifrado, dividida en un Backend robusto y un Frontend moderno y optimizado.

## Arquitecturas del Proyecto

### EncryptedChat_Backend
El backend está construido con **Python 3 y Django**, implementando una arquitectura limpia orientada a servicios (**Clean Architecture**):
- **Patrón de Diseño:** "Fat Models, Thin Views, Service Layer". Se prioriza la abstracción de la lógica de negocio compleja (criptografía, manejo de firmas y procesos externos) en capas de servicios (`services/`), manteniendo las vistas (`views/`) estrictamente responsables del enrutamiento HTTP y las respuestas.
- **Base de Datos:** Uso de **MySQL** para el almacenamiento robusto y relacional de usuarios, salas, mensajes cifrados y llaves públicas.
- **Estructura Modular:** Las funcionalidades centrales están desacopladas en aplicaciones independientes dentro del directorio `apps/` (ej. `users`, `chat`, `security`, `integrations`).
- **Tiempo Real:** Uso de **Django Channels** con el servidor ASGI **Daphne** para la gestión de WebSockets asíncronos en el chat.
- **Seguridad (E2EE):** El servidor actúa como intermediario pasivo. Los mensajes se almacenan cifrados (`encrypted_content`) y el backend solo provee las llaves públicas RSA de los destinatarios.
- **RESTful API y JWT:** Uso de **Django REST Framework (DRF)** y **SimpleJWT** para endpoints tradicionales, con un Custom Auth Middleware para validar conexiones en tiempo real al Socket.

### EncryptedChat_Frontend
El frontend es una **Single Page Application (SPA)** de alto rendimiento:
- **Tecnologías Core:** **React** empaquetado y construido con **Vite** para ofrecer Tiempos de Carga Ultrarrápidos, usando **TypeScript** de forma estricta para garantizar seguridad en los tipos y previsibilidad del código.
- **Offline-First:** Implementación de persistencia local robusta usando **Dexie.js** (IndexedDB) para mantener la disponibilidad de los datos.
- **UI/UX y Diseño:** Uso estricto de **CSS estándar**, **Bootstrap 5** para la estructura y sistema de grillas, y **PrimeReact** para componentes interactivos avanzados. La iconografía está delegada a **Material Design Icons** de MUI.
- **Arquitectura de Componentes:** Componentes funcionales desacoplados haciendo uso intensivo de React Hooks, con una clara separación entre las vistas principales, manejadores de estado y servicios API (`api-services.ts`).
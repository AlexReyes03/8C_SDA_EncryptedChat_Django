export const mapDjangoErrors = (errorMessage: string, context?: 'login' | 'register' | 'group'): string => {
    // Si el error viene de un código 500 o falló la red
    const lowerMsg = errorMessage.toLowerCase();
    
    // Mapeos globales (Network / Internal)
    if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('500') || lowerMsg.includes('conexión') || lowerMsg.includes('servidor')) {
        return 'Error en la conexión con el servidor.';
    }

    try {
        // Intentamos parsear por si el backend mandó un JSON stringificado `{ "campo": ["Error"] }`
        const parsed = JSON.parse(errorMessage);
        if (typeof parsed === 'object' && parsed !== null) {
            
            // Si es un Detail de DRF (Como el PermissionDenied)
            if (parsed.detail) {
                if (typeof parsed.detail === 'string') return parsed.detail;
            }

            // Aplanamos todos los arreglos de errores de Serializers de Django
            const errorLines: string[] = [];
            for (const [key, value] of Object.entries(parsed)) {
                // Traducciones amigables de keys
                let friendlyKey = key;
                if (key === 'name') friendlyKey = 'Nombre';
                if (key === 'email') friendlyKey = 'Correo';
                if (key === 'username') friendlyKey = 'Usuario';
                if (key === 'password') friendlyKey = 'Contraseña';
                if (key === 'encrypted_symmetric_key') friendlyKey = 'Cifrado de Seguridad';
                if (key === 'is_private') friendlyKey = 'Privacidad';
                
                if (Array.isArray(value)) {
                    errorLines.push(`${friendlyKey}: ${value.join(', ')}`);
                } else if (typeof value === 'string') {
                    errorLines.push(`${friendlyKey}: ${value}`);
                }
            }
            
            if (errorLines.length > 0) return errorLines.join(' | ');
        }
    } catch {
        // No es JSON, continuamos con búsquedas substring (Como en Login)
    }

    // --- Mapeos basados en contenido (Fallbacks) ---
    if (context === 'login' || context === 'register') {
        if (lowerMsg.includes('credenciales') || lowerMsg.includes('no active account') || lowerMsg.includes('invalid') || lowerMsg.includes('incorrect') || lowerMsg.includes('bad request')) {
            return 'Credenciales de acceso incorrectas.';
        }
        if (lowerMsg.includes('not found') || lowerMsg.includes('no encontrado')) {
            return 'Usuario no encontrado en la plataforma.';
        }
        if (lowerMsg.includes('email') && (lowerMsg.includes('exists') || lowerMsg.includes('registrado') || lowerMsg.includes('already'))) {
            return 'Este correo electrónico ya está registrado.';
        }
        if (lowerMsg.includes('username') && (lowerMsg.includes('exists') || lowerMsg.includes('registrado') || lowerMsg.includes('already'))) {
            return 'Este nombre de usuario ya está ocupado.';
        }
        if (lowerMsg.includes('password') && (lowerMsg.includes('short') || lowerMsg.includes('common') || lowerMsg.includes('insegura'))) {
            return 'La contraseña proporcionada es insegura o muy corta.';
        }
    }

    if (context === 'group') {
         if (lowerMsg.includes('encrypted_symmetric_key') || lowerMsg.includes('required')) {
            return 'Fallo crítico de sincronización de seguridad E2EE. Por favor recarga e intenta de nuevo.';
         }
         if (lowerMsg.includes('name') && lowerMsg.includes('exist')) {
             return 'Ya existe un grupo con este nombre.';
         }
    }

    return errorMessage || 'Ocurrió un error inesperado. Por favor, revisa tus datos e intenta nuevamente.';
};

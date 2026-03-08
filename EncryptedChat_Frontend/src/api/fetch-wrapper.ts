export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method: string) {
    return async (urlPath: string, body?: unknown, customHeaders?: Record<string, string>) => {
        let baseURL = import.meta.env.VITE_API_URL || '';
        if (baseURL.endsWith('/')) {
            baseURL = baseURL.slice(0, -1);
        }

        let cleanPath = urlPath;
        if (!cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }
        if (!cleanPath.endsWith('/')) {
            cleanPath = cleanPath + '/'; // Obligatorio para Django REST Framework
        }

        const fullUrl = `${baseURL}${cleanPath}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true', // Omitir página HTML de advertencia del túnel Ngrok gratuito
            ...customHeaders
        };

        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const requestOptions: RequestInit = {
            method,
            headers
        };

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(fullUrl, requestOptions);
        return handleResponse(response);
    };
}

async function handleResponse(response: Response) {
    const text = await response.text();
    let data;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        // Si el backend (Django) truena y devuelve un HTML (ej. Error 500 por base de datos), fallamos seguro
        if (!response.ok) {
            throw new Error(`Error en el servidor backend HTTP ${response.status}. Puede que falten migraciones.`);
        }
        throw new Error('El servidor retornó una respuesta inválida (No-JSON).');
    }

    if (!response.ok) {
        if ([401, 403].includes(response.status)) {
            // Eliminar token si es inválido
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }

        let errorMsg = response.statusText;
        if (data && typeof data === 'object') {
            if (data.detail) errorMsg = data.detail;
            else if (data.message) errorMsg = data.message;
            else errorMsg = JSON.stringify(data);
        }

        throw new Error(errorMsg);
    }

    return data;
}

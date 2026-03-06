// En Vite, las variables de entorno se acceden a través de import.meta.env y deben empezar con VITE_
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
    console.error("VITE_API_URL no está definido en el archivo .env");
}

export const fetchWrapper = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    delete: request('DELETE')
};

function request(method: string) {
    return async (url: string, body?: unknown, customHeaders?: Record<string, string>) => {
        const fullUrl = `${API_BASE_URL}${url}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
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

        try {
            const response = await fetch(fullUrl, requestOptions);
            return handleResponse(response);
        } catch (error) {
            console.error(`Fetch error on ${method} ${fullUrl}:`, error);
            throw error;
        }
    };
}

async function handleResponse(response: Response) {
    const text = await response.text();
    const data = text && JSON.parse(text);
    
    if (!response.ok) {
        if ([401, 403].includes(response.status)) {
            // Eliminar token si es inválido (o podríamos intentar un refresh token aquí)
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Opcional: window.location.href = '/login'; si no se maneja en un context
        }

        const error = (data && data.detail) || (data && data.message) || response.statusText;
        throw new Error(error);
    }

    return data;
}

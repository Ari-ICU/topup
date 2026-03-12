const API_URL = typeof window === 'undefined' 
    ? (process.env.BACKEND_API_URL || "http://backend:4000/api")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");
export const ASSET_URL = API_URL.replace(/\/api\/?$/, "");

export function getAssetUrl(path: string | null | undefined) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    // Only prepend backend URL if the path is explicitly an upload
    if (cleanPath.startsWith("/uploads/")) {
        return `${ASSET_URL}${cleanPath}`;
    }

    // Otherwise, return as-is (referring to frontend /public)
    return cleanPath;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    error?: any;
}

// Custom error class that carries the HTTP status code
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem("admin_token") : null;

    const headers: Record<string, string> = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...Object.fromEntries(Object.entries(options.headers || {}).map(([k, v]) => [k, String(v)]))
    };

    // Only set Content-Type if not sending FormData
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        cache: 'no-store',
        ...options,
        headers,
    });

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
        // 🛡️ Automatic redirection on 401 Unauthorized
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem("admin_token");
            if (!window.location.pathname.startsWith('/admin/login')) {
                window.location.href = '/admin/login?message=session_expired';
            }
        }

        // Throw ApiError with the HTTP status so callers can react differently
        throw new ApiError(result.message || "Something went wrong", response.status);
    }

    return result.data;
}

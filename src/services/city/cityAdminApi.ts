type AdminApiResult<T> = {
    success?: boolean;
    error?: string;
    data?: T;
};

const ADMIN_API_TIMEOUT_MS = 30_000;

export const callCityAdminApi = async <T>(
    path: string,
    method: 'PATCH' | 'POST',
    body?: unknown
): Promise<T> => {
    let response: Response;
    try {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin${path}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            cache: 'no-store',
            signal: AbortSignal.timeout(ADMIN_API_TIMEOUT_MS),
        });
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            throw new Error(
                'Timeout API admin città: riavvia il server (npm run dev:server) se hai aggiornato le route admin.'
            );
        }
        throw error;
    }

    const result = await response.json() as AdminApiResult<T>;

    if (!response.ok || !result.success || result.data === undefined) {
        throw new Error(result.error || 'Operazione admin non riuscita');
    }

    return result.data;
};

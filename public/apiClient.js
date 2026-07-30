const resolveApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.__SIMUPHYSICS_API_BASE_URL__) {
        return window.__SIMUPHYSICS_API_BASE_URL__;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return '';
};

export async function submitPrompt(prompt) {
    const baseUrl = resolveApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

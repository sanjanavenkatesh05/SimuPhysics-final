function extractJsonArray(text) {
    if (typeof text !== 'string') return null;

    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        return null;
    }

    return text.substring(startIndex, endIndex + 1);
}

export function parseParameterArray(text) {
    const jsonString = extractJsonArray(text);

    if (!jsonString) {
        return [];
    }

    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

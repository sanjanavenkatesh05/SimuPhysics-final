export function validatePromptInput(prompt) {
    if (typeof prompt !== 'string') {
        return { valid: false, error: 'Prompt must be provided as text.' };
    }

    const trimmed = prompt.trim();

    if (!trimmed) {
        return { valid: false, error: 'Prompt is required.' };
    }

    if (trimmed.length > 2000) {
        return { valid: false, error: 'Prompt exceeds the 2000 character limit.' };
    }

    return { valid: true, prompt: trimmed };
}

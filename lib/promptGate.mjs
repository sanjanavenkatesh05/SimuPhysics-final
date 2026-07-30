const PHYSICS_KEYWORDS = [
    'physics', 'force', 'motion', 'velocity', 'acceleration', 'mass', 'energy',
    'momentum', 'torque', 'friction', 'projectile', 'circuit', 'charge',
    'current', 'voltage', 'resistance', 'capacitor', 'gravity', 'orbit',
    'collision', 'wave', 'temperature', 'work', 'power', 'kinematics',
    'electric', 'magnetic', 'dipole', 'pendulum', 'inertia', 'newton'
];

export function shouldAllowPrompt(prompt) {
    if (typeof prompt !== 'string') {
        return { allowed: false, reason: 'Prompt must be text.' };
    }

    const normalized = prompt.trim().toLowerCase();

    if (!normalized) {
        return { allowed: false, reason: 'Prompt is empty.' };
    }

    if (normalized.length < 6) {
        return { allowed: false, reason: 'Prompt is too short.' };
    }

    const hasPhysicsKeyword = PHYSICS_KEYWORDS.some((keyword) => normalized.includes(keyword));

    if (!hasPhysicsKeyword) {
        return {
            allowed: false,
            reason: 'Only physics-related prompts are supported.'
        };
    }

    return { allowed: true };
}

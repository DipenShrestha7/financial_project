export function createLoginEntry(payload) {
    const now = new Date();
    return {
        id: crypto.randomUUID(),
        username: payload.username,
        email: payload.email,
        password_hash: payload.passwordHash,
        createdAt: now,
        updatedAt: now,
    };
}

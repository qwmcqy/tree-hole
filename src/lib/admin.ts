export function getAdminUserIds() {
    const raw = process.env.ADMIN_USER_IDS;
    if (!raw) return [];

    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export function isAdminUser(userId: string | null | undefined) {
    if (!userId) return false;
    const adminIds = getAdminUserIds();
    return adminIds.includes(userId);
}

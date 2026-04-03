export function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (!domain) return email;

    const safeName = name.length <= 2 ? `${name[0] ?? ""}*` : `${name.slice(0, 2)}***`;
    const domainParts = domain.split(".");
    if (domainParts.length < 2) return `${safeName}@${domain}`;

    const tld = domainParts.pop();
    const host = domainParts.join(".");
    const safeHost = host.length <= 2 ? `${host[0] ?? ""}*` : `${host.slice(0, 2)}***`;

    return `${safeName}@${safeHost}.${tld}`;
}

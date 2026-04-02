/**
 * Generate a cryptographically secure API key.
 * Returns a 30-character base-36 string (a-z, 0-9).
 */
export function generateApiKey() {
    const array = new Uint8Array(30)
    crypto.getRandomValues(array)
    return Array.from(array)
        .map((b) => (b % 36).toString(36))
        .join('')
}

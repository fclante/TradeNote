export const VALID_BROKERS = [
    "template", "tradeZero", "interactiveBrokers", "tdAmeritrade",
    "tradeStation", "tradovate", "metaTrader5", "heldentrader",
    "rithmic", "fundTraders", "ninjaTrader", "tastyTrade", "topstepX"
]

/**
 * Search all users for a matching API key.
 * Returns the matching user object, or null if not found.
 */
export function findUserByApiKey(allUsers, targetKey) {
    if (!targetKey) return null
    for (const user of Object.values(allUsers)) {
        if (user.hasOwnProperty("apis")) {
            const index = user.apis.findIndex(obj => obj.key === targetKey)
            if (index !== -1) {
                return user
            }
        }
    }
    return null
}

/**
 * Validate the trade import request body.
 * Returns { valid: true } or { valid: false, status: number, error: string }
 */
export function validateTradeRequest(data) {
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
        return { valid: false, status: 400, error: 'No trades to import. "data" must be a non-empty array.' }
    }
    if (!data.selectedBroker || !VALID_BROKERS.includes(data.selectedBroker)) {
        return { valid: false, status: 400, error: 'Invalid or missing "selectedBroker". Must be one of: ' + VALID_BROKERS.join(', ') }
    }
    return { valid: true }
}

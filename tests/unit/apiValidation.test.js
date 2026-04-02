import { describe, it, expect } from 'vitest'
import { findUserByApiKey, validateTradeRequest, VALID_BROKERS } from '../../src/utils/apiValidation.js'

describe('VALID_BROKERS', () => {
    it('contains all 13 brokers', () => {
        expect(VALID_BROKERS).toHaveLength(13)
    })

    it('contains expected brokers', () => {
        expect(VALID_BROKERS).toContain('template')
        expect(VALID_BROKERS).toContain('tradeZero')
        expect(VALID_BROKERS).toContain('interactiveBrokers')
        expect(VALID_BROKERS).toContain('tdAmeritrade')
        expect(VALID_BROKERS).toContain('tradeStation')
        expect(VALID_BROKERS).toContain('tradovate')
        expect(VALID_BROKERS).toContain('metaTrader5')
        expect(VALID_BROKERS).toContain('heldentrader')
        expect(VALID_BROKERS).toContain('rithmic')
        expect(VALID_BROKERS).toContain('fundTraders')
        expect(VALID_BROKERS).toContain('ninjaTrader')
        expect(VALID_BROKERS).toContain('tastyTrade')
        expect(VALID_BROKERS).toContain('topstepX')
    })
})

describe('findUserByApiKey', () => {
    const mockUsers = [
        { objectId: 'user1', username: 'alice', apis: [{ provider: 'tradeNote', key: 'abc123' }] },
        { objectId: 'user2', username: 'bob', apis: [{ provider: 'tradeNote', key: 'def456' }, { provider: 'polygon', key: 'poly789' }] },
        { objectId: 'user3', username: 'charlie' }, // no apis property
    ]

    it('returns user when API key matches', () => {
        const result = findUserByApiKey(mockUsers, 'abc123')
        expect(result).toEqual(mockUsers[0])
    })

    it('returns correct user for second user key', () => {
        const result = findUserByApiKey(mockUsers, 'def456')
        expect(result).toEqual(mockUsers[1])
    })

    it('matches against any provider key, not just tradeNote', () => {
        const result = findUserByApiKey(mockUsers, 'poly789')
        expect(result).toEqual(mockUsers[1])
    })

    it('returns null for non-existent key', () => {
        expect(findUserByApiKey(mockUsers, 'nonexistent')).toBeNull()
    })

    it('returns null for empty string key', () => {
        expect(findUserByApiKey(mockUsers, '')).toBeNull()
    })

    it('returns null for null key', () => {
        expect(findUserByApiKey(mockUsers, null)).toBeNull()
    })

    it('returns null for undefined key', () => {
        expect(findUserByApiKey(mockUsers, undefined)).toBeNull()
    })

    it('skips users without apis property gracefully', () => {
        // user3 has no apis — should not throw
        const result = findUserByApiKey(mockUsers, 'abc123')
        expect(result).toEqual(mockUsers[0])
    })

    it('returns null for empty users array', () => {
        expect(findUserByApiKey([], 'abc123')).toBeNull()
    })

    it('returns null when all users lack apis', () => {
        const usersNoApis = [
            { objectId: 'u1', username: 'a' },
            { objectId: 'u2', username: 'b' },
        ]
        expect(findUserByApiKey(usersNoApis, 'abc123')).toBeNull()
    })

    it('returns first matching user if multiple users share a key', () => {
        const dupeUsers = [
            { objectId: 'u1', apis: [{ key: 'shared' }] },
            { objectId: 'u2', apis: [{ key: 'shared' }] },
        ]
        const result = findUserByApiKey(dupeUsers, 'shared')
        expect(result.objectId).toBe('u1')
    })
})

describe('validateTradeRequest', () => {
    const validRequest = {
        data: [{ Account: 'test', 'T/D': '01/01/2024', 'S/D': '01/01/2024' }],
        selectedBroker: 'tradeZero'
    }

    it('accepts a valid request', () => {
        expect(validateTradeRequest(validRequest)).toEqual({ valid: true })
    })

    it('rejects null body', () => {
        const result = validateTradeRequest(null)
        expect(result.valid).toBe(false)
        expect(result.status).toBe(400)
    })

    it('rejects undefined body', () => {
        const result = validateTradeRequest(undefined)
        expect(result.valid).toBe(false)
        expect(result.status).toBe(400)
    })

    it('rejects missing data field', () => {
        const result = validateTradeRequest({ selectedBroker: 'tradeZero' })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('data')
    })

    it('rejects empty data array', () => {
        const result = validateTradeRequest({ data: [], selectedBroker: 'tradeZero' })
        expect(result.valid).toBe(false)
    })

    it('rejects non-array data', () => {
        const result = validateTradeRequest({ data: 'string', selectedBroker: 'tradeZero' })
        expect(result.valid).toBe(false)
    })

    it('rejects data as object', () => {
        const result = validateTradeRequest({ data: { key: 'val' }, selectedBroker: 'tradeZero' })
        expect(result.valid).toBe(false)
    })

    it('rejects data as number', () => {
        const result = validateTradeRequest({ data: 42, selectedBroker: 'tradeZero' })
        expect(result.valid).toBe(false)
    })

    it('rejects missing selectedBroker', () => {
        const result = validateTradeRequest({ data: [{ some: 'data' }] })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('selectedBroker')
    })

    it('rejects empty string selectedBroker', () => {
        const result = validateTradeRequest({ data: [{ some: 'data' }], selectedBroker: '' })
        expect(result.valid).toBe(false)
    })

    it('rejects invalid selectedBroker', () => {
        const result = validateTradeRequest({ data: [{ some: 'data' }], selectedBroker: 'fakeBroker' })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('selectedBroker')
    })

    it('rejects SQL injection attempt in selectedBroker', () => {
        const result = validateTradeRequest({ data: [{ some: 'data' }], selectedBroker: "'; DROP TABLE trades;--" })
        expect(result.valid).toBe(false)
    })

    it('accepts all valid brokers', () => {
        for (const broker of VALID_BROKERS) {
            const result = validateTradeRequest({ data: [{ x: 1 }], selectedBroker: broker })
            expect(result.valid, `broker ${broker} should be valid`).toBe(true)
        }
    })

    it('returns 400 status for all rejection cases', () => {
        const invalidCases = [
            null,
            {},
            { data: [] },
            { data: [1], selectedBroker: 'bad' },
        ]
        for (const c of invalidCases) {
            const result = validateTradeRequest(c)
            expect(result.valid).toBe(false)
            expect(result.status).toBe(400)
        }
    })
})

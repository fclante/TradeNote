import { describe, it, expect } from 'vitest'
import { generateApiKey } from '../../src/utils/generateApiKey.js'

describe('generateApiKey', () => {
    it('generates a 30-character string', () => {
        const key = generateApiKey()
        expect(key).toHaveLength(30)
    })

    it('only contains base-36 characters (a-z, 0-9)', () => {
        const key = generateApiKey()
        expect(key).toMatch(/^[a-z0-9]{30}$/)
    })

    it('generates unique keys across 100 invocations', () => {
        const keys = new Set()
        for (let i = 0; i < 100; i++) {
            keys.add(generateApiKey())
        }
        expect(keys.size).toBe(100)
    })

    it('never contains uppercase letters', () => {
        for (let i = 0; i < 50; i++) {
            const key = generateApiKey()
            expect(key).toBe(key.toLowerCase())
        }
    })

    it('returns a string type', () => {
        expect(typeof generateApiKey()).toBe('string')
    })
})

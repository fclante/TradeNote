import { describe, it, expect } from 'vitest'
import { createRequestContext } from '../../src/utils/requestContext.js'

describe('createRequestContext', () => {
    const mockUser = { objectId: 'u1', username: 'alice', apis: [{ provider: 'tradeNote', key: 'k1' }] }

    it('creates a context with the provided user', () => {
        const ctx = createRequestContext(mockUser, 'tradeZero', true)
        expect(ctx.currentUser).toBe(mockUser)
    })

    it('sets selectedBroker', () => {
        const ctx = createRequestContext(mockUser, 'interactiveBrokers', false)
        expect(ctx.selectedBroker).toBe('interactiveBrokers')
    })

    it('coerces uploadMfePrices to boolean', () => {
        expect(createRequestContext(mockUser, 'tradeZero', 1).uploadMfePrices).toBe(true)
        expect(createRequestContext(mockUser, 'tradeZero', 0).uploadMfePrices).toBe(false)
        expect(createRequestContext(mockUser, 'tradeZero', undefined).uploadMfePrices).toBe(false)
        expect(createRequestContext(mockUser, 'tradeZero', null).uploadMfePrices).toBe(false)
    })

    it('initializes all array fields as empty', () => {
        const ctx = createRequestContext(mockUser, 'tradeZero', false)
        expect(ctx.tradesData).toEqual([])
        expect(ctx.tempExecutions).toEqual([])
        expect(ctx.tradedSymbols).toEqual([])
        expect(ctx.tradeAccounts).toEqual([])
        expect(ctx.existingTradesArray).toEqual([])
        expect(ctx.existingImports).toEqual([])
        expect(ctx.ohlcv).toEqual([])
        expect(ctx.mfePrices).toEqual([])
        expect(ctx.openPositionsParse).toEqual([])
        expect(ctx.openPositionsFile).toEqual([])
    })

    it('initializes all object fields as empty', () => {
        const ctx = createRequestContext(mockUser, 'tradeZero', false)
        expect(ctx.executions).toEqual({})
        expect(ctx.trades).toEqual({})
        expect(ctx.blotter).toEqual({})
        expect(ctx.pAndL).toEqual({})
    })

    it('initializes date fields as null', () => {
        const ctx = createRequestContext(mockUser, 'tradeZero', false)
        expect(ctx.tradedStartDate).toBeNull()
        expect(ctx.tradedEndDate).toBeNull()
        expect(ctx.timeZoneTrade).toBeNull()
        expect(ctx.currentTradeId).toBeNull()
    })

    it('initializes boolean fields', () => {
        const ctx = createRequestContext(mockUser, 'tradeZero', false)
        expect(ctx.gotExistingTradesArray).toBe(false)
        expect(ctx.openPosition).toBe(false)
    })

    it('creates independent instances (no shared state)', () => {
        const ctx1 = createRequestContext(mockUser, 'tradeZero', false)
        const ctx2 = createRequestContext(mockUser, 'tradeZero', false)

        ctx1.tradesData.push({ symbol: 'AAPL' })
        ctx1.executions['key1'] = { data: 'test' }

        expect(ctx2.tradesData).toEqual([])
        expect(ctx2.executions).toEqual({})
    })
})

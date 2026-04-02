import { describe, it, expect, beforeEach } from 'vitest'
import { createRequestContext } from '../../src/utils/requestContext.js'
import { useBrokerTradeZero } from '../../src/utils/brokers.js'
import { useGetTimeZone } from '../../src/utils/utils.js'
import { tradesData, currentUser, selectedBroker, timeZoneTrade, uploadMfePrices } from '../../src/stores/globals.js'

function makeTrade(overrides = {}) {
    return {
        Account: 'TestAccount',
        'T/D': '10/13/2023',
        'S/D': '10/13/2023',
        Currency: 'USD',
        Type: 'stock',
        Side: 'B',
        Symbol: 'AAPL',
        Qty: 100,
        Price: 150.50,
        'Exec Time': '09:30:00',
        Comm: -1,
        SEC: 0,
        TAF: 0,
        NSCC: 0,
        Nasdaq: 0,
        'ECN Remove': 0,
        'ECN Add': 0,
        'Gross Proceeds': -15050,
        'Net Proceeds': -15051,
        'Clr Broker': '',
        Liq: '',
        Note: '',
        ...overrides
    }
}

describe('Request isolation (concurrency safety)', () => {
    beforeEach(() => {
        tradesData.length = 0
        currentUser.value = undefined
        selectedBroker.value = undefined
        timeZoneTrade.value = undefined
        uploadMfePrices.value = false
    })

    it('two concurrent requests do not share tradesData', async () => {
        const userA = { objectId: 'userA', timeZone: 'America/New_York' }
        const userB = { objectId: 'userB', timeZone: 'Europe/London' }

        const ctxA = createRequestContext(userA, 'template', false)
        const ctxB = createRequestContext(userB, 'tradeZero', true)

        // Simulate concurrent broker parsing
        await useBrokerTradeZero([
            makeTrade({ Account: 'AccountA', Symbol: 'AAPL' }),
            makeTrade({ Account: 'AccountA', Symbol: 'TSLA' }),
        ], ctxA)

        await useBrokerTradeZero([
            makeTrade({ Account: 'AccountB', Symbol: 'MSFT' }),
        ], ctxB)

        // Each ctx should only see its own trades
        expect(ctxA.tradesData).toHaveLength(2)
        expect(ctxB.tradesData).toHaveLength(1)
        expect(ctxA.tradesData[0].Account).toBe('AccountA')
        expect(ctxB.tradesData[0].Account).toBe('AccountB')

        // Global should be untouched
        expect(tradesData).toHaveLength(0)
    })

    it('two concurrent requests do not share timezone', () => {
        const ctxA = createRequestContext(
            { objectId: 'userA', timeZone: 'America/New_York' },
            'template', false
        )
        const ctxB = createRequestContext(
            { objectId: 'userB', timeZone: 'Asia/Tokyo' },
            'template', false
        )

        useGetTimeZone(ctxA)
        useGetTimeZone(ctxB)

        expect(ctxA.timeZoneTrade).toBe('America/New_York')
        expect(ctxB.timeZoneTrade).toBe('Asia/Tokyo')
        expect(timeZoneTrade.value).toBeUndefined()
    })

    it('two concurrent requests do not share broker selection', () => {
        const ctxA = createRequestContext(
            { objectId: 'userA' }, 'tradeZero', false
        )
        const ctxB = createRequestContext(
            { objectId: 'userB' }, 'interactiveBrokers', true
        )

        expect(ctxA.selectedBroker).toBe('tradeZero')
        expect(ctxB.selectedBroker).toBe('interactiveBrokers')
        expect(selectedBroker.value).toBeUndefined()
    })

    it('two concurrent requests do not share uploadMfePrices', () => {
        const ctxA = createRequestContext(
            { objectId: 'userA' }, 'template', true
        )
        const ctxB = createRequestContext(
            { objectId: 'userB' }, 'template', false
        )

        expect(ctxA.uploadMfePrices).toBe(true)
        expect(ctxB.uploadMfePrices).toBe(false)
        expect(uploadMfePrices.value).toBe(false)
    })

    it('two concurrent requests do not share currentUser', () => {
        const userA = { objectId: 'userA', username: 'alice', apis: [{ key: 'keyA' }] }
        const userB = { objectId: 'userB', username: 'bob', apis: [{ key: 'keyB' }] }

        const ctxA = createRequestContext(userA, 'template', false)
        const ctxB = createRequestContext(userB, 'template', false)

        expect(ctxA.currentUser.objectId).toBe('userA')
        expect(ctxB.currentUser.objectId).toBe('userB')
        expect(currentUser.value).toBeUndefined()
    })

    it('ctx pipeline state is fully isolated', async () => {
        const userA = { objectId: 'userA', timeZone: 'America/New_York' }
        const userB = { objectId: 'userB', timeZone: 'Europe/London' }

        const ctxA = createRequestContext(userA, 'template', false)
        const ctxB = createRequestContext(userB, 'template', false)

        // Simulate the full early pipeline for both
        useGetTimeZone(ctxA)
        useGetTimeZone(ctxB)

        await useBrokerTradeZero([
            makeTrade({ Account: 'A', Symbol: 'AAPL' })
        ], ctxA)

        await useBrokerTradeZero([
            makeTrade({ Account: 'B', Symbol: 'MSFT' }),
            makeTrade({ Account: 'B', Symbol: 'GOOG' }),
        ], ctxB)

        // Verify complete isolation
        expect(ctxA.timeZoneTrade).toBe('America/New_York')
        expect(ctxA.tradesData).toHaveLength(1)
        expect(ctxA.currentUser.objectId).toBe('userA')

        expect(ctxB.timeZoneTrade).toBe('Europe/London')
        expect(ctxB.tradesData).toHaveLength(2)
        expect(ctxB.currentUser.objectId).toBe('userB')

        // No leakage to globals
        expect(tradesData).toHaveLength(0)
        expect(timeZoneTrade.value).toBeUndefined()
        expect(currentUser.value).toBeUndefined()
    })
})

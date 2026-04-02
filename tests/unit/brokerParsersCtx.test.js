import { describe, it, expect, beforeEach } from 'vitest'
import { useBrokerTradeZero } from '../../src/utils/brokers.js'
import { tradesData } from '../../src/stores/globals.js'
import { createRequestContext } from '../../src/utils/requestContext.js'

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

describe('Broker parsers with ctx (request-scoped context)', () => {
    const mockUser = { objectId: 'u1', username: 'alice', apis: [] }

    beforeEach(() => {
        tradesData.length = 0
    })

    it('writes to ctx.tradesData instead of global when ctx is provided', async () => {
        const ctx = createRequestContext(mockUser, 'template', false)
        await useBrokerTradeZero([makeTrade()], ctx)

        expect(ctx.tradesData).toHaveLength(1)
        expect(ctx.tradesData[0].Symbol).toBe('AAPL')
        // Global should remain empty
        expect(tradesData).toHaveLength(0)
    })

    it('writes to global tradesData when ctx is not provided', async () => {
        await useBrokerTradeZero([makeTrade()])

        expect(tradesData).toHaveLength(1)
        expect(tradesData[0].Symbol).toBe('AAPL')
    })

    it('isolates two concurrent ctx instances from each other', async () => {
        const ctx1 = createRequestContext(mockUser, 'template', false)
        const ctx2 = createRequestContext(mockUser, 'template', false)

        await useBrokerTradeZero([makeTrade({ Symbol: 'AAPL' })], ctx1)
        await useBrokerTradeZero([makeTrade({ Symbol: 'MSFT' })], ctx2)

        expect(ctx1.tradesData).toHaveLength(1)
        expect(ctx1.tradesData[0].Symbol).toBe('AAPL')

        expect(ctx2.tradesData).toHaveLength(1)
        expect(ctx2.tradesData[0].Symbol).toBe('MSFT')

        // Global should remain empty
        expect(tradesData).toHaveLength(0)
    })

    it('handles multiple trades in ctx', async () => {
        const ctx = createRequestContext(mockUser, 'template', false)
        const trades = [
            makeTrade({ Symbol: 'AAPL', Side: 'B' }),
            makeTrade({ Symbol: 'AAPL', Side: 'S' }),
            makeTrade({ Symbol: 'MSFT', Side: 'B' }),
        ]
        await useBrokerTradeZero(trades, ctx)

        expect(ctx.tradesData).toHaveLength(3)
    })

    it('handles CSV string input with ctx', async () => {
        const ctx = createRequestContext(mockUser, 'template', false)
        const csv = [
            'Account,T/D,S/D,Currency,Type,Side,Symbol,Qty,Price,Exec Time,Comm,SEC,TAF,NSCC,Nasdaq,ECN Remove,ECN Add,Gross Proceeds,Net Proceeds,Clr Broker,Liq,Note',
            'TestAccount,10/13/2023,10/13/2023,USD,stock,B,AAPL,100,150.50,09:30:00,-1,0,0,0,0,0,0,-15050,-15051,,,'
        ].join('\n')

        await useBrokerTradeZero(csv, ctx)

        expect(ctx.tradesData).toHaveLength(1)
        expect(tradesData).toHaveLength(0)
    })
})

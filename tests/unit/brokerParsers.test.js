import { describe, it, expect, beforeEach } from 'vitest'
import { useBrokerTradeZero } from '../../src/utils/brokers.js'
import { tradesData } from '../../src/stores/globals.js'

// Helper to create a minimal valid trade row
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

describe('useBrokerTradeZero (Template parser)', () => {
    beforeEach(() => {
        tradesData.length = 0
    })

    describe('input formats', () => {
        it('parses CSV string input', async () => {
            const csv = [
                'Account,T/D,S/D,Currency,Type,Side,Symbol,Qty,Price,Exec Time,Comm,SEC,TAF,NSCC,Nasdaq,ECN Remove,ECN Add,Gross Proceeds,Net Proceeds,Clr Broker,Liq,Note',
                'TestAccount,10/13/2023,10/13/2023,USD,stock,B,AAPL,100,150.50,09:30:00,-1,0,0,0,0,0,0,-15050,-15051,,,'
            ].join('\n')

            await useBrokerTradeZero(csv)

            expect(tradesData).toHaveLength(1)
            expect(tradesData[0].Account).toBe('TestAccount')
            expect(tradesData[0].Symbol).toBe('AAPL')
            expect(tradesData[0].Side).toBe('B')
        })

        it('parses array input (API mode)', async () => {
            await useBrokerTradeZero([makeTrade()])

            expect(tradesData).toHaveLength(1)
            expect(tradesData[0].Account).toBe('TestAccount')
            expect(tradesData[0].Symbol).toBe('AAPL')
        })
    })

    describe('type handling', () => {
        it('sets default type to stock when type is empty', async () => {
            await useBrokerTradeZero([makeTrade({ Type: '' })])
            expect(tradesData[0].Type).toBe('stock')
        })

        it('sets default type to stock when type is invalid', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'invalid_type' })])
            expect(tradesData[0].Type).toBe('stock')
        })

        it('preserves valid type: stock', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'stock' })])
            expect(tradesData[0].Type).toBe('stock')
        })

        it('preserves valid type: future', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'future' })])
            expect(tradesData[0].Type).toBe('future')
        })

        it('preserves valid type: forex', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'forex' })])
            expect(tradesData[0].Type).toBe('forex')
        })

        it('preserves valid type: call', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'call' })])
            expect(tradesData[0].Type).toBe('call')
        })

        it('preserves valid type: put', async () => {
            await useBrokerTradeZero([makeTrade({ Type: 'put' })])
            expect(tradesData[0].Type).toBe('put')
        })
    })

    describe('symbol handling', () => {
        it('sets SymbolOriginal from Symbol', async () => {
            await useBrokerTradeZero([makeTrade({ Symbol: 'C:USDJPY' })])
            expect(tradesData[0].SymbolOriginal).toBe('C:USDJPY')
        })

        it('preserves symbol with special characters', async () => {
            await useBrokerTradeZero([makeTrade({ Symbol: 'BRK.B' })])
            expect(tradesData[0].Symbol).toBe('BRK.B')
            expect(tradesData[0].SymbolOriginal).toBe('BRK.B')
        })
    })

    describe('multiple trades', () => {
        it('handles multiple trades from CSV', async () => {
            const csv = [
                'Account,T/D,S/D,Currency,Type,Side,Symbol,Qty,Price,Exec Time,Comm,SEC,TAF,NSCC,Nasdaq,ECN Remove,ECN Add,Gross Proceeds,Net Proceeds,Clr Broker,Liq,Note',
                'Acc1,10/13/2023,10/13/2023,USD,stock,B,AAPL,100,150,09:30:00,-1,0,0,0,0,0,0,-15000,-15001,,,',
                'Acc1,10/13/2023,10/13/2023,USD,stock,S,AAPL,100,155,10:00:00,-1,0,0,0,0,0,0,15500,15499,,,'
            ].join('\n')

            await useBrokerTradeZero(csv)

            expect(tradesData).toHaveLength(2)
            expect(tradesData[0].Side).toBe('B')
            expect(tradesData[1].Side).toBe('S')
        })

        it('handles multiple trades from array', async () => {
            const trades = [
                makeTrade({ Symbol: 'AAPL', Side: 'B' }),
                makeTrade({ Symbol: 'MSFT', Side: 'SS' }),
            ]
            await useBrokerTradeZero(trades)

            expect(tradesData).toHaveLength(2)
            expect(tradesData[0].Symbol).toBe('AAPL')
            expect(tradesData[1].Symbol).toBe('MSFT')
        })

        it('accumulates into tradesData without clearing', async () => {
            await useBrokerTradeZero([makeTrade({ Symbol: 'AAPL' })])
            await useBrokerTradeZero([makeTrade({ Symbol: 'MSFT' })])

            expect(tradesData).toHaveLength(2)
        })
    })

    describe('data integrity', () => {
        it('deep-copies array input to avoid mutation', async () => {
            const original = makeTrade()
            await useBrokerTradeZero([original])

            // Modifying original should not affect tradesData
            original.Account = 'MODIFIED'
            expect(tradesData[0].Account).toBe('TestAccount')
        })

        it('preserves all fields from input', async () => {
            const trade = makeTrade({ Note: 'test note', Liq: 'A' })
            await useBrokerTradeZero([trade])

            expect(tradesData[0].Note).toBe('test note')
            expect(tradesData[0].Liq).toBe('A')
            expect(tradesData[0].Currency).toBe('USD')
            expect(tradesData[0]['Clr Broker']).toBe('')
        })
    })
})

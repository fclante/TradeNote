/**
 * Creates a request-scoped context object that holds all mutable state
 * for a single API trade import request. This isolates concurrent requests
 * from each other by avoiding shared globals.
 */
export function createRequestContext(user, broker, uploadMfe) {
    return {
        // User & request config
        currentUser: user,
        selectedBroker: broker,
        uploadMfePrices: !!uploadMfe,
        timeZoneTrade: null,

        // Trade data pipeline
        tradesData: [],
        tempExecutions: [],
        tradedSymbols: [],
        tradedStartDate: null,
        tradedEndDate: null,
        tradeAccounts: [],

        // Processed structures
        executions: {},
        trades: {},
        blotter: {},
        pAndL: {},

        // Existing data for dedup
        existingTradesArray: [],
        gotExistingTradesArray: false,
        existingImports: [],

        // Market data
        ohlcv: [],
        mfePrices: [],

        // Open positions
        openPositionsParse: [],
        openPositionsFile: [],
        openPosition: false,
        currentTradeId: null,
    }
}

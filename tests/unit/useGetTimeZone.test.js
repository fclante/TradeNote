import { describe, it, expect, beforeEach } from 'vitest'
import { createRequestContext } from '../../src/utils/requestContext.js'
import { useGetTimeZone } from '../../src/utils/utils.js'
import { timeZoneTrade, currentUser } from '../../src/stores/globals.js'

describe('useGetTimeZone with ctx', () => {
    beforeEach(() => {
        timeZoneTrade.value = undefined
        currentUser.value = undefined
    })

    it('sets ctx.timeZoneTrade from user timezone', () => {
        const ctx = createRequestContext(
            { objectId: 'u1', timeZone: 'Europe/London' },
            'template',
            false
        )
        useGetTimeZone(ctx)
        expect(ctx.timeZoneTrade).toBe('Europe/London')
        // Global should remain unchanged
        expect(timeZoneTrade.value).toBeUndefined()
    })

    it('defaults to America/New_York when user has no timezone', () => {
        const ctx = createRequestContext(
            { objectId: 'u1' },
            'template',
            false
        )
        useGetTimeZone(ctx)
        expect(ctx.timeZoneTrade).toBe('America/New_York')
    })

    it('sets global timeZoneTrade when no ctx provided', () => {
        currentUser.value = { objectId: 'u1', timeZone: 'Asia/Tokyo' }
        useGetTimeZone()
        expect(timeZoneTrade.value).toBe('Asia/Tokyo')
    })

    it('isolates timezone between two ctx instances', () => {
        const ctx1 = createRequestContext(
            { objectId: 'u1', timeZone: 'Europe/London' },
            'template',
            false
        )
        const ctx2 = createRequestContext(
            { objectId: 'u2', timeZone: 'Asia/Shanghai' },
            'template',
            false
        )
        useGetTimeZone(ctx1)
        useGetTimeZone(ctx2)
        expect(ctx1.timeZoneTrade).toBe('Europe/London')
        expect(ctx2.timeZoneTrade).toBe('Asia/Shanghai')
    })
})

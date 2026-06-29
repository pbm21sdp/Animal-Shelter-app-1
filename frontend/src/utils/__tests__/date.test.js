import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, formatPostedOn, formatTime, formatTimeAgo } from '../date.js'

// All timestamps chosen at 12:00 UTC so local-date stays consistent across timezones.
// Europe/Bucharest is UTC+3 in summer (EEST) and UTC+2 in winter (EET).

describe('formatDate', () => {
    it('returns "—" for null', () => {
        expect(formatDate(null)).toBe('—')
    })
    it('returns "—" for undefined', () => {
        expect(formatDate(undefined)).toBe('—')
    })
    it('returns "—" for an invalid date string', () => {
        expect(formatDate('not-a-date')).toBe('—')
    })

    it('formats UTC timestamp as short date in Bucharest timezone (summer, UTC+3)', () => {
        // 2026-06-27 08:23 UTC → 11:23 EEST — date stays June 27
        expect(formatDate('2026-06-27T08:23:00Z', 'short')).toBe('27 Jun 2026')
    })
    it('formats UTC timestamp as full date+time in Bucharest timezone (summer, UTC+3)', () => {
        expect(formatDate('2026-06-27T08:23:00Z', 'full')).toBe('27 Jun 2026, 11:23')
    })
    it('defaults to full format when no format argument is passed', () => {
        expect(formatDate('2026-06-27T08:23:00Z')).toBe('27 Jun 2026, 11:23')
    })

    it('treats bare ISO string (no timezone) as UTC via ensureUtc and produces the same result', () => {
        // '2026-06-27T08:23:00' — no Z — ensureUtc appends Z before parsing
        expect(formatDate('2026-06-27T08:23:00', 'short')).toBe('27 Jun 2026')
    })

    it('handles winter offset (UTC+2): 10:30 UTC → 12:30 EET', () => {
        expect(formatDate('2026-01-15T10:30:00Z', 'short')).toBe('15 Jan 2026')
    })
    it('handles winter full format: 10:30 UTC → 12:30 EET', () => {
        expect(formatDate('2026-01-15T10:30:00Z', 'full')).toBe('15 Jan 2026, 12:30')
    })
})

describe('formatPostedOn', () => {
    it('returns "" for null', () => {
        expect(formatPostedOn(null)).toBe('')
    })
    it('returns "" for undefined', () => {
        expect(formatPostedOn(undefined)).toBe('')
    })
    it('returns "" for an invalid date string', () => {
        expect(formatPostedOn('bad')).toBe('')
    })

    it('returns "Posted on … at …" with Bucharest time (summer, UTC+3)', () => {
        // 2026-06-27 08:23 UTC → 11:23 EEST
        expect(formatPostedOn('2026-06-27T08:23:00Z')).toBe('Posted on 27 Jun 2026 at 11:23')
    })
    it('handles winter offset (UTC+2): 10:30 UTC → 12:30 EET', () => {
        expect(formatPostedOn('2026-01-15T10:30:00Z')).toBe('Posted on 15 Jan 2026 at 12:30')
    })
})

describe('formatTime', () => {
    it('returns "" for null', () => {
        expect(formatTime(null)).toBe('')
    })
    it('returns "" for undefined', () => {
        expect(formatTime(undefined)).toBe('')
    })
    it('returns "" for an invalid date string', () => {
        expect(formatTime('garbage')).toBe('')
    })

    it('returns time-only string in Bucharest timezone (summer, UTC+3)', () => {
        // 2026-06-27 08:23 UTC → 11:23 EEST
        expect(formatTime('2026-06-27T08:23:00Z')).toBe('11:23')
    })
    it('handles midnight UTC in winter (UTC+2): 00:00 UTC → 02:00 EET', () => {
        expect(formatTime('2026-01-15T00:00:00Z')).toBe('02:00')
    })
})

describe('formatTimeAgo', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('returns "" for null', () => {
        expect(formatTimeAgo(null)).toBe('')
    })
    it('returns "" for undefined', () => {
        expect(formatTimeAgo(undefined)).toBe('')
    })

    it('returns "just now" for 30 seconds ago', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-27T09:59:30Z')).toBe('just now')
    })
    it('returns "just now" at exactly the same timestamp (diff = 0)', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-27T10:00:00Z')).toBe('just now')
    })
    it('returns "just now" for a slightly future timestamp (negative diff < 60 000 ms)', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-27T10:00:30Z')).toBe('just now')
    })

    it('returns "1m ago" at exactly 1 minute', () => {
        vi.setSystemTime(new Date('2026-06-27T10:01:00Z'))
        expect(formatTimeAgo('2026-06-27T10:00:00Z')).toBe('1m ago')
    })
    it('returns "5m ago" for 5 minutes ago', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-27T09:55:00Z')).toBe('5m ago')
    })

    it('returns "1h ago" at exactly 60 minutes', () => {
        vi.setSystemTime(new Date('2026-06-27T11:00:00Z'))
        expect(formatTimeAgo('2026-06-27T10:00:00Z')).toBe('1h ago')
    })
    it('returns "3h ago" for 3 hours ago', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-27T07:00:00Z')).toBe('3h ago')
    })

    it('returns "1d ago" at exactly 24 hours', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-26T10:00:00Z')).toBe('1d ago')
    })
    it('returns "2d ago" for 2 days ago', () => {
        vi.setSystemTime(new Date('2026-06-27T10:00:00Z'))
        expect(formatTimeAgo('2026-06-25T10:00:00Z')).toBe('2d ago')
    })
})

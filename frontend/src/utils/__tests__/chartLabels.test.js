import { describe, it, expect } from 'vitest'
import { makeRechartsXAxisFormatter, makeChartJsLabelFormatter } from '../chartLabels.js'

// All ISO dates use T12:00:00Z so getFullYear()/getDate() stay consistent
// in any real-world timezone (avoids midnight edge cases).

describe('makeRechartsXAxisFormatter', () => {
    const chartData = [
        { date: '2025-01-15T12:00:00Z' }, // index 0 — first tick
        { date: '2025-06-15T12:00:00Z' }, // index 1 — same year
        { date: '2026-01-15T12:00:00Z' }, // index 2 — year changes
    ]

    describe('monthly view', () => {
        const fmt = makeRechartsXAxisFormatter(chartData, 'monthly')

        it('first tick always shows "Mon YYYY"', () => {
            expect(fmt('2025-01-15T12:00:00Z', 0)).toBe('Jan 2025')
        })

        it('subsequent tick in same year shows only month abbreviation', () => {
            expect(fmt('2025-06-15T12:00:00Z', 1)).toBe('Jun')
        })

        it('tick where year changes shows "Mon YYYY" again', () => {
            expect(fmt('2026-01-15T12:00:00Z', 2)).toBe('Jan 2026')
        })
    })

    describe('daily / weekly view', () => {
        const fmt = makeRechartsXAxisFormatter(chartData, 'daily')

        it('first tick shows "Mon YYYY"', () => {
            expect(fmt('2025-01-15T12:00:00Z', 0)).toBe('Jan 2025')
        })

        it('subsequent tick in same year shows "M/D" format', () => {
            // compute expected dynamically so the test is timezone-safe
            const d = new Date('2025-06-15T12:00:00Z')
            const expected = `${d.getMonth() + 1}/${d.getDate()}`
            expect(fmt('2025-06-15T12:00:00Z', 1)).toBe(expected)
        })

        it('tick where year changes shows "Mon YYYY" again', () => {
            expect(fmt('2026-01-15T12:00:00Z', 2)).toBe('Jan 2026')
        })
    })

    describe('weekly view (same behaviour as daily for non-monthly)', () => {
        const fmt = makeRechartsXAxisFormatter(chartData, 'weekly')

        it('first tick shows "Mon YYYY"', () => {
            expect(fmt('2025-01-15T12:00:00Z', 0)).toBe('Jan 2025')
        })

        it('tick where year changes shows "Mon YYYY"', () => {
            expect(fmt('2026-01-15T12:00:00Z', 2)).toBe('Jan 2026')
        })
    })
})

describe('makeChartJsLabelFormatter', () => {
    // allLabels follow the "MMM YY" convention used by the backend ML service
    const allLabels = ['Jan 25', 'Feb 25', 'Mar 25', 'Jan 26', 'Feb 26']
    const fmt = makeChartJsLabelFormatter(allLabels)

    it('first label shows full 4-digit year ("Jan 2025")', () => {
        expect(fmt(null, 0)).toBe('Jan 2025')
    })

    it('second label in the same year shows only month ("Feb")', () => {
        expect(fmt(null, 1)).toBe('Feb')
    })

    it('third label in the same year also shows only month ("Mar")', () => {
        expect(fmt(null, 2)).toBe('Mar')
    })

    it('label where year changes shows full 4-digit year ("Jan 2026")', () => {
        expect(fmt(null, 3)).toBe('Jan 2026')
    })

    it('next label in the new year shows only month ("Feb")', () => {
        expect(fmt(null, 4)).toBe('Feb')
    })

    it('returns "" for an out-of-bounds index', () => {
        expect(fmt(null, 99)).toBe('')
    })

    describe('single-element array', () => {
        it('index 0 always shows the full year', () => {
            const singleFmt = makeChartJsLabelFormatter(['Apr 26'])
            expect(singleFmt(null, 0)).toBe('Apr 2026')
        })
    })

    describe('year-boundary: two consecutive years with single month each', () => {
        const twoYear = makeChartJsLabelFormatter(['Dec 25', 'Jan 26'])

        it('Dec 25 → "Dec 2025"', () => {
            expect(twoYear(null, 0)).toBe('Dec 2025')
        })

        it('Jan 26 → "Jan 2026" (year changed)', () => {
            expect(twoYear(null, 1)).toBe('Jan 2026')
        })
    })
})

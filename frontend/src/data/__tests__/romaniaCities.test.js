import { describe, it, expect } from 'vitest'
import { haversineKm, getCityCoords, ROMANIA_CITIES } from '../romaniaCities.js'

describe('haversineKm', () => {
    it('returns exactly 0 for identical coordinates', () => {
        const { lat, lng } = ROMANIA_CITIES['Timișoara']
        expect(haversineKm(lat, lng, lat, lng)).toBe(0)
    })

    it('calculates Timișoara → Arad straight-line distance within ±5 km of ~49 km', () => {
        const { lat: lat1, lng: lng1 } = ROMANIA_CITIES['Timișoara']
        const { lat: lat2, lng: lng2 } = ROMANIA_CITIES['Arad']
        const dist = haversineKm(lat1, lng1, lat2, lng2)
        expect(dist).toBeGreaterThan(44)
        expect(dist).toBeLessThan(54)
    })

    it('distance is symmetric: A→B equals B→A', () => {
        const tm = ROMANIA_CITIES['Timișoara']
        const buc = ROMANIA_CITIES['București']
        const d1 = haversineKm(tm.lat, tm.lng, buc.lat, buc.lng)
        const d2 = haversineKm(buc.lat, buc.lng, tm.lat, tm.lng)
        expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
    })

    it('calculates Cluj-Napoca → Sibiu straight-line distance within ±10 km of ~115 km', () => {
        const clj = ROMANIA_CITIES['Cluj-Napoca']
        const sib = ROMANIA_CITIES['Sibiu']
        const dist = haversineKm(clj.lat, clj.lng, sib.lat, sib.lng)
        expect(dist).toBeGreaterThan(105)
        expect(dist).toBeLessThan(125)
    })

    it('returns a positive distance for any two distinct cities', () => {
        const tm = ROMANIA_CITIES['Timișoara']
        const ia = ROMANIA_CITIES['Iași']
        expect(haversineKm(tm.lat, tm.lng, ia.lat, ia.lng)).toBeGreaterThan(0)
    })
})

describe('getCityCoords', () => {
    it('returns coordinates for an exact-match city name', () => {
        expect(getCityCoords('Timișoara')).toEqual({ lat: 45.7489, lng: 21.2087 })
    })

    it('returns coordinates with case-insensitive lookup ("timișoara")', () => {
        const result = getCityCoords('timișoara')
        expect(result).toEqual({ lat: 45.7489, lng: 21.2087 })
    })

    it('returns coordinates for all-uppercase city name ("ARAD")', () => {
        expect(getCityCoords('ARAD')).toEqual({ lat: 46.1866, lng: 21.3123 })
    })

    it('returns coordinates for "Timisoara" (without diacritic, listed as alias in dict)', () => {
        // ROMANIA_CITIES contains both 'Timișoara' and 'Timisoara' as explicit entries
        expect(getCityCoords('Timisoara')).toEqual({ lat: 45.7489, lng: 21.2087 })
    })

    it('returns coordinates for lowercase alias without diacritic ("timisoara")', () => {
        // Matched via case-insensitive loop against the 'Timisoara' alias key
        expect(getCityCoords('timisoara')).toEqual({ lat: 45.7489, lng: 21.2087 })
    })

    it('returns null for a completely unknown city name', () => {
        expect(getCityCoords('NonExistentCity')).toBeNull()
    })

    it('returns null for null input', () => {
        expect(getCityCoords(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
        expect(getCityCoords(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(getCityCoords('')).toBeNull()
    })
})

import { describe, it, expect } from 'vitest'
import { buildPetTags } from '../petTags.js'

describe('buildPetTags', () => {
    it('returns an empty array when no relevant fields are set', () => {
        expect(buildPetTags({})).toEqual([])
    })

    // ── 1. Urgent tag ──────────────────────────────────────────────────────────

    describe('Urgent tag', () => {
        it('is the first tag and has variant "urgent" when current_status is needs_urgent_care', () => {
            const tags = buildPetTags({ current_status: 'needs_urgent_care' })
            expect(tags[0]).toEqual({ label: 'Urgent', variant: 'urgent' })
        })

        it('is NOT added for other current_status values', () => {
            const tags = buildPetTags({ current_status: 'foster' })
            expect(tags.find(t => t.label === 'Urgent')).toBeUndefined()
        })
    })

    // ── 2. Accent tags ─────────────────────────────────────────────────────────

    describe('Foster and Special needs tags', () => {
        it('adds Foster tag with variant "accent" for current_status foster', () => {
            const tags = buildPetTags({ current_status: 'foster' })
            expect(tags).toContainEqual({ label: 'Foster', variant: 'accent' })
        })

        it('adds Special needs tag with variant "accent" for current_status special_needs', () => {
            const tags = buildPetTags({ current_status: 'special_needs' })
            expect(tags).toContainEqual({ label: 'Special needs', variant: 'accent' })
        })

        it('does not add any accent tag when current_status is neither foster nor special_needs', () => {
            const tags = buildPetTags({ current_status: 'needs_urgent_care' })
            expect(tags.filter(t => t.variant === 'accent')).toHaveLength(0)
        })
    })

    // ── 3. Situation tag ───────────────────────────────────────────────────────

    describe('Situation tag', () => {
        it('adds "Stray" for found_on_street', () => {
            const tags = buildPetTags({ situation: 'found_on_street' })
            expect(tags).toContainEqual({ label: 'Stray', variant: 'default' })
        })

        it('adds "Seems lost" for appears_lost', () => {
            const tags = buildPetTags({ situation: 'appears_lost' })
            expect(tags).toContainEqual({ label: 'Seems lost', variant: 'default' })
        })

        it('adds "Rescued" for rescued_from_danger', () => {
            const tags = buildPetTags({ situation: 'rescued_from_danger' })
            expect(tags).toContainEqual({ label: 'Rescued', variant: 'default' })
        })

        it('does NOT generate a tag for situation "other"', () => {
            const tags = buildPetTags({ situation: 'other' })
            expect(tags).toHaveLength(0)
        })
    })

    // ── 4. Neutered / Spayed tag ───────────────────────────────────────────────

    describe('Neutered/Spayed tag', () => {
        it('shows "Neutered" for neutered_spayed_status=yes and gender=male', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'yes', gender: 'male' })
            expect(tags).toContainEqual({ label: 'Neutered', variant: 'default' })
        })

        it('shows "Spayed" for neutered_spayed_status=yes and gender=female', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'yes', gender: 'female' })
            expect(tags).toContainEqual({ label: 'Spayed', variant: 'default' })
        })

        it('shows "Fixed" for neutered_spayed_status=yes with no gender information', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'yes' })
            expect(tags).toContainEqual({ label: 'Fixed', variant: 'default' })
        })

        it('shows "Not neutered" for neutered_spayed_status=no and gender=male', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'no', gender: 'male' })
            expect(tags).toContainEqual({ label: 'Not neutered', variant: 'default' })
        })

        it('shows "Not spayed" for neutered_spayed_status=no and gender=female', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'no', gender: 'female' })
            expect(tags).toContainEqual({ label: 'Not spayed', variant: 'default' })
        })

        it('skips neutered tag entirely when status is "unknown"', () => {
            const tags = buildPetTags({ neutered_spayed_status: 'unknown' })
            expect(tags).toHaveLength(0)
        })
    })

    // ── 5. "no" and "unknown" visibility rules ────────────────────────────────

    describe('status "no" generates a visible tag; "unknown" is always hidden', () => {
        it('microchip "no" → "No chip" tag', () => {
            const tags = buildPetTags({ microchip_status: 'no' })
            expect(tags).toContainEqual({ label: 'No chip', variant: 'default' })
        })

        it('microchip "yes" → "Microchipped" tag', () => {
            const tags = buildPetTags({ microchip_status: 'yes' })
            expect(tags).toContainEqual({ label: 'Microchipped', variant: 'default' })
        })

        it('microchip "unknown" → no tag', () => {
            const tags = buildPetTags({ microchip_status: 'unknown' })
            expect(tags).toHaveLength(0)
        })

        it('vaccination "no" → "Unvaccinated" tag', () => {
            const tags = buildPetTags({ vaccination_status: 'no' })
            expect(tags).toContainEqual({ label: 'Unvaccinated', variant: 'default' })
        })

        it('deworming "no" → "Not dewormed" tag', () => {
            const tags = buildPetTags({ deworming_status: 'no' })
            expect(tags).toContainEqual({ label: 'Not dewormed', variant: 'default' })
        })

        it('deworming "unknown" → no tag', () => {
            const tags = buildPetTags({ deworming_status: 'unknown' })
            expect(tags).toHaveLength(0)
        })
    })

    // ── 6. Ordering ────────────────────────────────────────────────────────────

    describe('tag ordering', () => {
        it('Urgent → situation → neutered → vaccination (full order check)', () => {
            const pet = {
                current_status: 'needs_urgent_care',
                situation: 'found_on_street',
                neutered_spayed_status: 'yes',
                gender: 'female',
                vaccination_status: 'fully',
            }
            expect(buildPetTags(pet).map(t => t.label))
                .toEqual(['Urgent', 'Stray', 'Spayed', 'Vaccinated'])
        })

        it('Foster (accent) appears before situation tags', () => {
            const pet = { current_status: 'foster', situation: 'rescued_from_danger' }
            const labels = buildPetTags(pet).map(t => t.label)
            expect(labels.indexOf('Foster')).toBeLessThan(labels.indexOf('Rescued'))
        })

        it('microchip appears before neutered in the tag list', () => {
            const pet = {
                microchip_status: 'yes',
                neutered_spayed_status: 'yes',
                gender: 'male',
            }
            const labels = buildPetTags(pet).map(t => t.label)
            expect(labels.indexOf('Microchipped')).toBeLessThan(labels.indexOf('Neutered'))
        })
    })
})

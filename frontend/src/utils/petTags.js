// Shared pet tag logic — used by AnimalsPage (card list) and PetDetailPage

export const SITUATION_LABELS = {
    found_on_street:     'Stray',
    appears_lost:        'Seems lost',
    went_missing:        'Missing',
    owner_surrendered:   'Surrendered',
    rescued_from_danger: 'Rescued',
    // 'other' intentionally omitted — custom text; no tag shown
};

export const VACCINATION_LABELS = {
    fully:    'Vaccinated',
    partially:'Partial vax',
    no:       'Unvaccinated',
};

export const MICROCHIP_LABELS = {
    yes: 'Microchipped',
    no:  'No chip',
};

function getNeuteredLabel(status, gender) {
    const g = (gender || '').toLowerCase();
    if (status === 'yes') {
        if (g === 'male')   return 'Neutered';
        if (g === 'female') return 'Spayed';
        return 'Fixed';
    }
    if (status === 'no') {
        if (g === 'male')   return 'Not neutered';
        if (g === 'female') return 'Not spayed';
        return 'Not fixed';
    }
    return null;
}

/**
 * Builds an array of status tags for a pet using the DB columns.
 * Order: Urgent → accent statuses → situation → microchip → neutered/spayed → vaccination
 *
 * Tag shape: { label: string, variant: 'urgent' | 'accent' | 'default' }
 *   urgent  — red background, white text
 *   accent  — warm amber tint
 *   default — neutral muted
 *
 * @param {object} pet
 * @returns {{ label: string, variant: 'urgent' | 'accent' | 'default' }[]}
 */
export function buildPetTags(pet) {
    const tags = [];

    // 1. Urgent — visually distinct, always first
    if (pet.current_status === 'needs_urgent_care') {
        tags.push({ label: 'Urgent', variant: 'urgent' });
    }

    // 2. Accent statuses
    if (pet.current_status === 'foster') {
        tags.push({ label: 'Foster', variant: 'accent' });
    } else if (pet.current_status === 'special_needs') {
        tags.push({ label: 'Special needs', variant: 'accent' });
    }

    // 3. Situation — skip 'other' (no standard label for custom text)
    if (pet.situation && pet.situation !== 'other') {
        const label = SITUATION_LABELS[pet.situation];
        if (label) tags.push({ label, variant: 'default' });
    }

    // 4. Microchip — skip unknown
    if (pet.microchip_status && pet.microchip_status !== 'unknown') {
        const label = MICROCHIP_LABELS[pet.microchip_status];
        if (label) tags.push({ label, variant: 'default' });
    }

    // 5. Neutered/Spayed — skip unknown
    if (pet.neutered_spayed_status && pet.neutered_spayed_status !== 'unknown') {
        const label = getNeuteredLabel(pet.neutered_spayed_status, pet.gender);
        if (label) tags.push({ label, variant: 'default' });
    }

    // 6. Vaccination — skip unknown
    if (pet.vaccination_status && pet.vaccination_status !== 'unknown') {
        const label = VACCINATION_LABELS[pet.vaccination_status];
        if (label) tags.push({ label, variant: 'default' });
    }

    return tags;
}

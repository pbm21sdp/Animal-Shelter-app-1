// Shared pet tag logic — used by AnimalsPage (card list) and PetDetailPage

export const SITUATION_LABELS = {
    found_on_street:     'Stray',
    appears_lost:        'Seems lost',
    went_missing:        'Missing',
    owner_surrendered:   'Surrendered',
    rescued_from_danger: 'Rescued',
    other:               'Other',
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

// Returns neutered/spayed label based on status + gender.
// If gender is missing/unrecognised, falls back to "Fixed"/"Not fixed"/"Unknown".
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
 * Builds an array of status tags for a pet using the new DB columns.
 * Order: Urgent → situation → microchip → neutered/spayed → vaccination
 * All tags (including 'no'/'unknown') are always included — nothing is hidden.
 *
 * @param {object} pet
 * @returns {{ label: string, urgent: boolean }[]}
 */
export function buildPetTags(pet) {
    const tags = [];

    // 1. Urgent — visually distinct, always first
    if (pet.current_status === 'needs_urgent_care') {
        tags.push({ label: 'Urgent', urgent: true });
    }

    // 2. Situation
    if (pet.situation) {
        tags.push({ label: SITUATION_LABELS[pet.situation] || 'Other', urgent: false });
    }

    // 3. Microchip — skip unknown
    if (pet.microchip_status && pet.microchip_status !== 'unknown') {
        const label = MICROCHIP_LABELS[pet.microchip_status];
        if (label) tags.push({ label, urgent: false });
    }

    // 4. Neutered/Spayed — skip unknown
    if (pet.neutered_spayed_status && pet.neutered_spayed_status !== 'unknown') {
        const label = getNeuteredLabel(pet.neutered_spayed_status, pet.gender);
        if (label) tags.push({ label, urgent: false });
    }

    // 5. Vaccination — skip unknown
    if (pet.vaccination_status && pet.vaccination_status !== 'unknown') {
        const label = VACCINATION_LABELS[pet.vaccination_status];
        if (label) tags.push({ label, urgent: false });
    }

    return tags;
}

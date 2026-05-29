import type { FamousPerson } from '../../../../types';

/** Chi può vedere quali personaggi: admin = tutti, public = solo published. */
export type CityPeopleAudience = 'public' | 'admin';

/**
 * Unico punto di verità per la visibilità dei personaggi famosi.
 * Usato da getCityPeople e dal ramo API di getCityDetails.
 */
export function filterFamousPeopleByAudience(
    people: FamousPerson[],
    audience: CityPeopleAudience,
): FamousPerson[] {
    if (audience === 'admin') {
        return people;
    }
    return people.filter((person) => person.status === 'published');
}

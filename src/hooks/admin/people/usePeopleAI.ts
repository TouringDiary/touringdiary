import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useCityEditor } from '@/context/CityEditorContext';
import {
  canPublishFamousPerson,
  type FamousPersonPublishAttemptResult,
  type FamousPersonRequiredField,
  getMissingFamousPersonFields,
  isFamousPersonPublishBlockedError,
} from '@/domain/city/famousPersonCompleteness';
import { buildLifespanDisplay } from '@/domain/city/famousPersonDates';
import { enrichPersonData, suggestCityPeople } from '../../../services/ai';
import { isAiProviderQuotaExhaustedError } from '../../../services/ai/aiEdgeErrors';
import { generateHistoricalPortrait } from '../../../services/ai/aiVision';
import { validateAiSpecificSlugs } from '../../../services/ai/generators/peopleCategoryValidation';
import {
  ensureFamousPersonCompletenessWithAi,
  generateFamousPersonRequiredField,
  recoverPersonDatesFromAi,
  resolvePortraitCategoryLabel,
  toCompleteFamousPersonRequiredFields,
  toDraftFamousPersonSaveFields,
} from '../../../services/ai/generators/peopleCompletenessPipeline';
import type { PersonDiscoveryResult } from '../../../services/ai/generators/peopleGenerator';
import type { SaveCityPersonInput } from '../../../services/city/entitiesService';
import { loadFamousPersonTaxonomy } from '../../../services/city/famousPersonCategoryService';
import { saveCityPerson } from '../../../services/cityService';
import { findExistingPortrait } from '../../../services/mediaService';
import type { FamousPerson } from '../../../types/index';

/** Delay tra Magic Fix in batch: evita rate limit Gemini (stesso pattern Magic/Complete city). */
const BULK_FIX_THROTTLE_MS = 5000;

interface UsePeopleAIProps {
  cityId: string;
  cityName: string;
  peopleList: FamousPerson[];
  setPeopleList: React.Dispatch<React.SetStateAction<FamousPerson[]>>;
  reloadList: () => Promise<void>;
  selectedIds: Set<string>;
  resetSelection: () => void;
}

export type { FamousPersonPublishAttemptResult };

type PersonDiscoveryResultWithId = PersonDiscoveryResult & { id: string };

function toSaveCityPersonInput(person: FamousPerson): SaveCityPersonInput {
  return {
    id: person.id,
    name: person.name,
    bio: person.bio,
    imageUrl: person.imageUrl,
    image_status: person.image_status,
    imageAsset: person.imageAsset,
    fullBio: person.fullBio,
    quote: person.quote,
    lifespanDisplay: person.lifespanDisplay,
    birthYear: person.birthYear,
    birthDate: person.birthDate,
    isLiving: person.isLiving,
    deathYear: person.deathYear,
    deathDate: person.deathDate,
    categories: person.categories,
    famousWorks: person.famousWorks,
    awards: person.awards,
    privateLife: person.privateLife,
    collaborations: person.collaborations,
    careerStats: person.careerStats,
    relatedPlaces: person.relatedPlaces,
    status: person.status,
    orderIndex: person.orderIndex,
    specificCategoryIds:
      person.categories?.map((c) => c.specificId).filter((id): id is string => Boolean(id)) ?? [],
  };
}

async function loadActiveSpecifics(): Promise<{ slug: string; id: string; label: string }[]> {
  const taxonomy = await loadFamousPersonTaxonomy({ activeOnly: true });
  return taxonomy.specifics.map((s) => ({ slug: s.slug, id: s.id, label: s.label }));
}

function categoryLabelFromSlugs(
  slugs: string[] | undefined,
  activeSpecifics: { slug: string; id: string; label: string }[],
): string {
  if (!slugs || slugs.length === 0) return 'personaggio storico';
  for (const slug of slugs) {
    const match = activeSpecifics.find((s) => s.slug === slug);
    if (match?.label) return match.label;
  }
  return 'personaggio storico';
}

export const usePeopleAI = ({
  cityId,
  cityName,
  peopleList,
  setPeopleList,
  reloadList,
  selectedIds,
  resetSelection,
}: UsePeopleAIProps) => {
  const { reloadCurrentCity } = useCityEditor();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<PersonDiscoveryResultWithId[]>([]);
  const [fieldGenerating, setFieldGenerating] = useState<{
    personId: string;
    field: FamousPersonRequiredField | 'dates';
  } | null>(null);
  const activeDiscoveryRequestIdRef = useRef(0);

  useEffect(() => {
    if (!cityId) return;
    activeDiscoveryRequestIdRef.current++;
    setDiscoveryResults([]);
    setIsDiscovering(false);
  }, [cityId]);

  const runDiscovery = async (query: string, count: number) => {
    const requestId = ++activeDiscoveryRequestIdRef.current;
    setIsDiscovering(true);
    try {
      const existingNames = peopleList.map((p) => p.name);
      const results = await suggestCityPeople(cityName, existingNames, query, count);
      if (requestId !== activeDiscoveryRequestIdRef.current) return;
      const resultsWithIds: PersonDiscoveryResultWithId[] = results.map((r) => ({
        ...r,
        id: r.id ?? crypto.randomUUID(),
      }));
      setDiscoveryResults(resultsWithIds);
    } catch (e) {
      if (requestId === activeDiscoveryRequestIdRef.current) {
        console.error('[usePeopleAI] runDiscovery failed', e);
        const technical = e instanceof Error ? e.message : String(e);
        // Stesso pattern di feedback già usato in CulturePeople (alert); toast AdminCityEditor non è cablato qui.
        alert(
          `Discovery AI non riuscita.\n\n${technical || 'Errore sconosciuto.'}\n\nRiprova tra poco o verifica la connessione AI.`,
        );
      }
    } finally {
      if (requestId === activeDiscoveryRequestIdRef.current) {
        setIsDiscovering(false);
      }
    }
  };

  const importDiscoveryPerson = async (person: PersonDiscoveryResultWithId) => {
    setDiscoveryResults((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, isImporting: true } : p)),
    );
    try {
      const activeSpecifics = await loadActiveSpecifics();
      const slugValidation = validateAiSpecificSlugs(
        person.specificCategorySlugs ?? [],
        activeSpecifics,
      );
      if (!slugValidation.ok) {
        const invalidList = slugValidation.invalid.join(', ') || 'nessuna categoria';
        throw new Error(`Categorie AI non valide per «${person.name}»: ${invalidList}`);
      }

      // Reuse cross-città per nome (ilike): pattern architetturale condiviso con Magic/Complete city.
      // L'identità FamousPerson in discovery è il nome; non esiste ancora un personId persistito.
      let seedImage: string | undefined = (await findExistingPortrait(person.name)) ?? undefined;
      let skipImageAiRecovery = false;
      if (!seedImage) {
        const categoryLabel = categoryLabelFromSlugs(person.specificCategorySlugs, activeSpecifics);
        try {
          seedImage =
            (await generateHistoricalPortrait(person.name, categoryLabel, cityName)) ?? undefined;
        } catch (e) {
          if (isAiProviderQuotaExhaustedError(e)) {
            skipImageAiRecovery = true;
            console.warn(
              `[usePeopleAI] Portrait AI quota exhausted for «${person.name}»; import continues without AI photo.`,
            );
          } else {
            throw e;
          }
        }
      }

      const recovered = await ensureFamousPersonCompletenessWithAi(
        {
          ...person,
          specificCategoryIds: slugValidation.ids,
          imageUrl: seedImage ?? person.imageUrl,
        },
        cityName,
        undefined,
        skipImageAiRecovery ? { skipImageAiRecovery: true } : undefined,
      );

      const present = toDraftFamousPersonSaveFields(recovered.person);
      if (!present.name) {
        throw new Error('Import fallito: nome personaggio assente dopo recovery.');
      }

      const newPerson: SaveCityPersonInput = {
        name: present.name,
        bio: present.bio ?? null,
        imageUrl: present.imageUrl ?? null,
        specificCategoryIds: present.specificCategoryIds ?? slugValidation.ids,
        birthYear: present.birthYear ?? person.birthYear ?? null,
        birthDate: present.birthDate ?? person.birthDate ?? null,
        ...(typeof (present.isLiving ?? person.isLiving) === 'boolean'
          ? { isLiving: present.isLiving ?? person.isLiving }
          : {}),
        deathYear: present.deathYear ?? person.deathYear ?? null,
        deathDate: present.deathDate ?? person.deathDate ?? null,
        status: 'draft',
        orderIndex: peopleList.length + 1,
        quote: person.quote,
        famousWorks: person.famousWorks,
        relatedPlaces: person.relatedPlaces,
        fullBio: recovered.person.fullBio ?? person.fullBio,
        privateLife: person.privateLife,
        collaborations: person.collaborations,
        awards: person.awards,
        careerStats: person.careerStats,
      };
      const saved = await saveCityPerson(cityId, newPerson);
      setPeopleList((prev) => [...prev, saved]);
      setDiscoveryResults((prev) => prev.filter((p) => p.id !== person.id));
      await reloadCurrentCity();
    } catch (e) {
      console.error('[usePeopleAI] importDiscoveryPerson failed', e);
      setDiscoveryResults((prev) =>
        prev.map((p) => (p.id === person.id ? { ...p, isImporting: false } : p)),
      );
      const technical = e instanceof Error ? e.message : String(e);
      if (technical.includes('Categorie AI non valide')) {
        const detail = technical.replace(/^Categorie AI non valide per «[^»]*»:\s*/, '').trim();
        alert(
          `Importazione non riuscita per «${person.name}».\n\n` +
            `Le categorie proposte dall'AI non corrispondono allo standard attivo del progetto` +
            (detail ? ` (${detail})` : '') +
            `.\n\nRipeti la discovery oppure importa dopo un nuovo tentativo con categorie valide.`,
        );
      } else {
        alert(
          `Importazione non riuscita per «${person.name}».\n\n${technical || 'Errore sconosciuto.'}`,
        );
      }
    }
  };

  const removeDiscoveryResult = (id: string) => {
    setDiscoveryResults((prev) => prev.filter((p) => p.id !== id));
  };

  const wipeAndRewritePerson = async (person: FamousPerson) => {
    if (!person.id) return;
    if (!isBulkProcessing) setProcessingId(person.id);

    try {
      const enrichedData = await enrichPersonData(person.name, cityName);
      if (!enrichedData) {
        throw new Error("L'AI non ha restituito dati validi.");
      }

      const activeSpecifics = await loadActiveSpecifics();

      let specificCategoryIds = person.categories?.map((c) => c.specificId).filter(Boolean) ?? [];
      if (enrichedData.specificCategorySlugs?.length) {
        const slugValidation = validateAiSpecificSlugs(
          enrichedData.specificCategorySlugs,
          activeSpecifics,
        );
        if (slugValidation.ok) {
          specificCategoryIds = slugValidation.ids;
        } else {
          console.warn(
            `[usePeopleAI] Slug categorie AI invalidi per ${person.name}:`,
            slugValidation.invalid,
          );
        }
      }

      const recovered = await ensureFamousPersonCompletenessWithAi(
        {
          ...person,
          ...enrichedData,
          name: person.name,
          bio: enrichedData.bio || person.bio,
          imageUrl: person.imageUrl,
          specificCategoryIds,
          categories: person.categories,
          birthYear: enrichedData.birthYear ?? person.birthYear,
          birthDate: enrichedData.birthDate ?? person.birthDate,
          isLiving: enrichedData.isLiving ?? person.isLiving,
          deathYear: enrichedData.deathYear ?? person.deathYear,
          deathDate: enrichedData.deathDate ?? person.deathDate,
          fullBio: enrichedData.fullBio ?? person.fullBio,
        },
        cityName,
      );

      const present = toDraftFamousPersonSaveFields(recovered.person);
      if (!present.name) {
        throw new Error('Bonifica fallita: nome assente.');
      }

      const payload: SaveCityPersonInput = {
        id: person.id,
        name: present.name,
        bio: present.bio ?? enrichedData.bio ?? person.bio ?? null,
        imageUrl: present.imageUrl ?? person.imageUrl ?? null,
        image_status: person.image_status,
        imageAsset: person.imageAsset,
        fullBio: recovered.person.fullBio ?? enrichedData.fullBio ?? person.fullBio,
        quote: enrichedData.quote ?? person.quote,
        lifespanDisplay: person.lifespanDisplay,
        birthYear: present.birthYear ?? null,
        birthDate: present.birthDate ?? null,
        isLiving: present.isLiving ?? person.isLiving,
        deathYear: present.deathYear ?? null,
        deathDate: present.deathDate ?? null,
        categories: person.categories,
        famousWorks: enrichedData.famousWorks ?? person.famousWorks,
        awards: enrichedData.awards ?? person.awards,
        privateLife: enrichedData.privateLife ?? person.privateLife,
        collaborations: enrichedData.collaborations ?? person.collaborations,
        careerStats: enrichedData.careerStats ?? person.careerStats,
        relatedPlaces: enrichedData.relatedPlaces ?? person.relatedPlaces,
        status: 'draft',
        orderIndex: person.orderIndex,
        specificCategoryIds: present.specificCategoryIds ?? specificCategoryIds,
      };
      const saved = await saveCityPerson(cityId, payload);
      setPeopleList((prev) => prev.map((p) => (p.id === person.id ? saved : p)));

      return {
        success: true,
        complete: recovered.complete,
        missingFields: recovered.missingFields,
      };
    } catch (e: unknown) {
      console.error(`Errore Wipe & Rewrite per ${person.name}:`, e);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    } finally {
      if (!isBulkProcessing) setProcessingId(null);
    }
  };

  const regeneratePortrait = async (person: FamousPerson) => {
    if (!person.id) return false;
    if (processingId === person.id) return false;
    const categoryLabel = resolvePortraitCategoryLabel(person);
    setProcessingId(person.id);
    try {
      const newImageUrl = await generateHistoricalPortrait(person.name, categoryLabel, cityName);
      if (newImageUrl) {
        const updated = { ...person, imageUrl: newImageUrl };
        await saveCityPerson(cityId, toSaveCityPersonInput(updated));
        setPeopleList((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
        return true;
      }
    } catch (e) {
      console.error('Errore generazione ritratto:', e);
    } finally {
      setProcessingId(null);
    }
    return false;
  };

  const completeMissingFieldWithAi = async (
    person: FamousPerson,
    field: FamousPersonRequiredField,
  ): Promise<FamousPerson | null> => {
    if (!person.id) return null;
    setFieldGenerating({ personId: person.id, field });
    try {
      const value = await generateFamousPersonRequiredField(person, cityName, field);
      if (!value) return null;
      const updated: FamousPerson = { ...person, [field]: value };
      await saveCityPerson(cityId, toSaveCityPersonInput(updated));
      setPeopleList((prev) => prev.map((p) => (p.id === person.id ? updated : p)));
      await reloadCurrentCity();
      return updated;
    } catch (e) {
      console.error(`[usePeopleAI] completeMissingFieldWithAi(${field}) failed`, e);
      return null;
    } finally {
      setFieldGenerating(null);
    }
  };

  /** Recupero esplicito date strutturate via AI (non auto-silente). */
  const recoverPersonDatesWithAi = async (person: FamousPerson): Promise<FamousPerson | null> => {
    if (!person.id) return null;
    setFieldGenerating({ personId: person.id, field: 'dates' });
    try {
      const datePatch = await recoverPersonDatesFromAi(person.name, cityName, person);
      if (Object.keys(datePatch).length === 0) return null;

      const nextIsLiving = datePatch.isLiving !== undefined ? datePatch.isLiving : person.isLiving;
      const merged: FamousPerson = {
        ...person,
        birthYear: datePatch.birthYear !== undefined ? datePatch.birthYear : person.birthYear,
        birthDate: datePatch.birthDate !== undefined ? datePatch.birthDate : person.birthDate,
        isLiving: nextIsLiving,
        deathYear:
          nextIsLiving === true
            ? null
            : datePatch.deathYear !== undefined
              ? datePatch.deathYear
              : person.deathYear,
        deathDate:
          nextIsLiving === true
            ? null
            : datePatch.deathDate !== undefined
              ? datePatch.deathDate
              : person.deathDate,
      };
      merged.lifespanDisplay = buildLifespanDisplay({
        birthYear: merged.birthYear,
        birthDate: merged.birthDate,
        isLiving: merged.isLiving === true,
        deathYear: merged.deathYear,
        deathDate: merged.deathDate,
      });

      const saved = await saveCityPerson(cityId, toSaveCityPersonInput(merged));
      setPeopleList((prev) => prev.map((p) => (p.id === person.id ? saved : p)));
      await reloadCurrentCity();
      return saved;
    } catch (e) {
      console.error('[usePeopleAI] recoverPersonDatesWithAi failed', e);
      return null;
    } finally {
      setFieldGenerating(null);
    }
  };

  const fixPeopleBatch = async () => {
    const targets =
      selectedIds.size > 0 ? peopleList.filter((p) => p.id && selectedIds.has(p.id)) : peopleList;
    if (targets.length === 0) return { success: false, count: 0, failed: 0 };

    setIsBulkProcessing(true);
    let okCount = 0;
    let failedCount = 0;

    for (const person of targets) {
      if (person.id) {
        const el = document.getElementById(`person-card-${person.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setProcessingId(person.id);
        try {
          const result = await wipeAndRewritePerson(person);
          if (result?.success) okCount += 1;
          else failedCount += 1;
        } catch (e) {
          console.error(`Errore durante fix massivo su ${person.name}`, e);
          failedCount += 1;
        }

        await new Promise((r) => setTimeout(r, BULK_FIX_THROTTLE_MS));
      }
    }

    setProcessingId(null);
    setIsBulkProcessing(false);
    if (selectedIds.size > 0) resetSelection();

    await reloadList();
    await reloadCurrentCity();
    return { success: failedCount === 0, count: okCount, failed: failedCount };
  };

  const bulkUpdateStatus = async (
    status: 'published' | 'draft',
  ): Promise<FamousPersonPublishAttemptResult[]> => {
    if (selectedIds.size === 0) return [];
    setIsBulkProcessing(true);
    const results: FamousPersonPublishAttemptResult[] = [];
    try {
      for (const id of selectedIds) {
        const person = peopleList.find((p) => p.id === id);
        if (!person) continue;

        if (status === 'published' && !canPublishFamousPerson(person)) {
          results.push({
            ok: false,
            cause: 'incomplete',
            missingFields: getMissingFamousPersonFields(person),
            person,
          });
          continue;
        }

        try {
          const updated = { ...person, status };
          const saved = await saveCityPerson(cityId, toSaveCityPersonInput(updated));
          setPeopleList((prev) => prev.map((p) => (p.id === id ? saved : p)));
          results.push({ ok: true });
        } catch (e) {
          if (isFamousPersonPublishBlockedError(e)) {
            results.push({
              ok: false,
              cause: 'incomplete',
              missingFields: e.missingFields,
              person,
            });
          } else {
            console.error('[usePeopleAI] bulkUpdateStatus item failed', e);
            results.push({
              ok: false,
              cause: 'runtime',
              person,
              message: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }
      await reloadCurrentCity();
      resetSelection();
    } catch (e) {
      console.error('[usePeopleAI] bulkUpdateStatus failed', e);
      await reloadList();
    } finally {
      setIsBulkProcessing(false);
    }
    return results;
  };

  return {
    processingId,
    isDiscovering,
    isBulkProcessing,
    discoveryResults,
    fieldGenerating,
    runDiscovery,
    importDiscoveryPerson,
    removeDiscoveryResult,
    wipeAndRewritePerson,
    regeneratePortrait,
    completeMissingFieldWithAi,
    recoverPersonDatesWithAi,
    fixPeopleBatch,
    bulkUpdateStatus,
  };
};

/** Helper: salva solo se recovery ha prodotto i required completi. */
export function buildCompleteSaveCityPersonInput(
  recoveredPerson: Parameters<typeof toCompleteFamousPersonRequiredFields>[0],
  extras: Omit<
    SaveCityPersonInput,
    | 'name'
    | 'bio'
    | 'imageUrl'
    | 'specificCategoryIds'
    | 'birthYear'
    | 'birthDate'
    | 'isLiving'
    | 'deathYear'
    | 'deathDate'
  >,
): SaveCityPersonInput | null {
  const required = toCompleteFamousPersonRequiredFields(recoveredPerson);
  if (!required) return null;
  return { ...extras, ...required };
}

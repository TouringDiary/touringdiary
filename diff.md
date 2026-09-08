src/components/admin/cities/DeleteCityOptionsModal.tsx
righe cancellate
-   keepPeople: true,
-             {/* OPTION: PEOPLE */}
-             <button
-               type="button"
-               onClick={() => toggleOption('keepPeople')}
-               aria-pressed={options.keepPeople}
-                 <div
-                   <div
-                     className={`text-sm font-bold ${options.keepPeople ? 'text-white' : 'text-slate-400'}`}
-                   >
-               <div
-                 className={`text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 ${options.keepPeople ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}
-             </button>
-               onClick={() => onConfirm(options)}
-               className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${options.keepPeople ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-red-500/30'}`}
-                   className={`p-2 rounded-lg shrink-0 ${options.keepPeople ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}
-                 >
-                     Personaggi Famosi
-                   <div className="text-[10px] text-slate-500">Biografie, Ritratti AI</div>
-               >
-                 {options.keepPeople ? 'MANTIENI' : 'CANCELLA'}

src/services/ai/generators/peopleCompletenessPipeline.ts
righe cancellate
(nessuna)

src/services/famousPerson/famousPersonSuggestionService.ts
righe cancellate
(nessuna)

src/domain/city/famousPersonCategories.ts
righe cancellate
(nessuna)

src/domain/city/famousPersonSelection.ts
righe cancellate
(nessuna)

src/components/common/DraggableSlider.tsx
righe cancellate
(nessuna)

src/components/admin/cityEditor/services/ServiceGuides.tsx
righe cancellate
-       setDiscoveryResults(results);

src/services/ai/aiVision.ts
righe cancellate
-   role: string,
-       { personName, role, cityName },
-       `Genera un ritratto artistico (olio/affresco) di ${personName}, ${role} a ${cityName}. VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE.`,
-     dbPrompt = `Genera un ritratto artistico di ${personName} a ${cityName}. Vista di spalle.`;

src/services/city/parsers/entities/parsePerson.ts
righe cancellate
- import type { FamousPerson } from '../../../../types';
-  * Structural Recovery: Preserva integrità JSONB e trasparenza media.
-     return { id: '', name: '', role: '', bio: '', imageUrl: '' };
-     lifespan: ensureString(raw.lifespan),
-   role?: unknown;
-     role: ensureString(raw.role),

src/services/city/cityLifecycleService.ts
righe cancellate
-   T extends 'shops' | 'city_people' | 'pois' | 'pois_staging',
-   // 3. PEOPLE
-     if (options.keepPeople) {
-       await supabase
-         .from('city_people')
-         .update(nullCityFkUpdate<'city_people'>())
-         .eq('city_id', cityId);
-     } else {
-       await supabase.from('city_people').delete().eq('city_id', cityId);
-     }

src/services/city/famousPersonCategoryService.ts
righe cancellate
(nessuna)

src/domain/city/famousPersonCompleteness.ts
righe cancellate
(nessuna)

src/types/core.ts
righe cancellate
-   keepPeople: boolean; // Mantieni personaggi famosi

src/components/admin/AdminFamousPeopleCategoriesManager.tsx
righe cancellate
(nessuna)

src/components/admin/cityEditor/services/ServiceGeneric.tsx
righe cancellate
-       setServiceResults(results);

src/services/famousPerson/famousPersonPhotoSuggestionService.ts
righe cancellate
(nessuna)

src/hooks/admin/usePeopleManager.ts
righe cancellate
-     reloadList: dataLogic.reloadList,
-   // 1. DATA MANAGEMENT (CRUD)
-   // 2. INTELLIGENCE (AI)
-   // Passiamo lo stato e le funzioni di aggiornamento dal Data Hook all'AI Hook
-   // 3. EXPOSE UNIFIED API
-   // Restituiamo un oggetto che combina entrambi gli hook, mantenendo l'interfaccia usata da CulturePeople.tsx
-     // Data & State
-     // AI State
-     // Selection Actions
-     // CRUD Actions
-     // AI Actions

src/components/admin/cityEditor/services/ServiceEvents.tsx
righe cancellate
-       setDiscoveryResults(results);

src/services/famousPerson/famousPersonPhotoReportService.ts
righe cancellate
(nessuna)

src/components/modals/CultureCornerModal.tsx
righe cancellate
- 
- import { ImageWithFallback } from '../common/ImageWithFallback';
-   const people = city.details.famousPeople || [];
-   const selectedPerson = selectedPersonId
-     ? (people.find((p) => p.id === selectedPersonId) ?? null)
-     : null;
-   const isPlaceInItinerary = (placeId: string) =>
-     itinerary.items.some((item) => item.poi.id === placeId);
-     if (!isOpen) return;
-     setSelectedPersonId(initialPersonId ?? null);
-   }, [isOpen, initialPersonId]);
-   useGlobalModalEscape(isOpen, onClose);
-     if (!selectedPerson || isPlaceInItinerary(place.id)) return;
-     // 1. Pulizia iniziale
-     return (
-       <div className="space-y-4">
-         {lines.map((line, idx) => {
-           const trimmed = line.trim();
-           if (!trimmed) return null;
- 
-           // CHECK NUOVO FORMATO "TITOLO: "
-           // Gestisce sia "TITOLO: Titolo\nTesto" che "TITOLO: Titolo. Testo" (Inline)
-           if (trimmed.toUpperCase().startsWith('TITOLO:')) {
-             // Rimuovi il prefisso "TITOLO:"
-             const contentWithoutPrefix = trimmed.substring(7).trim();
- 
-             // Cerca se c'è un punto che separa titolo e corpo (se l'AI ha messo tutto su una riga)
-             // Logica: Cerca il primo punto, esclamativo o interrogativo seguito da spazio o fine stringa.
-             // Usiamo una regex che cattura il primo "sentence ender"
-             const splitMatch = contentWithoutPrefix.match(/^(.+?)(\.|!|\?)(\s+|$)(.*)/s);
-             );
-           }
- 
-           // Paragrafo Standard
-         })}
-       </div>
-     );
-   };
-   if (!isOpen) return null;
-   if (selectedPerson) {
-     const hasStats = selectedPerson.careerStats && selectedPerson.careerStats.length > 0;
-     return createPortal(
-       <div
-         className="td-modal-overlay bg-black/95 backdrop-blur-xl animate-in fade-in !p-0 md:!p-4"
-         style={{ zIndex: Z_MODAL_NESTED }}
-           {/* CLOSE DETAIL BUTTON */}
-           <CloseButton
-             onClose={() => setSelectedPersonId(null)}
-             position="absolute"
-               {/* MAIN BIO CONTENT */}
-               <div className="space-y-6">
-               {/* RELATED PLACES - SEZIONE POTENZIATA */}
-               {selectedPerson.relatedPlaces && selectedPerson.relatedPlaces.length > 0 && (
-                 <div className="space-y-8 pt-8">
-                   <div className="flex items-center gap-4">
-                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
-                     <h3 className="text-xl font-display font-black text-white uppercase tracking-widest flex items-center gap-2">
-                   <div className="grid grid-cols-1 gap-4">
-                     {selectedPerson.relatedPlaces.map((place) => {
-                       const isAdded = isPlaceInItinerary(place.id);
- 
-                       return (
-                         <div
-                             <button
-                               type="button"
-                               onClick={() => openMap(place.coords.lat, place.coords.lng)}
-                             {place.notes && (
-                               <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3 leading-relaxed">
-                                 {place.notes}
-                               </p>
-                             )}
-                           </div>
-                           <div className="flex flex-col items-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/50">
-                             <button
-         onClick={onClose}
-         <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#020617] shrink-0">
-           <div className="flex items-center gap-4">
-             <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20 text-white">
-               <Quote className="w-6 h-6" />
-             <div>
-               <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide leading-none">
-               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
-           <CloseButton onClose={onClose} variant="primary" />
-         <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950 custom-scrollbar">
-           {people.length > 0 ? (
-             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
-               {people.map((person) => (
-                   key={person.id}
-                   onClick={() => setSelectedPersonId(person.id)}
-                   <ImageWithFallback
-                     src={person.imageUrl}
-                     alt={person.name}
-                     className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
-                   <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
-                   <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
-                     <div className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 border-l-2 border-indigo-500">
-                       {person.role}
-                     </div>
-                     <h3 className="text-3xl font-display font-bold text-white leading-[0.9] mb-2 shadow-black drop-shadow-lg">
-                       {person.name}
-                     </h3>
-                     <p className="text-slate-300 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 italic">
-                       "{person.quote || person.bio}"
-                 </button>
-               ))}
-           ) : (
-             <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
-               <BookOpen className="w-16 h-16" />
-               <p className="text-sm font-medium italic">
-                 Nessun personaggio illustre ancora in archivio per questa città.
-               </p>
- import React, { useEffect, useState } from 'react';
-   const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
-     // RelatedPlace → PointOfInterest: solo campi presenti sul related place.
-     // category 'monument' = Destinazioni (SoT dominio luoghi culturali / CityDetailContent).
-     // imageUrl / rating / votes omessi: RelatedPlace non ha metadati community né immagine.
-   // --- PREMIUM TEXT RENDERER CON PARSER "TITOLO:" INTELLIGENTE ---
-     const cleanText = text
-       .replace(/\*\*/g, '') // Via i bold markdown residui
-       .replace(/^\s*[*-]\s+/gm, ''); // Via bullet points all'inizio riga
- 
- 
-             if (splitMatch && splitMatch[4].trim().length > 0) {
-               // CASO INLINE: "Le Origini. Ciro nasce a..."
-               // splitMatch[1] = "Le Origini"
-               // splitMatch[2] = "."
-               // splitMatch[4] = "Ciro nasce a..."
- 
-               const titlePart = splitMatch[1] + splitMatch[2]; // "Le Origini." (Manteniamo la punteggiatura se stilistica, oppure no)
-               const bodyPart = splitMatch[4]; // "Ciro nasce a..."
- 
-               // Visualizziamo Titolo e poi Paragrafo
-               return (
-                 <React.Fragment key={`line-${idx}`}>
-                   <h3 className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit">
-                     {titlePart.replace(/[.:]$/, '')}{' '}
-                     {/* Puliamo punto finale dal titolo per estetica */}
-                   </h3>
-                   <p className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">
-                     {bodyPart}
-                   </p>
-                 </React.Fragment>
-               );
-             } else {
-               // CASO SOLO TITOLO (Il corpo è nella riga successiva)
-               return (
-                 <h3
-                   key={`line-${idx}`}
-                   className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit"
-                 >
-                   {contentWithoutPrefix.replace(/[.:]$/, '')}
-                 </h3>
-               );
-             }
-           }
- 
-           // Logica Fallback per vecchi formati (Titoli tutti maiuscoli)
-           const isOldSchoolTitle =
-             trimmed.length > 3 &&
-             trimmed.length < 80 &&
-             trimmed === trimmed.toUpperCase() &&
-             !trimmed.endsWith('.');
- 
-           if (isOldSchoolTitle) {
-             return (
-               <h3
-                 key={`line-${idx}`}
-                 className="text-amber-500 font-display font-bold text-2xl md:text-3xl mt-8 mb-2 leading-tight tracking-tight uppercase border-b border-amber-500/10 pb-1 w-fit"
-               >
-                 {trimmed.replace(/:$/, '')}
-           return (
-             <p
-               key={`line-${idx}`}
-               className="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4"
-             >
-               {trimmed}
-             </p>
-         role="presentation"
-       >
-         <button
-           type="button"
-           tabIndex={-1}
-           aria-hidden="true"
-           className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
-           onClick={() => setSelectedPersonId(null)}
-         />
-         <div
-           className="relative w-full h-full md:max-w-7xl md:h-[95vh] bg-[#0b0f1a] md:rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl md:border border-slate-800 pointer-events-auto"
-           style={{ zIndex: Z_MODAL_NESTED }}
-             variant="primary"
-             className="top-6 right-6"
-           />
- 
-           {/* LEFT COLUMN: HERO IMAGE & KEY INFO */}
-           <div className="w-full md:w-[45%] lg:w-[40%] h-[40vh] md:h-full relative shrink-0">
-             <ImageWithFallback
-               src={selectedPerson.imageUrl}
-               alt={selectedPerson.name}
-               className="w-full h-full object-cover grayscale brightness-75 contrast-125"
-             />
-             <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f1a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0b0f1a]"></div>
- 
-             <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
-               <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-4 shadow-black drop-shadow-2xl">
-                 {selectedPerson.name}
-               </h2>
-               <div className="flex flex-col gap-3 items-start">
-                 <div className="inline-block bg-amber-500 text-black text-sm font-black uppercase tracking-[0.2em] px-4 py-1.5 shadow-lg transform -skew-x-12">
-                   {selectedPerson.role}
-                 </div>
-                 {selectedPerson.lifespan && (
-                   <div className="text-slate-300 font-mono text-base md:text-lg font-bold tracking-widest pl-1 border-l-2 border-amber-500/50">
-                     {selectedPerson.lifespan}
-                   </div>
-                 )}
-               </div>
-             </div>
-           </div>
- 
-           {/* RIGHT COLUMN: CONTENT SCROLLABLE */}
-           <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0f1a] relative">
-             <div className="p-8 md:p-16 space-y-10 max-w-4xl mx-auto">
-               {/* QUOTE */}
-               {selectedPerson.quote && (
-                 <div className="relative pl-12 py-4 border-l-4 border-indigo-500 bg-indigo-900/10 rounded-r-xl pr-6 mt-6 md:mt-0">
-                   <Quote className="absolute top-4 left-4 w-6 h-6 text-indigo-400 opacity-50" />
-                   <p className="text-xl md:text-2xl font-serif italic text-indigo-100 leading-relaxed">
-                     "{selectedPerson.quote}"
-                   </p>
-                 </div>
-               )}
-                 {renderSmartContent(selectedPerson.fullBio || selectedPerson.bio)}
-               </div>
- 
-               {/* STATS - FIX LAYOUT OVERFLOW */}
-               {hasStats && (
-                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-8 border-y border-slate-800/50">
-                   {selectedPerson.careerStats?.map((stat) => (
-                     <div
-                       key={`${stat.label}:${stat.value}`}
-                       className="bg-slate-900/50 p-3 md:p-4 rounded-2xl border border-slate-800 text-center hover:border-amber-500/30 transition-colors flex flex-col items-center justify-center min-h-[90px]"
-                     >
-                       {/* Usa break-words e leading-tight per gestire parole lunghe come 'Dinastia' */}
-                       <div className="text-lg md:text-xl lg:text-2xl font-black text-white font-display mb-1 break-words w-full leading-tight hyphens-auto">
-                         {stat.value}
-                       </div>
-                       <div className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-snug">
-                         {stat.label}
-                       </div>
-                     </div>
-                   ))}
-                 </div>
-               )}
-                       <MapPin className="w-5 h-5 text-emerald-500" /> I Luoghi di{' '}
-                       {selectedPerson.name.split(' ')[0]}
-                     </h3>
-                     <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
-                   </div>
-                           key={place.id}
-                           className="group bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-indigo-900/10"
-                         >
-                           <div className="flex-1 min-w-0">
-                             <div className="flex items-center gap-3 mb-2">
-                               <div className="p-2 bg-indigo-900/30 rounded-lg text-indigo-400 shrink-0">
-                                 <MapPin className="w-5 h-5" />
-                               </div>
-                               <h4 className="font-bold text-white text-xl group-hover:text-indigo-400 transition-colors break-words">
-                                 {place.name}
-                               </h4>
-                             </div>
-                               className="text-slate-400 text-sm hover:text-white hover:underline decoration-indigo-500 underline-offset-4 transition-all mb-3 flex items-center gap-2 min-h-[44px]"
-                             >
-                               {place.address} <ArrowRight className="w-3 h-3 opacity-50" />
-                             </button>
-                             <div className="flex items-center gap-3">
-                               {place.priceLevel != null && (
-                                 <div className="text-[10px] font-bold text-amber-500 tracking-widest bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">
-                                   {'€'.repeat(place.priceLevel)}
-                                 </div>
-                               )}
-                               {place.visitDuration && (
-                                 <div className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-1">
-                                   <Clock className="w-3 h-3" /> {place.visitDuration}
-                                 </div>
-                               )}
-                             </div>
-                               type="button"
-                               onClick={(e) => handleAddPlace(e, place)}
-                               disabled={isAdded}
-                               className={`
-                                                                 flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 w-full md:w-auto justify-center
-                                                                 ${isAdded ? 'bg-emerald-600 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}
-                                                             `}
-                             >
-                               {isAdded ? (
-                                 <CheckCircle className="w-4 h-4" />
-                               ) : (
-                                 <Plus className="w-4 h-4" />
-                               )}
-                               {isAdded ? 'AGGIUNTO' : 'AGGIUNGI'}
-                             </button>
-                           </div>
-                         </div>
-                       );
-                     })}
-                   </div>
-                 </div>
-               )}
-             </div>
-           </div>
-         </div>
-       </div>,
-       document.body,
-     );
-   }
-                   className="group cursor-pointer relative h-[400px] w-full rounded-[2rem] overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-900/20 text-left p-0 bg-transparent"
-                     <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
-                       Scopri Storia <ChevronRight className="w-3 h-3" />
-                     </div>

src/domain/city/famousPersonDates.ts
righe cancellate
(nessuna)

src/domain/city/famousPersonFilter.ts
righe cancellate
(nessuna)

src/domain/city/famousPersonCommunityValidation.ts
righe cancellate
(nessuna)

src/types/models/famousPersonCommunity.ts
righe cancellate
(nessuna)

src/services/ai/generators/peopleCategoryValidation.ts
righe cancellate
(nessuna)

src/services/ai/generators/peopleGenerator.ts
righe cancellate
- /** Risultato discovery people da Gemini (parziale FamousPerson). */
- export type PersonDiscoveryResult = Partial<FamousPerson> & {
-     const prompt = buildSuggestPeoplePrompt(cityName, count, existingNames, contextQuery);
-       model: 'gemini-2.0-pro',
-       return parsed.filter(
- ): Promise<Partial<FamousPerson>> => {
-     const prompt = buildEnrichPersonPrompt(personName, cityName);
-       model: 'gemini-2.0-pro',
-         ? (parsed as Partial<FamousPerson>)
-   role?: string;
-   bio?: string;
-         (item): item is PersonDiscoveryResult =>
-           !!item &&
-           typeof item === 'object' &&
-           typeof (item as PersonDiscoveryResult).name === 'string',
-       );

src/hooks/admin/people/usePeopleAI.ts
righe cancellate
-       console.error(e);
-       let finalImageUrl = await findExistingPortrait(person.name);
-       if (!finalImageUrl) {
-         // Generazione immagine consuma 1 API call
-         finalImageUrl = await generateHistoricalPortrait(person.name, person.role || '', cityName);
-         ...person,
-         name: person.name,
-         role: person.role || '',
-         bio: person.bio || person.fullBio || '',
-         imageUrl:
-           finalImageUrl || 'https://images.unsplash.com/photo-1555626040-3b731de3a81c?q=80&w=400',
-         lifespan: person.lifespan || '',
-         quote: person.quote || '',
-         famousWorks: person.famousWorks || [],
-         relatedPlaces: person.relatedPlaces || [],
-         fullBio: person.fullBio || person.bio || '',
-         privateLife: person.privateLife || '',
-         collaborations: person.collaborations || [],
-         awards: person.awards || [],
-       reloadCurrentCity();
-       if (enrichedData) {
-         if (recoveredUrl) {
-           finalImageUrl = recoveredUrl;
-           const isMissing = !finalImageUrl || finalImageUrl.trim() === '';
-           const isPlaceholder =
-             finalImageUrl.includes('unsplash.com') || finalImageUrl.includes('ui-avatars');
-           if (isMissing || isPlaceholder) {
-         const updatedPerson: FamousPerson = {
-           imageUrl: finalImageUrl,
-           status: 'draft',
-         };
-         await saveCityPerson(cityId, updatedPerson);
-         setPeopleList((prev) => prev.map((p) => (p.id === person.id ? updatedPerson : p)));
-         return { success: true };
-       } else {
-         throw new Error("L'AI non ha restituito dati validi.");
-     if (!person.id) return;
-       const newImageUrl = await generateHistoricalPortrait(person.name, person.role, cityName);
-   // 4. BATCH PROCESSING (Bulk Fix) - THROTTLED
-     if (targets.length === 0) return;
-           await wipeAndRewritePerson(person);
-         // --- CRITICO: THROTTLING 5 SECONDI ---
-     return { success: true, count: targets.length };
-   const bulkUpdateStatus = async (status: 'published' | 'draft') => {
-     if (selectedIds.size === 0) return;
-       setPeopleList((prev) => prev.map((p) => (selectedIds.has(p.id!) ? { ...p, status } : p)));
-         if (person) return saveCityPerson(cityId, { ...person, status });
-         return Promise.resolve();
-       });
-       await Promise.all(promises);
-       reloadList();
-   // --- AI STATE ---
-   // 1. DISCOVERY
-       // Track: 1 chiamata per il suggerimento lista
-         careerStats: person.careerStats || [],
-   // 2. MAGIC FIX (Wipe & Rewrite Single)
-         let finalImageUrl = person.imageUrl;
-         const recoveredUrl = await findExistingPortrait(person.name);
-             const roleForImg = enrichedData.role || person.role || 'Personaggio Storico';
-             const newImage = await generateHistoricalPortrait(person.name, roleForImg, cityName);
-             if (newImage) {
-               finalImageUrl = newImage;
-             }
-           }
-           role: enrichedData.role || person.role || 'Personaggio Storico',
-   // 3. IMAGE GENERATION (Standalone)
-         // Scroll per feedback visivo
-         // Evita Rate Limit 429 di Google Gemini
-         await new Promise((r) => setTimeout(r, 5000));
-       const promises = Array.from(selectedIds).map((id) => {

src/hooks/admin/people/usePeopleData.ts
righe cancellate
- import { useCallback, useEffect, useState } from 'react';
-   // 1. LOAD DATA
-   const loadPeople = useCallback(async () => {
-     if (!cityId) return;
-       const sorted = data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
-       console.error('Error loading people', e);
-     loadPeople();
-     const newSet = new Set(selectedIds);
-     if (newSet.has(id)) newSet.delete(id);
-     else newSet.add(id);
-     setSelectedIds(newSet);
-     if (selectedIds.size === peopleList.length) {
-     } else {
-   // 3. CRUD OPERATIONS
- 
-   // Add Placeholder
-   const addManualPerson = async () => {
-     const tempPerson: SaveCityPersonInput = {
-       name: 'Nuovo Personaggio',
-       role: 'Artista',
-       bio: '',
-       orderIndex: peopleList.length + 1,
-     const saved = await saveCityPerson(cityId, tempPerson);
-     setPeopleList((prev) => [...prev, saved]);
-       reloadCurrentCity();
-       // Clean selection if deleted
-       if (selectedIds.has(id)) toggleSelection(id);
-     } catch (e) {
-   // Local Update (Optimistic input)
-     field: keyof FamousPerson,
-     value: FamousPerson[keyof FamousPerson],
-       await saveCityPerson(cityId, person);
-       reloadCurrentCity();
-   // Toggle Status (Published/Draft)
-     // Optimistic
-     await saveCityPerson(cityId, updated);
-     reloadCurrentCity();
-   // Reorder
-   const reorderPerson = async (id: string, newRank: number) => {
-     if (Number.isNaN(newRank) || newRank < 1) return;
-     const index = newRank - 1;
-     const currentList = [...peopleList];
-     const itemIndex = currentList.findIndex((p) => p.id === id);
-     if (itemIndex === -1 || index >= currentList.length) return;
-     const [item] = currentList.splice(itemIndex, 1);
-     currentList.splice(index, 0, item);
-     const updatedList = currentList.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
-     for (const p of updatedList) {
-       await saveCityPerson(cityId, p);
-     setPeopleList, // Exposed for AI Hook updates
-   // --- DATA STATE ---
- 
-   // --- SELECTION STATE ---
- 
-   // --- ACTION STATES ---
-   // 2. SELECTION LOGIC
-       setSelectedIds(new Set(peopleList.map((p) => p.id!)));
-       imageUrl: 'https://images.unsplash.com/photo-1555626040-3b731de3a81c?q=80&w=400',
-       fullBio: '',
-       privateLife: '',
-       awards: [],
-       collaborations: [],
-       careerStats: [],
-   // Delete Single
-   const updatePersonLocal = (
-   // Save Changes (DB)
-   const toggleStatus = async (person: FamousPerson) => {
-     const updated: FamousPerson = { ...person, status: newStatus };
-     setPeopleList(updatedList);

src/components/admin/cityEditor/culture/CulturePeople.tsx
righe cancellate
- import { useState } from 'react';
- import type { FamousPerson, User } from '../../../../types/index';
- export const CulturePeople: React.FC<CulturePeopleProps> = ({ cityId, cityName, currentUser }) => {
-     setDeleteTarget({ id: person.id!, name: person.name });
-         message: `Bonifica completata! Processati ${result.count} personaggi.`,
-   const allSelected = peopleList.length > 0 && selectedIds.size === peopleList.length;
-   const selectedCount = selectedIds.size;
-             className="p-1.5 rounded hover:bg-slate-800 transition-colors"
-             {selectedIds.size} SELEZIONATI
-         {selectedIds.size > 0 && (
-               onClick={() => bulkUpdateStatus('published')}
-               className="flex items-center gap-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/30"
-               onClick={() => bulkUpdateStatus('draft')}
-               className="flex items-center gap-1.5 bg-amber-900/30 hover:bg-amber-900/50 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-amber-500/30"
-                 className="w-16 bg-slate-950 border border-indigo-500/50 text-white text-[10px] font-bold rounded px-2 py-1 outline-none"
-                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 disabled:opacity-50 transition-all"
-           <div className="grid grid-cols-2 gap-3 mt-3">
-             {discoveryResults.map((p, i) => (
-               <div
-                 key={i}
-                 className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 relative group hover:border-indigo-500 transition-colors"
-               >
-                 <div className="flex items-start gap-3">
-                   <div className="min-w-0 flex-1">
-                     <div className="font-bold text-white text-xs truncate">{p.name}</div>
-                     <div className="text-[9px] text-slate-400 truncate mb-1">{p.role}</div>
-                     <p className="text-[9px] text-slate-500 line-clamp-3 leading-snug italic border-l border-slate-700 pl-2">
-                       "{p.bio || 'Nessuna bio'}"
-                     </p>
-                 <button
-                   type="button"
-       <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
-             const isExpanded = expandedPersonId === p.id;
-             const isProcessingThis = processingId === p.id;
-             const isSelected = selectedIds.has(p.id!);
-             const hasDates = p.lifespan && p.lifespan.length > 5;
-             const dataQuality = hasFullBio && hasDates ? 'high' : 'low';
-             const personPanelId = p.id ? `person-card-${p.id}` : undefined;
-             const fullBioFieldId = p.id
-               ? `fld-admin-cityeditor-culture-fullbio-${p.id}`
-               : undefined;
-               if (isProcessingThis || !p.id) return;
-               setExpandedPersonId(isExpanded ? null : p.id);
-                 key={p.id || idx}
-                 <div className="p-3 md:p-4 flex gap-3 items-center group">
-                   <button
-                     type="button"
-                     onClick={(e) => {
-                       e.stopPropagation();
-                       toggleSelection(p.id!);
-                     }}
-                     className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isSelected ? 'text-indigo-500' : 'text-slate-600'}`}
-                   >
-                     {isSelected ? (
-                       <CheckSquare className="w-5 h-5" />
-                     ) : (
-                       <Square className="w-5 h-5" />
-                     )}
-                   </button>
- 
-                   <div className="w-12 shrink-0">
-                   <button
-                     type="button"
-                     className="flex gap-3 items-center flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
-                     aria-expanded={isExpanded}
-                     aria-controls={personPanelId}
-                     onClick={togglePersonExpanded}
-                   >
-                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-slate-700 shrink-0">
-                       <ImageWithFallback
-                         src={p.imageUrl}
-                         alt={p.name}
-                         className={`w-full h-full object-cover ${!isPublished ? 'grayscale opacity-60' : ''}`}
-                     <div className="flex-1 min-w-0">
-                       <div className="flex items-center gap-2">
-                         <h4 className="font-bold text-white text-sm truncate">{p.name}</h4>
-                         {isPublished ? (
-                           <span className="text-[9px] bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
-                             Online
-                           </span>
-                         ) : (
-                           <span className="text-[9px] bg-amber-900/30 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
-                             Bozza
-                           </span>
-                         )}
-                         {isProcessingThis && (
-                           <span className="text-[9px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 animate-pulse border border-yellow-300">
-                       <p className="text-[10px] md:text-xs text-slate-400 truncate">{p.role}</p>
-                     </div>
-                   </button>
-                   <div className="flex items-center gap-2">
-                         handleOpenPreview(p.id!);
-                       className="p-1.5 md:p-2 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded transition-colors"
-                       className="p-1.5 md:p-2 text-slate-600 hover:text-red-500 hover:bg-slate-900 rounded"
-                         onClick={() => toggleStatus(p)}
-                         className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${isPublished ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-amber-600 text-white hover:bg-amber-500'}`}
-                         {isPublished ? 'PUBBLICATO' : 'BOZZA (NASCOSTO)'}
-                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
-                         onChange={(e) => updatePersonLocal(p.id!, 'name', e.target.value)}
-                         className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm w-full"
-                       />
-                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
-                       <div className="relative">
-                         <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
-                           value={p.lifespan || ''}
-                           onChange={(e) => updatePersonLocal(p.id!, 'lifespan', e.target.value)}
-                           className={`bg-slate-900 border rounded px-3 py-2 pl-9 text-xs w-full ${!hasDates ? 'border-red-500 text-red-200' : 'border-slate-700 text-slate-300'}`}
-                           placeholder="Periodo (es. 1898-1967)"
-                       </div>
-                       {/* IMAGE ROW WITH MAGIC GENERATOR */}
-                           value={p.imageUrl}
-                           onChange={(e) => updatePersonLocal(p.id!, 'imageUrl', e.target.value)}
-                           className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-xs w-full"
-                           className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded border border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
-                     <textarea
-                       rows={2}
-                       value={p.bio}
-                       onChange={(e) => updatePersonLocal(p.id!, 'bio', e.target.value)}
-                       className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-300 text-xs resize-none"
-                       placeholder="Bio breve..."
-                     />
-                         onChange={(e) => updatePersonLocal(p.id!, 'fullBio', e.target.value)}
-                         className={`w-full bg-slate-900 border rounded p-3 text-white text-xs resize-none font-serif ${!hasFullBio ? 'border-red-500/50' : 'border-slate-700'}`}
-                         onApply={(val) => updatePersonLocal(p.id!, 'fullBio', val)}
-                         fieldId={`bio_extended_${p.id}`}
-                           {p.relatedPlaces.map((place, placeIdx) => (
-                               key={placeIdx}
-                                   {[...Array(place.priceLevel || 1)].map((_, i) => '€').join('')}
-                         onClick={() => savePersonChanges(p)}
-   // --- USE HOOK ---
-   // STATE MODALE SUCCESSO
-       {/* SUCCESS MODAL */}
-       {/* LEGAL DISCLAIMER */}
-                   onClick={() => importDiscoveryPerson(p)}
-                   disabled={p.isImporting}
-                   className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mt-auto"
-                 >
-                   {p.isImporting ? (
-                     <Loader2 className="w-3 h-3 animate-spin" />
-                   ) : (
-                     <Check className="w-3 h-3" />
-                   )}
-                   {p.isImporting ? 'Creazione Asset...' : 'Importa + Foto'}
-                 </button>
-                 <button
-                   type="button"
-                   onClick={() => removeDiscoveryResult(p.name)}
-                   className="absolute top-1 right-1 text-slate-600 hover:text-white"
-                 >
-                   <X className="w-3 h-3" />
-                 </button>
-               </div>
-             ))}
-                     <input
-                       type="number"
-                       min="1"
-                       value={p.orderIndex || idx + 1}
-                       onChange={(e) => reorderPerson(p.id!, parseInt(e.target.value, 10))}
-                       className="w-full bg-slate-950 border-2 border-slate-700 rounded-lg text-center text-white text-base font-black py-1 focus:border-indigo-500 outline-none shadow-inner"
-                     />
-                   </div>
-                             <Loader2 className="w-3 h-3 animate-spin" /> LAVORAZIONE...
-                           </span>
-                         )}
-                         {!isProcessingThis && dataQuality === 'low' && (
-                           <span className="text-[9px] text-red-400 font-bold uppercase">
-                             Dati Incompleti
-                           </span>
-                         )}
-                       <input
-                         value={p.role}
-                         onChange={(e) => updatePersonLocal(p.id!, 'role', e.target.value)}
-                         className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm w-full"
-                         placeholder="Ruolo"

src/services/city/entitiesService.ts
righe cancellate
- import { parsePerson } from './parsers/entities/parsePerson';
- export type SaveCityPersonInput = Omit<FamousPerson, 'id'> & { id?: string };
-     .select('*')
-     .select('*')
-   invalidateCityCache(cityId);
-   const isNew = !person.id || !person.id.match(/^[0-9a-f]{8}-/);
-     name: person.name,
-     role: person.role,
-     image_url: person.imageUrl,
-     lifespan: person.lifespan,
-   return parsePerson(data as DatabaseCityPersonRow);
-     bio: person.bio,

src/types/models/City.ts
righe cancellate
-   lifespan?: string;
-   role: string;


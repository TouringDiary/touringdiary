const macros = [];
function add(m) {
  macros.push(m);
}
function item(file, line, why) {
  return { file, line, why };
}
const P = 'src/components/';

add({
  id: 'S-FP-DRAG',
  name: 'Drag/drop surfaces (no button)',
  risk: 'FP',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Drag/drop only — do not propose button',
  smoke: null,
  items: [
    item(P + 'admin/AdminItineraryEditor.tsx', 620, 'Draggable POI source row; no click action'),
    item(P + 'admin/AdminItineraryEditor.tsx', 650, 'Day column drop zone; drag handlers only'),
    item(P + 'features/diary/ItineraryItemCard.tsx', 313, 'Card shell drag/reorder; no onClick'),
    item(P + 'features/diary/DiaryDay.tsx', 284, 'Explicit drop zone; drag enter/over/drop'),
    item(P + 'features/diary/TravelDiary.tsx', 393, 'Scroll area drag-enter/leave/drop'),
    item(P + 'features/diary/TravelDiary.tsx', 457, 'Empty-state drop container'),
  ],
});

add({
  id: 'S-FP-POINTER',
  name: 'Pointer/hover/pan surfaces (no button)',
  risk: 'FP',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Pointer/hover without click-as-control — do not propose button',
  smoke: null,
  items: [
    item(P + 'admin/AdminPhotoInspector.tsx', 394, 'Canvas pan cursor-move; mouse handlers only'),
    item(P + 'admin/onboarding/OnboardingVisualEditor.tsx', 310, 'Editor stage mouse drag positioning'),
    item(P + 'admin/onboarding/OnboardingVisualEditor.tsx', 347, 'Target box cursor-move drag'),
    item(P + 'admin/onboarding/OnboardingVisualEditor.tsx', 388, 'Mascot drag handle'),
    item(P + 'admin/onboarding/OnboardingVisualEditor.tsx', 403, 'Bubble drag handle'),
    item(P + 'common/DraggableSlider.tsx', 128, 'Horizontal drag-scroll track'),
    item(P + 'features/diary/DiaryTimeline.tsx', 216, 'City overflow tooltip hover anchor'),
    item(
      P + 'features/diary/packing_list/suitcase/CategorySuggestionPanel.tsx',
      114,
      'Hover-only preview panel',
    ),
    item(
      P + 'features/diary/packing_list/suitcase/SuitcaseCard.tsx',
      121,
      'onMouseEnter select only; nested buttons separate',
    ),
    item(P + 'modals/ProvinceModal.tsx', 352, 'Mouse-drag scroll strip; children already buttons'),
    item(
      P + 'features/diary/packing_list/suitcase/CategoryStatusFilter.tsx',
      131,
      'Pointer schedule wrapper around existing option buttons',
    ),
  ],
});

add({
  id: 'S-FP-CONTENT',
  name: 'contentEditable surface',
  risk: 'FP',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'contentEditable — do not propose button',
  smoke: null,
  items: [item(P + 'admin/NewsTickerManager.tsx', 166, 'Rich-text contentEditable editor')],
});

add({
  id: 'S-UPLOAD',
  name: 'Dashed upload zone → hidden file input',
  risk: 'LOW_COND',
  contract:
    'label|button activating hidden file input (C-P2d); preserve click→input.click()',
  trancheA_reuse: 'none',
  excluded_from_batch: null,
  smoke: 'Open form → click dropzone → native file picker',
  items: [
    item(P + 'modals/sponsor/SponsorForm.tsx', 517, 'Cover dropzone clicks fileInputRefCover'),
    item(
      P + 'user/BusinessShopManager.tsx',
      238,
      'Product photo dropzone clicks fileInputRefProducts',
    ),
  ],
});

add({
  id: 'S-HEADER-CTRL',
  name: 'Expand/sort header → button type=button',
  risk: 'LOW',
  contract:
    'Replace static header with button type=button; same handler; no nested interactives in node',
  trancheA_reuse: 'A3',
  excluded_from_batch: null,
  smoke: 'Toggle expand / sort column; keyboard activates',
  items: [
    item(P + 'admin/AiFieldHelper.tsx', 140, 'AI helper accordion header; no nested controls'),
    item(
      P + 'admin/cityEditor/culture/CulturePeople.tsx',
      464,
      'Person expand click area; siblings are outside node',
    ),
    item(P + 'admin/GlobalEventsManager.tsx', 212, 'SortHeader column sort; icon-only children'),
  ],
});

add({
  id: 'S-ADD-TILE',
  name: 'Dashed add tile → button (URL prompt, not file)',
  risk: 'LOW',
  contract: 'button type=button same onClick; not file-input pattern',
  trancheA_reuse: 'A3',
  excluded_from_batch: null,
  smoke: 'Click Aggiungi → prompt/URL flow unchanged',
  items: [
    item(
      P + 'admin/cityEditor/EditorMedia.tsx',
      430,
      'Gallery dashed add calls addImageToGallery (prompt URL)',
    ),
    item(P + 'admin/cityEditor/tabs/TabMedia.tsx', 429, 'Same dashed add pattern as EditorMedia'),
  ],
});

add({
  id: 'S-SIMPLE-SELECT',
  name: 'Filter/option/thumb without nested controls',
  risk: 'LOW',
  contract: 'button type=button (or role=option where listbox); same handler',
  trancheA_reuse: 'A3',
  excluded_from_batch: null,
  smoke: 'Select filter/option/open thumb; no nested click conflict',
  items: [
    item(P + 'admin/import/components/ImportStatsBar.tsx', 42, 'Filter stat chip; text-only children'),
    item(
      P + 'admin/poiManager/RegenerateConfirmModal.tsx',
      76,
      'Status toggle row; icon-only children',
    ),
    item(
      P + 'features/diary/packing_list/suitcase/SuitcaseStatusBox.tsx',
      59,
      'Suitcase select tile; no nested controls',
    ),
    item(P + 'admin/photos/PhotoRow.tsx', 74, 'Thumbnail opens inspector; no nested controls'),
  ],
});

add({
  id: 'S-DIMMER-DISMISS',
  name: 'Backdrop/dimmer dismiss (A1/A4/A5)',
  risk: 'LOW_COND',
  contract:
    'Mouse-only dismiss button absolute inset-0 tabIndex=-1 aria-hidden; wrapper presentation without onClick when A1 shell pattern',
  trancheA_reuse: 'A1',
  excluded_from_batch: null,
  smoke: 'Click dimmer closes; click panel/content does not; ESC/close if present',
  items: [
    item(
      P + 'modals/sectionPreview/PreviewHero.tsx',
      141,
      'Desc modal absolute inset-0 overlay dismiss',
    ),
    item(P + 'shop/ShopPage.tsx', 299, 'Mobile planner sibling backdrop dismiss'),
    item(P + 'itineraries/ItinerariesExplorer.tsx', 81, 'Filter dropdown fixed backdrop dismiss'),
  ],
});

add({
  id: 'S-LIGHTBOX-DISMISS',
  name: 'Lightbox root dismiss (A6)',
  risk: 'LOW_COND',
  contract: 'A1-style dismiss on lightbox root; media/chrome stopProp untouched if present',
  trancheA_reuse: 'A6',
  excluded_from_batch: null,
  smoke: 'Open shop lightbox → click backdrop closes; close button works',
  items: [item(P + 'shop/ShopPage.tsx', 237, 'fixed inset-0 lightbox onClick clears image')],
});

add({
  id: 'S-POPOVER-TRIG',
  name: 'HeaderPopover trigger → button+ref',
  risk: 'LOW_COND',
  contract: 'Trigger becomes button type=button with ref=triggerRef; preserve handleToggle',
  trancheA_reuse: 'partial',
  excluded_from_batch: null,
  smoke: 'Toggle popover via trigger; ref positioning intact',
  items: [item(P + 'ui/header/HeaderPopover.tsx', 165, 'Trigger wrapper div with ref+onClick')],
});

add({
  id: 'S-SURFACE-TOGGLE',
  name: 'SuitcaseSidePanel collapsed toggle surface',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Not modal dimmer; collapsible panel open surface needs UX/layout review',
  smoke: null,
  items: [
    item(
      P + 'features/diary/packing_list/suitcase/SuitcaseSidePanel.tsx',
      60,
      'absolute inset-0 collapsed panel toggle ≠ A1 dimmer',
    ),
  ],
});

add({
  id: 'S-ONBOARDING',
  name: 'OnboardingWizard conditional dismiss / mascot',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Conditional e.target dismiss + mascot next; separate from A1 dimmer',
  smoke: null,
  items: [
    item(
      P + 'layout/OnboardingWizard.tsx',
      262,
      'Root fixed inset-0 dismiss only if e.target===currentTarget',
    ),
    item(P + 'layout/OnboardingWizard.tsx', 289, 'UI layer stopProp shield over root'),
    item(P + 'layout/OnboardingWizard.tsx', 294, 'Mascot click advances step'),
  ],
});

add({
  id: 'S-DUP-CONTROL',
  name: 'Duplicate open control beside sibling button',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Duplicates sibling patron button — UX choose single control',
  smoke: null,
  items: [
    item(
      P + 'city/CityHeader.tsx',
      172,
      'Santo Patrono row duplicates onOpenPatron button below',
    ),
  ],
});

add({
  id: 'S-CALENDAR-TRIG',
  name: 'Date-range calendar icon triggers',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'stopProp calendar toggles in date field; parent overlay audit',
  smoke: null,
  items: [
    item(
      P + 'features/diary/header/DiaryHeaderDateRange.tsx',
      78,
      'Start calendar icon toggle with stopProp',
    ),
    item(
      P + 'features/diary/header/DiaryHeaderDateRange.tsx',
      130,
      'End calendar icon toggle with stopProp',
    ),
  ],
});

add({
  id: 'S-NOTE-EDIT',
  name: 'Click-to-edit note activation',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'cursor-text edit activation; not mechanical button-only',
  smoke: null,
  items: [
    item(P + 'features/diary/ItineraryItemCard.tsx', 605, 'Custom note click enters edit mode'),
  ],
});

add({
  id: 'S-HERO-EXPAND',
  name: 'Hero module expand headers (nested/duplicate chevron)',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Expand headers with nested chevron/banner; button-in-button risk',
  smoke: null,
  items: [
    item(
      P + 'home/hero/HeroAiModule.tsx',
      113,
      'Compact expand header contains nested chevron+banner',
    ),
    item(P + 'home/hero/HeroAiModule.tsx', 141, 'Desktop expand header with nested banner shield'),
    item(
      P + 'home/hero/HeroFilterModule.tsx',
      177,
      'Compact twin expand header with nested chevron',
    ),
    item(P + 'home/hero/HeroFilterModule.tsx', 237, 'Expanded module header toggle'),
    item(
      P + 'home/hero/HeroFilterModule.tsx',
      248,
      'Filter body header toggle with nested banner',
    ),
  ],
});

add({
  id: 'S-HERO-SUBMIT',
  name: 'Hero AI typing preview click-to-submit',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch: 'Separate from hero expand/lightbox; submit-surface UX',
  smoke: null,
  items: [item(P + 'home/hero/HeroAiModule.tsx', 303, 'Typing bubble click submits query')],
});

add({
  id: 'S-HERO-LIGHTBOX',
  name: 'LiveFeed hero open lightbox',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch:
    'Keep separate from hero expand; lightbox open with nested admin controls',
  smoke: null,
  items: [
    item(
      P + 'community/liveFeed/LiveFeedHero.tsx',
      38,
      'Hero media opens lightbox; nested admin shield sibling',
    ),
  ],
});

add({
  id: 'S-SHIELD-NESTED',
  name: 'Nested stopPropagation shields (card/hero/panel)',
  risk: 'MED',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch:
    'Nested shields; parent still clickable or not proven A1-redundant — needs parent-overlay audit',
  smoke: null,
  items: [
    item(P + 'city/CityCard.tsx', 179, 'Favorite bookmark stopProp inside city card'),
    item(P + 'city/ShowcaseCards.tsx', 63, 'ActionRow like/add stopProp on card'),
    item(P + 'community/liveFeed/LiveFeedHero.tsx', 86, 'Admin controls stopProp on hero'),
    item(P + 'home/hero/HeroAiModule.tsx', 104, 'AI runtime banner stopProp wrapper'),
    item(
      P + 'home/hero/HeroAiModule.tsx',
      123,
      'Chevron stopProp+toggle nested in expand header',
    ),
    item(P + 'home/hero/HeroAiModule.tsx', 135, 'Mobile banner stopProp under header'),
    item(P + 'home/hero/HeroAiModule.tsx', 152, 'Desktop banner stopProp in header'),
    item(
      P + 'home/hero/HeroFilterModule.tsx',
      185,
      'Chevron stopProp+toggle nested in expand',
    ),
    item(P + 'home/hero/HeroFilterModule.tsx', 257, 'Runtime banner stopProp in filter header'),
    item(P + 'home/hero/HeroFilterModule.tsx', 264, 'Centered banner stopProp overlay'),
    item(P + 'shop/ShopCard.tsx', 73, 'Favorite stopProp inside shop card'),
    item(P + 'ui/header/HeaderPopover.tsx', 150, 'Panel stopProp nested chrome'),
    item(P + 'common/AnchoredPopover.tsx', 88, 'Popover panel stopProp+mouseenter'),
    item(
      P + 'modals/cityInfo/ServicesCategoryList.tsx',
      223,
      'Phone/actions stopProp on expand card',
    ),
    item(P + 'layout/Sidebar.tsx', 704, 'Sponsor grip/add stopProp cluster'),
    item(P + 'layout/Sidebar.tsx', 796, 'Sponsor grip/add stopProp cluster (second surface)'),
    item(P + 'rankings/CityRow.tsx', 53, 'Thumb zoom stopProp inside navigable row'),
    item(P + 'modals/SectionPreviewModal.tsx', 366, 'Lightbox bottom chrome stopProp'),
    item(
      P + 'modals/sectionPreview/PreviewHero.tsx',
      146,
      'Desc panel stopProp; parent overlay still has onClick (case B)',
    ),
    item(
      P + 'myspace/ViaggioRicordamiControl.tsx',
      131,
      'Control wrapper stopProp shielding parent card',
    ),
  ],
});

add({
  id: 'S-CARD-ROW',
  name: 'Card/row/tile open/select (nesting or UX review)',
  risk: 'ARCH',
  contract: null,
  trancheA_reuse: 'none',
  excluded_from_batch:
    'Card/row open/select — nesting or product pattern; not mechanical button batch',
  smoke: null,
  items: [
    item(P + 'admin/AdminSocialStudio.tsx', 181, 'Template row select with nested delete button'),
    item(P + 'admin/cities/RegionalAnalysisModal.tsx', 725, 'City selection card'),
    item(P + 'admin/cities/ZoneCard.tsx', 312, 'City row select with nested action buttons'),
    item(P + 'admin/observatory/AnomalyInspector.tsx', 369, 'POI anomaly card opens edit'),
    item(P + 'city/CityCard.tsx', 142, 'City card open with nested favorite'),
    item(
      P + 'city/CityHistory.tsx',
      16,
      'Expand header with nested Angolo Cultura button',
    ),
    item(P + 'city/gallery/GalleryGrid.tsx', 50, 'Photo tile opens lightbox'),
    item(P + 'city/ShowcaseCards.tsx', 138, 'Horizontal POI card open+drag+actions'),
    item(P + 'city/ShowcaseCards.tsx', 218, 'Vertical POI card open+drag+actions'),
    item(P + 'common/AdPlaceholder.tsx', 44, 'Optional onClick ad tile'),
    item(P + 'common/ImageWithFallback.tsx', 108, 'Generic onClick wrapper utility'),
    item(P + 'community/liveFeed/LiveFeedCarousel.tsx', 40, 'Snap tile select/lightbox'),
    item(P + 'community/QaForumTab.tsx', 454, 'Post card open with nested like/reply'),
    item(P + 'features/diary/DiaryMemoCard.tsx', 104, 'Memo open with nested remove button'),
    item(
      P + 'features/diary/packing_list/suitcase/SuitcaseItemRow.tsx',
      113,
      'Item select row with drag grip nested',
    ),
    item(P + 'home/CuratedGridSection.tsx', 17, 'MiniCityCard open'),
    item(P + 'home/HomeContent.tsx', 214, 'Sponsor POI card with nested add/drag'),
    item(P + 'itineraries/ItinerariesList.tsx', 53, 'Itinerary card select with nested like'),
    item(P + 'layout/Sidebar.tsx', 352, 'Compact sponsor card open'),
    item(
      P + 'layout/Sidebar.tsx',
      676,
      'Focus-companion sponsor card with nested actions',
    ),
    item(P + 'layout/Sidebar.tsx', 772, 'Tour sponsor card with nested actions'),
    item(
      P + 'modals/cityInfo/CityEventsTab.tsx',
      133,
      'Event expand header with nested add/chevron buttons',
    ),
    item(
      P + 'modals/cityInfo/ServicesCategoryList.tsx',
      194,
      'Service expand card with nested actions',
    ),
    item(P + 'modals/sectionPreview/PreviewGallery.tsx', 123, 'Gallery tile opens lightbox'),
    item(P + 'modals/sectionPreview/PreviewSidebar.tsx', 55, 'Sidebar city/service select row'),
    item(P + 'rankings/PhotoGrid.tsx', 29, 'Photo tile opens viewer'),
    item(P + 'rankings/PoiList.tsx', 15, 'POI list row open'),
    item(P + 'shop/ShopCard.tsx', 39, 'Shop card open with nested favorite/products'),
    item(P + 'shop/ShopHero.tsx', 52, 'Hero gallery slide opens lightbox'),
    item(P + 'shop/ShopHomeView.tsx', 99, 'Empty gold promo CTA surface'),
    item(P + 'shop/ShopProducts.tsx', 64, 'Product card select'),
    item(P + 'user/dashboard/UserNotificationsTab.tsx', 237, 'Notification row open'),
  ],
});

for (const m of macros) {
  m.hits = m.items.length;
  m.locations = m.items.length;
  m.files = new Set(m.items.map((i) => i.file)).size;
}

const allItems = macros.flatMap((m) => m.items);
const hitSum = allItems.length;
const files = new Set(allItems.map((i) => i.file)).size;
const low = macros
  .filter((m) => m.risk === 'LOW' || m.risk === 'LOW_COND')
  .reduce((s, m) => s + m.hits, 0);

const detail = require('./_tmp_static101_detail.json');
const expected = new Set(detail.hits.map((h) => h.file + ':' + h.line));
const got = new Set(allItems.map((i) => i.file + ':' + i.line));
const missing = [...expected].filter((k) => !got.has(k));
const extra = [...got].filter((k) => !expected.has(k));

if (hitSum !== 101 || missing.length || extra.length) {
  console.error({ hitSum, files, low, missing, extra });
  process.exit(2);
}

const out = {
  totals: { hits: 101, files: 68, locations: 101 },
  macros,
  low_risk_total_hits: low,
  notes: [
    'Auto S-DIMMER-A1 largely false-positive: absolute inset-0 often image overlays inside cards, not modal dimmers.',
    'stopProp: no proven type-A redundant-only cases (would need parent already A1 sibling button); all uncertain/B/C → MED S-SHIELD-NESTED.',
    'EditorMedia/TabMedia dashed tiles use prompt(URL), not file input — separate from S-UPLOAD.',
    'Hero expand vs LiveFeed lightbox kept separate (S-HERO-EXPAND / S-HERO-LIGHTBOX); AI typing submit is S-HERO-SUBMIT.',
    'Prefer safety: card/row open defaults ARCH even when no nested controls proven for richer tiles (e.g. CuratedGrid, PreviewSidebar, RegionalAnalysis).',
  ],
};

const fs = require('fs');
const text = JSON.stringify(out, null, 2);
fs.writeFileSync(require('path').join(__dirname, '_tmp_static101_manual_out.json'), text, 'utf8');
process.stdout.write(text);

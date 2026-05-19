import { buildSampleFestival, sampleDataModel } from './lib/sample-data.js';

const state = {
  dataModel: structuredClone(sampleDataModel),
  activeEventId: sampleDataModel.events[0]?.id ?? '',
  selectedIds: new Set(loadSelectedIds()),
};

const eventName = document.querySelector('#event-name');
const eventMeta = document.querySelector('#event-meta');
const timetable = document.querySelector('#timetable');
const emptyState = document.querySelector('#empty-state');
const routeList = document.querySelector('#route-list');
const routeSummary = document.querySelector('#route-summary');
const shareButton = document.querySelector('#share-button');
const resetButton = document.querySelector('#reset-button');
const eventSwitcher = document.querySelector('#event-switcher');

const eventForm = document.querySelector('#event-form');
const stageForm = document.querySelector('#stage-form');
const entryForm = document.querySelector('#entry-form');

const eventFormMessage = document.querySelector('#event-form-message');
const stageFormMessage = document.querySelector('#stage-form-message');
const entryFormMessage = document.querySelector('#entry-form-message');
const entryStageSelect = document.querySelector('#entry-form-stage');

function loadSelectedIds() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const raw = params.get('plan');
  return raw ? raw.split(',').filter(Boolean) : [];
}

function persistSelectedIds() {
  const params = new URLSearchParams();
  if (state.selectedIds.size > 0) {
    params.set('plan', Array.from(state.selectedIds).join(','));
  }
  const nextHash = params.toString();
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash ? `#${nextHash}` : ''}`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function getNowIso() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getCurrentEvent() {
  return state.dataModel.events.find((event) => event.id === state.activeEventId) ?? null;
}

function getCurrentStages() {
  return state.dataModel.stages
    .filter((stage) => stage.eventId === state.activeEventId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getCurrentFestival() {
  const event = getCurrentEvent();
  return event ? buildSampleFestival(state.dataModel, event.id) : null;
}

function getStageMap() {
  return new Map(getCurrentStages().map((stage) => [stage.id, stage]));
}

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function rangesOverlap(left, right) {
  return toMinutes(left.start) < toMinutes(right.end) && toMinutes(right.start) < toMinutes(left.end);
}

function getSelectedSlots() {
  const festival = getCurrentFestival();
  if (!festival) {
    return [];
  }

  const selected = festival.slots
    .filter((slot) => state.selectedIds.has(slot.id))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  const conflictIds = new Set();
  selected.forEach((slot, index) => {
    selected.slice(index + 1).forEach((candidate) => {
      if (rangesOverlap(slot, candidate)) {
        conflictIds.add(slot.id);
        conflictIds.add(candidate.id);
      }
    });
  });

  return selected.map((slot) => ({ ...slot, conflict: conflictIds.has(slot.id) }));
}

function formatTimeLabel(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}

function getTimelineMetrics(festival) {
  const starts = festival.slots.map((slot) => toMinutes(slot.start));
  const ends = festival.slots.map((slot) => toMinutes(slot.end));
  const firstMinute = Math.min(...starts);
  const lastMinute = Math.max(...ends);
  const startMinute = Math.floor(firstMinute / 30) * 30;
  const endMinute = Math.ceil(lastMinute / 30) * 30;
  const totalMinutes = Math.max(endMinute - startMinute, 30);
  const halfHourMarks = [];

  for (let minute = startMinute; minute <= endMinute; minute += 30) {
    halfHourMarks.push(minute);
  }

  return {
    startMinute,
    endMinute,
    totalMinutes,
    halfHourMarks,
    timelineHeight: Math.max(totalMinutes * 2, 420),
  };
}

function toggleSlot(slotId) {
  if (state.selectedIds.has(slotId)) {
    state.selectedIds.delete(slotId);
  } else {
    state.selectedIds.add(slotId);
  }
  persistSelectedIds();
  render();
}

function clearSelectionForInactiveSlots(festival) {
  const validIds = new Set(festival?.slots.map((slot) => slot.id) ?? []);
  const nextIds = Array.from(state.selectedIds).filter((slotId) => validIds.has(slotId));
  if (nextIds.length !== state.selectedIds.size) {
    state.selectedIds = new Set(nextIds);
    persistSelectedIds();
  }
}

function setMessage(element, message, isError = false) {
  if (!message) {
    element.hidden = true;
    element.textContent = '';
    element.classList.remove('error');
    return;
  }

  element.hidden = false;
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function updateEventSwitcher() {
  const options = state.dataModel.events
    .map((event) => `
      <option value="${escapeHtml(event.id)}" ${event.id === state.activeEventId ? 'selected' : ''}>
        ${escapeHtml(event.name)}
      </option>
    `)
    .join('');

  eventSwitcher.innerHTML = options;
}

function updateEntryStageOptions() {
  const stages = getCurrentStages();
  if (stages.length === 0) {
    entryStageSelect.innerHTML = '<option value="">先にステージを追加してください</option>';
    entryStageSelect.disabled = true;
    return;
  }

  entryStageSelect.disabled = false;
  entryStageSelect.innerHTML = stages
    .map((stage) => `<option value="${escapeHtml(stage.id)}">${escapeHtml(stage.name)}</option>`)
    .join('');
}

function renderEmptyState(festival) {
  const event = getCurrentEvent();
  const stages = getCurrentStages();
  const slotCount = festival?.slots.length ?? 0;

  if (!event) {
    emptyState.hidden = false;
    emptyState.textContent = 'イベントがありません。管理入力からイベント行を追加してください。';
    return;
  }

  if (stages.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = 'ステージが未登録です。先にステージ行を追加するとタイムテーブルを作れます。';
    return;
  }

  if (slotCount === 0) {
    emptyState.hidden = false;
    emptyState.textContent = 'タイムテーブル行がまだありません。開始時刻と終了時刻を入れて1件目を追加してください。';
    return;
  }

  emptyState.hidden = true;
  emptyState.textContent = '';
}

function renderTimetable() {
  const festival = getCurrentFestival();
  clearSelectionForInactiveSlots(festival);
  renderEmptyState(festival);

  if (!festival) {
    timetable.innerHTML = '';
    return;
  }

  if (festival.slots.length === 0) {
    timetable.innerHTML = '';
    return;
  }

  const selected = getSelectedSlots();
  const conflictIds = new Set(selected.filter((slot) => slot.conflict).map((slot) => slot.id));
  const metrics = getTimelineMetrics(festival);
  const stageCount = festival.stages.length;
  const stageIndexById = new Map(festival.stages.map((stage, index) => [stage.id, index]));
  const axisHtml = metrics.halfHourMarks.map((minute) => `
    <div
      class="timeline-axis-label ${minute % 60 === 0 ? 'major' : 'minor'}"
      style="top: ${((minute - metrics.startMinute) / metrics.totalMinutes) * 100}%"
    >
      ${escapeHtml(formatTimeLabel(minute))}
    </div>
  `).join('');
  const laneHtml = festival.stages.map((stage, index) => `
    <div class="timeline-lane ${index < stageCount - 1 ? 'with-divider' : ''}" aria-hidden="true"></div>
  `).join('');
  const slotHtml = festival.slots.map((slot) => {
    const stageIndex = stageIndexById.get(slot.stageId) ?? 0;
    const startMinute = toMinutes(slot.start);
    const endMinute = toMinutes(slot.end);
    const selectedClass = state.selectedIds.has(slot.id) ? 'selected' : '';
    const conflictClass = conflictIds.has(slot.id) ? 'conflict' : '';
    const top = ((startMinute - metrics.startMinute) / metrics.totalMinutes) * 100;
    const height = ((endMinute - startMinute) / metrics.totalMinutes) * 100;
    const stage = festival.stages[stageIndex];

    return `
      <button
        class="timeline-slot ${selectedClass} ${conflictClass}"
        data-slot-id="${slot.id}"
        style="--lane:${stageIndex}; --slot-top:${top}; --slot-height:${height};"
        aria-label="${escapeHtml(`${slot.artist} ${slot.start}-${slot.end} ${stage?.name ?? ''}`)}"
      >
        <div class="slot-time">${escapeHtml(slot.start)} - ${escapeHtml(slot.end)}</div>
        <div class="slot-artist">${escapeHtml(slot.artist)}</div>
        <div class="slot-stage">${escapeHtml(stage?.shortName ?? stage?.name ?? '')}</div>
      </button>
    `;
  }).join('');

  timetable.innerHTML = `
    <section class="timeline-board" style="--stage-count:${stageCount}; --timeline-height:${metrics.timelineHeight}px;">
      <div class="timeline-header">
        <div class="timeline-header-spacer">Time</div>
        ${festival.stages.map((stage) => `
          <div class="timeline-stage-heading">
            <span class="timeline-stage-short">${escapeHtml(stage.shortName ?? stage.name)}</span>
            <span class="timeline-stage-full">${escapeHtml(stage.name)}</span>
          </div>
        `).join('')}
      </div>
      <div class="timeline-body">
        <div class="timeline-axis">${axisHtml}</div>
        <div class="timeline-grid">
          <div class="timeline-grid-backdrop">${laneHtml}</div>
          <div class="timeline-slots">${slotHtml}</div>
        </div>
      </div>
    </section>
  `;
  timetable.querySelectorAll('[data-slot-id]').forEach((button) => {
    button.addEventListener('click', () => toggleSlot(button.dataset.slotId));
  });
}

function renderRoute() {
  const selected = getSelectedSlots();
  const stagesById = getStageMap();

  if (selected.length === 0) {
    routeSummary.textContent = 'まだ未選択です。タイムテーブルから気になるアーティストを選んでください。';
    routeList.innerHTML = '';
    return;
  }

  const conflictCount = selected.filter((slot) => slot.conflict).length;
  routeSummary.textContent = `${selected.length}組を選択中 / ${conflictCount > 0 ? `${conflictCount}件の時間衝突あり` : '時間衝突なし'}`;
  routeList.innerHTML = selected.map((slot) => `
    <li class="route-item ${slot.conflict ? 'conflict' : ''}">
      <strong>${escapeHtml(slot.artist)}</strong><br />
      <span class="muted">${escapeHtml(slot.start)} - ${escapeHtml(slot.end)} / ${escapeHtml(stagesById.get(slot.stageId)?.name ?? '未設定ステージ')}</span>
    </li>
  `).join('');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

async function copyShareUrl() {
  persistSelectedIds();
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('共有URLをコピーしました');
  } catch {
    showToast('URLコピーに失敗しました');
  }
}

function resetPlan() {
  state.selectedIds.clear();
  persistSelectedIds();
  render();
}

function switchActiveEvent(eventId) {
  state.activeEventId = eventId;
  state.selectedIds.clear();
  persistSelectedIds();
  setMessage(stageFormMessage, '');
  setMessage(entryFormMessage, '');
  render();
}

function findArtistByName(name) {
  return state.dataModel.artists.find((artist) => artist.name.toLowerCase() === name.trim().toLowerCase()) ?? null;
}

function buildArtistId(name) {
  const baseSlug = slugify(name.trim()) || 'artist';
  let artistId = baseSlug;
  let suffix = 2;
  while (state.dataModel.artists.some((artist) => artist.id === artistId)) {
    artistId = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return artistId;
}

function createArtistIfNeeded(name) {
  const normalizedName = name.trim();
  const existing = findArtistByName(normalizedName);
  if (existing) {
    return existing.id;
  }

  const artistId = buildArtistId(normalizedName);
  const timestamp = getNowIso();
  state.dataModel.artists.push({
    id: artistId,
    name: normalizedName,
    aliases: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return artistId;
}

function handleCreateEvent(event) {
  event.preventDefault();

  const formData = new FormData(eventForm);
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate') ?? '').trim();
  const endDate = String(formData.get('endDate') ?? '').trim() || startDate;
  const venueName = String(formData.get('venueName') ?? '').trim();

  if (!name || !startDate || !venueName) {
    setMessage(eventFormMessage, 'イベント名、開催日、会場は必須です。', true);
    return;
  }

  if (endDate < startDate) {
    setMessage(eventFormMessage, '終了日は開催日以降にしてください。', true);
    return;
  }

  const baseId = `${slugify(name) || 'event'}-${startDate.slice(0, 4)}`;
  let eventId = baseId;
  let suffix = 2;
  while (state.dataModel.events.some((item) => item.id === eventId)) {
    eventId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  const timestamp = getNowIso();
  state.dataModel.events.push({
    id: eventId,
    seriesSlug: slugify(name) || eventId,
    name,
    startDate,
    endDate,
    timezone: 'Asia/Tokyo',
    venueName,
    city: 'Tokyo',
    countryCode: 'JP',
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  state.activeEventId = eventId;
  state.selectedIds.clear();
  persistSelectedIds();
  eventForm.reset();
  setMessage(eventFormMessage, 'イベント行を追加しました。続けてステージを登録できます。');
  setMessage(stageFormMessage, '');
  setMessage(entryFormMessage, '');
  render();
}

function handleCreateStage(event) {
  event.preventDefault();

  const currentEvent = getCurrentEvent();
  if (!currentEvent) {
    setMessage(stageFormMessage, '先にイベント行を追加してください。', true);
    return;
  }

  const formData = new FormData(stageForm);
  const name = String(formData.get('name') ?? '').trim();
  const shortName = String(formData.get('shortName') ?? '').trim();

  if (!name) {
    setMessage(stageFormMessage, 'ステージ名は必須です。', true);
    return;
  }

  const normalizedName = name.toLowerCase();
  const duplicate = getCurrentStages().some((stage) => stage.name.toLowerCase() === normalizedName);
  if (duplicate) {
    setMessage(stageFormMessage, '同じイベント内で同名ステージは追加できません。', true);
    return;
  }

  const timestamp = getNowIso();
  const stageId = `${currentEvent.id}:${slugify(name) || `stage-${getCurrentStages().length + 1}`}`;
  state.dataModel.stages.push({
    id: stageId,
    eventId: currentEvent.id,
    name,
    shortName: shortName || name,
    sortOrder: getCurrentStages().length + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  stageForm.reset();
  setMessage(stageFormMessage, 'ステージ行を追加しました。');
  setMessage(entryFormMessage, '');
  render();
}

function handleCreateTimetableEntry(event) {
  event.preventDefault();

  const currentEvent = getCurrentEvent();
  if (!currentEvent) {
    setMessage(entryFormMessage, '先にイベント行を追加してください。', true);
    return;
  }

  const stages = getCurrentStages();
  if (stages.length === 0) {
    setMessage(entryFormMessage, '先にステージ行を追加してください。', true);
    return;
  }

  const formData = new FormData(entryForm);
  const artistName = String(formData.get('artist') ?? '').trim();
  const stageId = String(formData.get('stageId') ?? '').trim();
  const start = String(formData.get('start') ?? '').trim();
  const end = String(formData.get('end') ?? '').trim();

  if (!artistName || !stageId || !start || !end) {
    setMessage(entryFormMessage, 'アーティスト、ステージ、開始、終了は必須です。', true);
    return;
  }

  if (!stages.some((stage) => stage.id === stageId)) {
    setMessage(entryFormMessage, '選択中イベントのステージを指定してください。', true);
    return;
  }

  if (end <= start) {
    setMessage(entryFormMessage, '終了時刻は開始時刻より後にしてください。', true);
    return;
  }

  const startAt = `${currentEvent.startDate}T${start}:00+09:00`;
  const endAt = `${currentEvent.startDate}T${end}:00+09:00`;
  const existingArtist = findArtistByName(artistName);
  const artistId = existingArtist?.id ?? buildArtistId(artistName);

  const hasStageConflict = state.dataModel.timetableEntries.some((entry) => (
    entry.eventId === currentEvent.id &&
    entry.stageId === stageId &&
    entry.startAt === startAt &&
    entry.status === 'scheduled'
  ));
  if (hasStageConflict) {
    setMessage(entryFormMessage, '同じステージの同時刻には追加できません。', true);
    return;
  }

  const hasArtistConflict = state.dataModel.timetableEntries.some((entry) => (
    entry.eventId === currentEvent.id &&
    entry.artistId === artistId &&
    entry.startAt === startAt &&
    entry.status === 'scheduled'
  ));
  if (hasArtistConflict) {
    setMessage(entryFormMessage, '同じアーティストの同時刻行が既にあります。', true);
    return;
  }

  const timestamp = getNowIso();
  const entryId = `${currentEvent.id}:${stageId.split(':').pop()}:${artistId}:${currentEvent.startDate}t${start}`;
  if (!existingArtist) {
    createArtistIfNeeded(artistName);
  }
  state.dataModel.timetableEntries.push({
    id: entryId,
    eventId: currentEvent.id,
    artistId,
    stageId,
    startAt,
    endAt,
    status: 'scheduled',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  entryForm.reset();
  updateEntryStageOptions();
  setMessage(entryFormMessage, 'タイムテーブル行を追加しました。タイムテーブルに即反映されています。');
  render();
}

function render() {
  const festival = getCurrentFestival();

  updateEventSwitcher();
  updateEntryStageOptions();

  eventName.textContent = festival?.name ?? 'イベント未選択';
  eventMeta.textContent = festival ? `${festival.date} / ${festival.venue}` : '管理入力からイベントを追加してください。';

  renderTimetable();
  renderRoute();
}

shareButton.addEventListener('click', copyShareUrl);
resetButton.addEventListener('click', resetPlan);
eventSwitcher.addEventListener('change', (event) => switchActiveEvent(event.target.value));
eventForm.addEventListener('submit', handleCreateEvent);
stageForm.addEventListener('submit', handleCreateStage);
entryForm.addEventListener('submit', handleCreateTimetableEntry);

render();

import { buildSampleFestival, sampleDataModel } from './lib/sample-data.js';

const STORAGE_KEY_PREFIX = 'fes-route:plan:';
const COMPARISON_STORAGE_KEY_PREFIX = 'fes-route:comparison:';

function readHashState() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    eventId: params.get('event') ?? '',
    selectedIds: (params.get('plan') ?? '').split(',').filter(Boolean),
    isSharedView: params.get('view') === 'shared',
  };
}

const state = {
  dataModel: structuredClone(sampleDataModel),
  activeEventId: '',
  selectedIds: new Set(),
  isSharedView: false,
  comparisonPlans: [],
  isMobileRouteTrayOpen: false,
};

const eventName = document.querySelector('#event-name');
const eventMeta = document.querySelector('#event-meta');
const commandEventName = document.querySelector('#command-event-name');
const commandEventMeta = document.querySelector('#command-event-meta');
const timetable = document.querySelector('#timetable');
const emptyState = document.querySelector('#empty-state');
const routeList = document.querySelector('#route-list');
const routeSummary = document.querySelector('#route-summary');
const routeMetrics = document.querySelector('#route-metrics');
const routeConflictAlert = document.querySelector('#route-conflict-alert');
const sharedContext = document.querySelector('#shared-context');
const openPersonalPlanButton = document.querySelector('#open-personal-plan-button');
const shareButton = document.querySelector('#share-button');
const resetButton = document.querySelector('#reset-button');
const routeShareButton = document.querySelector('#route-share-button');
const routeResetButton = document.querySelector('#route-reset-button');
const mobileRouteTray = document.querySelector('#mobile-route-tray');
const mobileRouteToggle = document.querySelector('#mobile-route-toggle');
const mobileRouteSummary = document.querySelector('#mobile-route-summary');
const mobileRouteMetrics = document.querySelector('#mobile-route-metrics');
const mobileRouteConflictAlert = document.querySelector('#mobile-route-conflict-alert');
const mobileRouteList = document.querySelector('#mobile-route-list');
const mobileShareButton = document.querySelector('#mobile-share-button');
const mobileResetButton = document.querySelector('#mobile-reset-button');
const eventSwitcher = document.querySelector('#event-switcher');
const adminPanel = document.querySelector('#admin-panel');

const eventForm = document.querySelector('#event-form');
const stageForm = document.querySelector('#stage-form');
const entryForm = document.querySelector('#entry-form');
const comparisonForm = document.querySelector('#comparison-form');

const eventFormMessage = document.querySelector('#event-form-message');
const stageFormMessage = document.querySelector('#stage-form-message');
const entryFormMessage = document.querySelector('#entry-form-message');
const comparisonMessage = document.querySelector('#comparison-message');
const entryStageSelect = document.querySelector('#entry-form-stage');
const comparisonSummary = document.querySelector('#comparison-summary');
const comparisonList = document.querySelector('#comparison-list');

function getPlanStorageKey(eventId) {
  return `${STORAGE_KEY_PREFIX}${eventId}`;
}

function getComparisonStorageKey(eventId) {
  return `${COMPARISON_STORAGE_KEY_PREFIX}${eventId}`;
}

function loadStoredSelectedIds(eventId) {
  if (!eventId) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getPlanStorageKey(eventId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string' && value) : [];
  } catch {
    return [];
  }
}

function loadStoredComparisonPlans(eventId) {
  if (!eventId) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getComparisonStorageKey(eventId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((plan) => (
        plan &&
        typeof plan.id === 'string' &&
        typeof plan.name === 'string' &&
        Array.isArray(plan.selectedIds)
      ))
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        selectedIds: plan.selectedIds.filter((value) => typeof value === 'string' && value),
      }));
  } catch {
    return [];
  }
}

function persistComparisonPlans() {
  if (!state.activeEventId) {
    return;
  }

  try {
    window.localStorage.setItem(getComparisonStorageKey(state.activeEventId), JSON.stringify(state.comparisonPlans));
  } catch {
    // Comparison is a convenience layer; the source share URLs remain reusable.
  }
}

function persistSelectedIds() {
  if (!state.isSharedView && state.activeEventId) {
    try {
      window.localStorage.setItem(getPlanStorageKey(state.activeEventId), JSON.stringify(Array.from(state.selectedIds)));
    } catch {
      // Hash state still keeps the current plan shareable if storage is unavailable.
    }
  }

  const params = new URLSearchParams();
  if (state.activeEventId) {
    params.set('event', state.activeEventId);
  }
  if (state.selectedIds.size > 0) {
    params.set('plan', Array.from(state.selectedIds).join(','));
  }
  if (state.isSharedView) {
    params.set('view', 'shared');
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

function setActiveEventFromState(eventId) {
  const fallbackEventId = state.dataModel.events[0]?.id ?? '';
  const nextEventId = state.dataModel.events.some((event) => event.id === eventId) ? eventId : fallbackEventId;
  state.activeEventId = nextEventId;
  return nextEventId;
}

function hydrateStateFromLocation() {
  const hashState = readHashState();
  const activeEventId = setActiveEventFromState(hashState.eventId);
  state.isSharedView = hashState.isSharedView;
  state.selectedIds = new Set(
    hashState.selectedIds.length > 0 || state.isSharedView
      ? hashState.selectedIds
      : loadStoredSelectedIds(activeEventId)
  );
  state.comparisonPlans = loadStoredComparisonPlans(activeEventId);
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

function getStageColor(index) {
  const colors = ['#76e4c3', '#8ba8ff', '#ffb86b', '#f472b6', '#a3e635', '#67e8f9'];
  return colors[index % colors.length];
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

function getMoveTimeBetween(left, right) {
  if (!left || !right) {
    return 0;
  }

  return left.stageId === right.stageId ? 0 : 5;
}

function getRoutePlan() {
  const selected = getSelectedSlots();
  const stages = getCurrentStages();
  const stageIndexById = new Map(stages.map((stage, index) => [stage.id, index]));
  const routeItems = selected.map((slot, index) => {
    const next = selected[index + 1] ?? null;
    const moveTime = getMoveTimeBetween(slot, next);
    const gapToNext = next ? toMinutes(next.start) - toMinutes(slot.end) : null;

    return {
      ...slot,
      order: index + 1,
      moveTime,
      gapToNext,
      hasOverlap: gapToNext !== null && gapToNext < 0,
      hasTightMove: gapToNext !== null && gapToNext >= 0 && gapToNext < moveTime,
      stageColor: getStageColor(stageIndexById.get(slot.stageId) ?? index),
    };
  });

  return {
    selected: routeItems,
    selectedCount: routeItems.length,
    conflictCount: routeItems.filter((slot) => slot.conflict).length,
    moveTimeTotal: routeItems.reduce((total, slot) => total + slot.moveTime, 0),
  };
}

function getSlotsById() {
  const festival = getCurrentFestival();
  return new Map((festival?.slots ?? []).map((slot) => [slot.id, slot]));
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
  if (state.isSharedView) {
    return;
  }

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
        style="--lane:${stageIndex}; --slot-top:${top}; --slot-height:${height}; --stage-color:${getStageColor(stageIndex)};"
        aria-label="${escapeHtml(`${slot.artist} ${slot.start}-${slot.end} ${stage?.name ?? ''}`)}"
        ${state.isSharedView ? 'disabled' : ''}
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
        ${festival.stages.map((stage, index) => `
          <div class="timeline-stage-heading" style="--stage-color:${getStageColor(index)};">
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

function renderRouteMetrics(container, routePlan) {
  container.innerHTML = `
    <span><strong>${routePlan.selectedCount}</strong>選択</span>
    <span><strong>${routePlan.moveTimeTotal}</strong>分移動</span>
    <span class="${routePlan.conflictCount > 0 ? 'danger' : ''}"><strong>${routePlan.conflictCount}</strong>衝突</span>
  `;
}

function renderConflictAlert(element, routePlan) {
  if (routePlan.conflictCount === 0) {
    element.hidden = true;
    element.textContent = '';
    return;
  }

  element.hidden = false;
  element.textContent = `${routePlan.conflictCount}件の時間衝突があります。重なっている枠は赤い表示で確認できます。`;
}

function renderRouteList(container, routePlan) {
  const stagesById = getStageMap();

  container.innerHTML = routePlan.selected.map((slot) => {
    const moveLabel = slot.moveTime === 0 ? '次まで同ステージ' : `次まで徒歩 ${slot.moveTime}分`;
    const moveState = slot.hasOverlap
      ? '時間衝突あり'
      : slot.hasTightMove
        ? '移動余裕が少ない'
        : moveLabel;

    return `
      <li class="route-item ${slot.conflict ? 'conflict' : ''}" style="--stage-color:${slot.stageColor};">
        <div class="route-marker">${slot.order}</div>
        <div class="route-item-body">
          <div class="route-item-row">
            <div>
              <strong>${escapeHtml(slot.artist)}</strong><br />
              <span class="muted">${escapeHtml(slot.start)} - ${escapeHtml(slot.end)} / ${escapeHtml(stagesById.get(slot.stageId)?.name ?? '未設定ステージ')}</span>
            </div>
            ${state.isSharedView ? '' : `<button class="route-remove" type="button" data-remove-slot-id="${slot.id}">外す</button>`}
          </div>
          ${slot.gapToNext === null ? '' : `<p class="route-move ${slot.hasOverlap || slot.hasTightMove ? 'warning' : ''}">${escapeHtml(moveState)}</p>`}
        </div>
      </li>
    `;
  }).join('');

  container.querySelectorAll('[data-remove-slot-id]').forEach((button) => {
    button.addEventListener('click', () => toggleSlot(button.dataset.removeSlotId));
  });
}

function updateMobileRouteTray() {
  mobileRouteTray.classList.toggle('expanded', state.isMobileRouteTrayOpen);
  mobileRouteToggle.setAttribute('aria-expanded', String(state.isMobileRouteTrayOpen));
}

function renderRoute() {
  const routePlan = getRoutePlan();
  const emptyMessage = state.isSharedView
    ? 'この共有プランにはまだ選択された出演枠がありません。'
    : 'まだ未選択です。タイムテーブルから気になるアーティストを選んでください。';
  const summaryText = routePlan.selectedCount === 0
    ? emptyMessage
    : `${routePlan.selectedCount}組を選択中 / 移動 ${routePlan.moveTimeTotal}分（未登録区間は徒歩5分） / ${routePlan.conflictCount > 0 ? `${routePlan.conflictCount}件の時間衝突あり` : '時間衝突なし'}`;

  routeSummary.textContent = summaryText;
  mobileRouteSummary.textContent = `選択 ${routePlan.selectedCount}組 / 移動 ${routePlan.moveTimeTotal}分 / 衝突 ${routePlan.conflictCount}件`;
  renderRouteMetrics(routeMetrics, routePlan);
  renderRouteMetrics(mobileRouteMetrics, routePlan);
  renderConflictAlert(routeConflictAlert, routePlan);
  renderConflictAlert(mobileRouteConflictAlert, routePlan);

  if (routePlan.selectedCount === 0) {
    routeList.innerHTML = '';
    mobileRouteList.innerHTML = '';
    return;
  }

  renderRouteList(routeList, routePlan);
  renderRouteList(mobileRouteList, routePlan);
}

function parseSharedPlanUrl(value) {
  let parsedUrl;
  try {
    parsedUrl = new URL(value, window.location.href);
  } catch {
    return { error: '共有URLを正しく入力してください。' };
  }

  const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const eventId = params.get('event') ?? '';
  const selectedIds = (params.get('plan') ?? '').split(',').filter(Boolean);

  if (!eventId || eventId !== state.activeEventId) {
    return { error: '現在表示中のイベントと同じ共有URLを追加してください。' };
  }

  if (selectedIds.length === 0) {
    return { error: '選択された出演枠を含む共有URLを追加してください。' };
  }

  const slotsById = getSlotsById();
  const validSelectedIds = selectedIds.filter((slotId) => slotsById.has(slotId));
  if (validSelectedIds.length === 0) {
    return { error: 'このイベント内で使える出演枠が見つかりませんでした。' };
  }

  return { eventId, selectedIds: [...new Set(validSelectedIds)] };
}

function handleAddComparisonPlan(event) {
  event.preventDefault();

  const formData = new FormData(comparisonForm);
  const name = String(formData.get('name') ?? '').trim();
  const url = String(formData.get('url') ?? '').trim();

  if (!name || !url) {
    setMessage(comparisonMessage, '表示名と共有URLは必須です。', true);
    return;
  }

  const parsed = parseSharedPlanUrl(url);
  if (parsed.error) {
    setMessage(comparisonMessage, parsed.error, true);
    return;
  }

  state.comparisonPlans.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    selectedIds: parsed.selectedIds,
  });
  persistComparisonPlans();
  comparisonForm.reset();
  setMessage(comparisonMessage, `${name} を比較に追加しました。`);
  renderComparison();
}

function removeComparisonPlan(planId) {
  state.comparisonPlans = state.comparisonPlans.filter((plan) => plan.id !== planId);
  persistComparisonPlans();
  setMessage(comparisonMessage, '');
  renderComparison();
}

function renderComparison() {
  const slotsById = getSlotsById();
  const stagesById = getStageMap();
  const plans = state.comparisonPlans
    .map((plan) => ({
      ...plan,
      selectedIds: plan.selectedIds.filter((slotId) => slotsById.has(slotId)),
    }))
    .filter((plan) => plan.selectedIds.length > 0);

  if (plans.length === 0) {
    comparisonSummary.innerHTML = '<p class="muted">まだ比較プランがありません。友人の共有URLを追加してください。</p>';
    comparisonList.innerHTML = '';
    return;
  }

  const planNamesBySlotId = new Map();
  plans.forEach((plan) => {
    plan.selectedIds.forEach((slotId) => {
      const names = planNamesBySlotId.get(slotId) ?? [];
      names.push(plan.name);
      planNamesBySlotId.set(slotId, names);
    });
  });

  const comparedSlots = Array.from(planNamesBySlotId.entries())
    .map(([slotId, names]) => ({ slot: slotsById.get(slotId), names }))
    .filter((item) => item.slot)
    .sort((a, b) => toMinutes(a.slot.start) - toMinutes(b.slot.start));
  const overlapCount = comparedSlots.filter((item) => item.names.length > 1).length;

  comparisonSummary.innerHTML = `
    <div class="comparison-metrics">
      <span><strong>${plans.length}</strong>人</span>
      <span><strong>${comparedSlots.length}</strong>枠</span>
      <span><strong>${overlapCount}</strong>件重なり</span>
    </div>
    <div class="comparison-plan-chips">
      ${plans.map((plan) => `
        <button class="comparison-plan-chip" type="button" data-remove-comparison-id="${escapeHtml(plan.id)}" aria-label="${escapeHtml(`${plan.name} を比較から外す`)}">
          ${escapeHtml(plan.name)} <span>×</span>
        </button>
      `).join('')}
    </div>
  `;

  comparisonList.innerHTML = comparedSlots.map(({ slot, names }) => {
    const overlapClass = names.length > 1 ? 'overlap' : 'solo';
    return `
      <article class="comparison-item ${overlapClass}">
        <div>
          <div class="comparison-item-time">${escapeHtml(slot.start)} - ${escapeHtml(slot.end)}</div>
          <h3>${escapeHtml(slot.artist)}</h3>
          <p>${escapeHtml(stagesById.get(slot.stageId)?.name ?? '未設定ステージ')}</p>
        </div>
        <div class="comparison-name-stack">
          ${names.map((name) => `<span>${escapeHtml(name)}</span>`).join('')}
        </div>
      </article>
    `;
  }).join('');

  comparisonSummary.querySelectorAll('[data-remove-comparison-id]').forEach((button) => {
    button.addEventListener('click', () => removeComparisonPlan(button.dataset.removeComparisonId));
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

async function copyShareUrl() {
  const shareUrl = new URL(window.location.href);
  const params = new URLSearchParams();
  if (state.activeEventId) {
    params.set('event', state.activeEventId);
  }
  if (state.selectedIds.size > 0) {
    params.set('plan', Array.from(state.selectedIds).join(','));
  }
  params.set('view', 'shared');
  shareUrl.hash = params.toString();

  try {
    await navigator.clipboard.writeText(shareUrl.toString());
    showToast('共有URLをコピーしました');
  } catch {
    showToast('URLコピーに失敗しました');
  }
}

function resetPlan() {
  if (state.isSharedView) {
    return;
  }

  state.selectedIds.clear();
  persistSelectedIds();
  render();
}

function switchActiveEvent(eventId) {
  if (state.isSharedView) {
    return;
  }

  state.activeEventId = eventId;
  state.selectedIds = new Set(loadStoredSelectedIds(eventId));
  state.comparisonPlans = loadStoredComparisonPlans(eventId);
  persistSelectedIds();
  setMessage(stageFormMessage, '');
  setMessage(entryFormMessage, '');
  setMessage(comparisonMessage, '');
  render();
}

function openSharedPlanAsPersonal() {
  state.isSharedView = false;
  persistSelectedIds();
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
  state.isSharedView = false;
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
  const selected = getSelectedSlots();
  const conflictCount = selected.filter((slot) => slot.conflict).length;

  updateEventSwitcher();
  updateEntryStageOptions();

  eventName.textContent = festival?.name ?? 'イベント未選択';
  eventMeta.textContent = festival ? `${festival.date} / ${festival.venue}` : '管理入力からイベントを追加してください。';
  commandEventName.textContent = festival?.name ?? 'イベント未選択';
  commandEventMeta.textContent = festival ? `${festival.date} / ${festival.venue}` : '管理入力からイベントを追加してください。';
  sharedContext.hidden = !state.isSharedView;
  sharedContext.textContent = state.isSharedView
    ? `ログイン不要の共有ビューです。${selected.length}組を表示中${conflictCount > 0 ? ` / ${conflictCount}件の時間衝突あり` : ''}。`
    : '';
  openPersonalPlanButton.hidden = !state.isSharedView;
  adminPanel.hidden = state.isSharedView;
  shareButton.textContent = state.isSharedView ? 'この共有URLをコピー' : '共有URLをコピー';
  routeShareButton.textContent = state.isSharedView ? 'この共有URLをコピー' : '共有URLをコピー';
  mobileShareButton.textContent = state.isSharedView ? 'この共有URLをコピー' : '共有URLをコピー';
  resetButton.disabled = state.isSharedView;
  routeResetButton.disabled = state.isSharedView;
  mobileResetButton.disabled = state.isSharedView;
  eventSwitcher.disabled = state.isSharedView;

  renderTimetable();
  renderRoute();
  renderComparison();
  updateMobileRouteTray();
}

hydrateStateFromLocation();

shareButton.addEventListener('click', copyShareUrl);
routeShareButton.addEventListener('click', copyShareUrl);
mobileShareButton.addEventListener('click', copyShareUrl);
resetButton.addEventListener('click', resetPlan);
routeResetButton.addEventListener('click', resetPlan);
mobileResetButton.addEventListener('click', resetPlan);
openPersonalPlanButton.addEventListener('click', openSharedPlanAsPersonal);
eventSwitcher.addEventListener('change', (event) => switchActiveEvent(event.target.value));
mobileRouteToggle.addEventListener('click', () => {
  state.isMobileRouteTrayOpen = !state.isMobileRouteTrayOpen;
  updateMobileRouteTray();
});
document.querySelectorAll('[data-coming-soon]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.comingSoon));
});
eventForm.addEventListener('submit', handleCreateEvent);
stageForm.addEventListener('submit', handleCreateStage);
entryForm.addEventListener('submit', handleCreateTimetableEntry);
comparisonForm.addEventListener('submit', handleAddComparisonPlan);
window.addEventListener('hashchange', () => {
  hydrateStateFromLocation();
  render();
});

render();

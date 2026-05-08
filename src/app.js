import { sampleFestival } from './lib/sample-data.js';

const state = {
  selectedIds: new Set(loadSelectedIds()),
};

const eventName = document.querySelector('#event-name');
const eventMeta = document.querySelector('#event-meta');
const timetable = document.querySelector('#timetable');
const routeList = document.querySelector('#route-list');
const routeSummary = document.querySelector('#route-summary');
const shareButton = document.querySelector('#share-button');
const resetButton = document.querySelector('#reset-button');

const stagesById = new Map(sampleFestival.stages.map((stage) => [stage.id, stage]));

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

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getSelectedSlots() {
  return sampleFestival.slots
    .filter((slot) => state.selectedIds.has(slot.id))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((slot, index, all) => {
      const prev = all[index - 1];
      const conflict = prev ? toMinutes(slot.start) < toMinutes(prev.end) : false;
      return { ...slot, conflict };
    });
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

function renderTimetable() {
  const selected = getSelectedSlots();
  const conflictIds = new Set(selected.filter((slot) => slot.conflict).map((slot) => slot.id));
  const stageHtml = sampleFestival.stages.map((stage) => {
    const slots = sampleFestival.slots.filter((slot) => slot.stageId === stage.id);
    const slotHtml = slots.map((slot) => {
      const selectedClass = state.selectedIds.has(slot.id) ? 'selected' : '';
      const conflictClass = conflictIds.has(slot.id) ? 'conflict' : '';
      return `
        <button class="slot ${selectedClass} ${conflictClass}" data-slot-id="${slot.id}">
          <div class="slot-time">${slot.start} - ${slot.end}</div>
          <div class="slot-artist">${slot.artist}</div>
          <div class="slot-stage">${stage.name}</div>
        </button>
      `;
    }).join('');

    return `
      <section class="stage-column">
        <h3>${stage.name}</h3>
        <div class="slot-list">${slotHtml}</div>
      </section>
    `;
  }).join('');

  timetable.innerHTML = stageHtml;
  timetable.querySelectorAll('[data-slot-id]').forEach((button) => {
    button.addEventListener('click', () => toggleSlot(button.dataset.slotId));
  });
}

function renderRoute() {
  const selected = getSelectedSlots();
  if (selected.length === 0) {
    routeSummary.textContent = 'まだ未選択です。タイムテーブルから気になるアーティストを選んでください。';
    routeList.innerHTML = '';
    return;
  }

  const conflictCount = selected.filter((slot) => slot.conflict).length;
  routeSummary.textContent = `${selected.length}組を選択中 / ${conflictCount > 0 ? `${conflictCount}件の時間衝突あり` : '時間衝突なし'}`;
  routeList.innerHTML = selected.map((slot) => `
    <li class="route-item ${slot.conflict ? 'conflict' : ''}">
      <strong>${slot.artist}</strong><br />
      <span class="muted">${slot.start} - ${slot.end} / ${stagesById.get(slot.stageId).name}</span>
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

function render() {
  eventName.textContent = sampleFestival.name;
  eventMeta.textContent = `${sampleFestival.date} / ${sampleFestival.venue}`;
  renderTimetable();
  renderRoute();
}

shareButton.addEventListener('click', copyShareUrl);
resetButton.addEventListener('click', resetPlan);
render();

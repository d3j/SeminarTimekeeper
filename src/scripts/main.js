import $ from 'jquery';
import {
  createDefaultParts,
  sanitizeParts,
  readConfigFromUrl,
  writeConfigToUrl,
  partsToTimers
} from './config.js';
import { formatDuration, generateId } from './utils.js';
import { TimerCoordinator } from './timer.js';

const TICK_MS = 500;
const WARNING_THRESHOLD_MS = 60 * 1000;

const $setupTab = $('#setupTab');
const $runTab = $('#runTab');
const $setupPanel = $('#setupPanel');
const $runPanel = $('#runPanel');
const $partsList = $('#partsList');
const $shareLink = $('#shareLink');
const $runPartsList = $('#runPartsList');
const $runSummary = $('.tk-run__summary');
const $totalElapsed = $('#totalElapsed');
const $totalRemaining = $('#totalRemaining');
const $totalProgress = $('#totalProgressBar');
const $stopBtn = $('#stopBtn');
const $resumeBtn = $('#resumeBtn');

let setupParts = restoreInitialParts();
let timerCoordinator = new TimerCoordinator(partsToTimers(sanitizeParts(setupParts)));
let runPartRefs = new Map();

renderSetupParts();
renderRunParts();
updateShareLink();
updateRunUi();
setInterval(updateRunUi, TICK_MS);

$setupTab.on('click', () => switchMode('setup'));
$runTab.on('click', () => switchMode('run'));
$('#addPartBtn').on('click', handleAddPart);
$('#copyLinkBtn').on('click', handleCopyLink);
$('#applyConfigBtn').on('click', applyConfiguration);
$stopBtn.on('click', () => {
  timerCoordinator.stop();
  updateRunUi();
});
$resumeBtn.on('click', () => {
  timerCoordinator.resume();
  updateRunUi();
});

function restoreInitialParts() {
  const fromUrl = readConfigFromUrl();
  if (fromUrl && fromUrl.length) {
    return fromUrl;
  }
  return createDefaultParts();
}

function switchMode(mode) {
  if (mode === 'setup') {
    $setupTab.attr('aria-selected', 'true');
    $runTab.attr('aria-selected', 'false');
    $setupPanel.removeClass('tk-panel--hidden');
    $runPanel.addClass('tk-panel--hidden');
  } else {
    $setupTab.attr('aria-selected', 'false');
    $runTab.attr('aria-selected', 'true');
    $setupPanel.addClass('tk-panel--hidden');
    $runPanel.removeClass('tk-panel--hidden');
  }
}

function renderSetupParts() {
  $partsList.empty();
  setupParts.forEach((part) => {
    const $card = $('<article>')
      .addClass('tk-part-card')
      .attr('data-part-id', part.id);

    const $nameField = $('<div>').addClass('tk-field');
    $nameField.append($('<label>').attr('for', `name-${part.id}`).text('パート名'));
    const $nameInput = $('<input>')
      .attr({ type: 'text', id: `name-${part.id}`, value: part.name })
      .on('input', (event) => {
        part.name = event.target.value;
        updateShareLink();
      });
    $nameField.append($nameInput);

    const $durationField = $('<div>').addClass('tk-field');
    $durationField.append(
      $('<label>').attr('for', `duration-${part.id}`).text('所要時間 (分)')
    );
    const $durationInput = $('<input>')
      .attr({
        type: 'number',
        min: 1,
        id: `duration-${part.id}`,
        value: part.durationMinutes
      })
      .on('input', (event) => {
        const raw = Number(event.target.value);
        part.durationMinutes = Number.isNaN(raw) ? 1 : Math.max(1, Math.round(raw));
        event.target.value = part.durationMinutes;
        updateShareLink();
      });
    $durationField.append($durationInput);

    const $actions = $('<div>').addClass('tk-part-card__actions');
    const $deleteBtn = $('<button>')
      .addClass('tk-button tk-button--secondary')
      .text('削除')
      .on('click', () => handleRemovePart(part.id));
    $actions.append($deleteBtn);

    $card.append($nameField, $durationField, $actions);
    $partsList.append($card);
  });

  if (!setupParts.length) {
    const $empty = $('<p>').text('パートがありません。追加してください。');
    $partsList.append($empty);
  }
}

function handleAddPart() {
  setupParts.push({
    id: generateId(),
    name: `新規パート ${setupParts.length + 1}`,
    durationMinutes: 5
  });
  renderSetupParts();
  updateShareLink();
}

function handleRemovePart(partId) {
  setupParts = setupParts.filter((part) => part.id !== partId);
  renderSetupParts();
  updateShareLink();
}

async function handleCopyLink() {
  const link = $shareLink.val();
  if (!link) {
    return;
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link);
      toast('リンクをコピーしました');
    } else {
      fallbackCopy(link);
      toast('リンクをコピーしました');
    }
  } catch (error) {
    console.error('コピーに失敗しました', error);
    toast('コピーに失敗しました');
  }
}

function fallbackCopy(text) {
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
}

let toastTimeout = null;
function toast(message) {
  clearTimeout(toastTimeout);
  const $existing = $('#tk-toast');
  if ($existing.length) {
    $existing.remove();
  }
  const $toast = $('<div>')
    .attr('id', 'tk-toast')
    .text(message)
    .css({
      position: 'fixed',
      bottom: '32px',
      right: '32px',
      background: 'rgba(0, 0, 0, 0.75)',
      color: '#ffffff',
      padding: '0.75rem 1.25rem',
      borderRadius: '999px',
      zIndex: 999,
      letterSpacing: '0.05em'
    });
  $('body').append($toast);
  toastTimeout = setTimeout(() => $toast.fadeOut(200, () => $toast.remove()), 2200);
}

function applyConfiguration() {
  const cleaned = sanitizeParts(setupParts);
  if (!cleaned.length) {
    toast('設定できるパートがありません');
    return;
  }
  setupParts = cleaned;
  timerCoordinator.setParts(partsToTimers(cleaned));
  runPartRefs.clear();
  renderSetupParts();
  renderRunParts();
  updateShareLink();
  updateRunUi();
  switchMode('run');
}

function renderRunParts() {
  $runPartsList.empty();
  const snapshots = timerCoordinator.getPartSnapshots(Date.now());
  if (!snapshots.length) {
    $runPartsList.append($('<p>').text('実行できるパートがありません。設定を見直してください。'));
    return;
  }
  snapshots.forEach((snapshot, index) => {
    const $card = $('<article>')
      .addClass('tk-run-part')
      .attr('data-part-id', snapshot.id);

    const $meta = $('<div>').addClass('tk-run-part__meta');
    $meta.append($('<h3>').text(`${index + 1}. ${snapshot.name}`));
    $meta.append($('<span>').addClass('tk-label').text(`予定 ${Math.round(snapshot.durationMs / 60000)} 分`));

    const $timers = $('<div>').addClass('tk-run-part__timers');
    const $elapsedLabel = $('<div>').html('経過 <span class="tk-timer">00:00</span>');
    const $remainingLabel = $('<div>').html('残り <span class="tk-timer">00:00</span>');

    const $elapsedValue = $elapsedLabel.find('span');
    const $remainingValue = $remainingLabel.find('span');
    $timers.append($elapsedLabel, $remainingLabel);

    const $progress = $('<div>').addClass('tk-progress');
    const $progressBar = $('<div>').addClass('tk-progress__bar');
    $progress.append($progressBar);

    const $actions = $('<div>').addClass('tk-run-part__actions');
    const $startBtn = $('<button>')
      .addClass('tk-button tk-button--primary')
      .text('開始')
      .on('click', () => {
        timerCoordinator.startPart(snapshot.id);
        updateRunUi();
      });
    $actions.append($startBtn);

    $card.append($meta, $timers, $progress, $actions);
    $runPartsList.append($card);

    runPartRefs.set(snapshot.id, {
      card: $card,
      elapsed: $elapsedValue,
      remaining: $remainingValue,
      progress: $progressBar,
      startBtn: $startBtn
    });
  });
}

function updateRunUi() {
  const now = Date.now();
  const snapshots = timerCoordinator.getPartSnapshots(now);
  const totals = timerCoordinator.getTotals(now);
  const current = timerCoordinator.getCurrentPart();
  const running = timerCoordinator.isRunning();

  snapshots.forEach((snapshot) => {
    const ref = runPartRefs.get(snapshot.id);
    if (!ref) {
      return;
    }

    ref.elapsed.text(formatDuration(snapshot.elapsedMs));
    ref.remaining.text(formatDuration(snapshot.remainingMs));

    const ratio = snapshot.durationMs
      ? Math.max(snapshot.elapsedMs / snapshot.durationMs, 0)
      : 0;
    const width = Math.min(100, ratio * 100);
    ref.progress.css('width', `${width}%`);

    ref.card.removeClass('tk-run-part--active tk-alert-warning tk-alert-danger');
    if (snapshot.status === 'active') {
      ref.card.addClass('tk-run-part--active');
    }

    if (snapshot.remainingMs <= 0) {
      ref.card.addClass('tk-alert-danger');
    } else if (snapshot.remainingMs <= WARNING_THRESHOLD_MS && snapshot.status !== 'pending') {
      ref.card.addClass('tk-alert-warning');
    }

    if (snapshot.status === 'active') {
      ref.startBtn.text('進行中');
      ref.startBtn.toggleClass('tk-button--secondary', true);
      ref.startBtn.toggleClass('tk-button--primary', false);
      ref.startBtn.prop('disabled', true);
    } else if (snapshot.status === 'paused') {
      ref.startBtn.text('再開');
      ref.startBtn.toggleClass('tk-button--secondary', false);
      ref.startBtn.toggleClass('tk-button--primary', true);
      ref.startBtn.prop('disabled', false);
    } else {
      ref.startBtn.text('開始');
      ref.startBtn.toggleClass('tk-button--secondary', false);
      ref.startBtn.toggleClass('tk-button--primary', true);
      ref.startBtn.prop('disabled', false);
    }
  });

  $totalElapsed.text(formatDuration(totals.elapsedMs));
  $totalRemaining.text(formatDuration(totals.remainingMs));
  const totalRatio = Math.min(100, totals.progress * 100);
  $totalProgress.css('width', `${totalRatio}%`);

  $runSummary.removeClass('tk-alert-warning tk-alert-danger');
  if (current) {
    if (totals.remainingMs <= 0) {
      $runSummary.addClass('tk-alert-danger');
    } else if (totals.remainingMs <= WARNING_THRESHOLD_MS) {
      $runSummary.addClass('tk-alert-warning');
    }
  }

  $stopBtn.prop('disabled', !current || !running);
  $resumeBtn.prop('disabled', !current || running);
}

function updateShareLink() {
  const sanitized = sanitizeParts(setupParts);
  const url = writeConfigToUrl(sanitized);
  $shareLink.val(url);
}

// expose for debugging/testing
window.Timekeeper = {
  getParts: () => setupParts,
  getSnapshots: () => timerCoordinator.getPartSnapshots(Date.now())
};

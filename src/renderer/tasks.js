// Renderer surface module. Loaded before app.js; functions are intentionally global for the browser shell.


async function loadTasks() {
  setBusy(els.refreshTasks, true);
  try {
    state.tasks = await service.invoke('task.list', { limit: 8 });
    renderTasks(state.tasks);
    if (state.selectedTaskId) {
      await loadTaskDetail(state.selectedTaskId);
    } else if (state.tasks[0]) {
      await loadTaskDetail(state.tasks[0].task_id);
    } else {
      renderTaskDetail(null);
    }
  } catch (error) {
    renderError(els.taskList, error);
  } finally {
    setBusy(els.refreshTasks, false);
  }
}

async function loadTaskDetail(taskId) {
  state.selectedTaskId = taskId;
  state.selectedTask = await service.invoke('task.get', { task_id: taskId });
  renderTasks(state.tasks);
  renderTaskDetail(state.selectedTask);
}

async function cancelSelectedTask() {
  if (!state.selectedTaskId) {
    return;
  }
  setBusy(els.cancelTask, true);
  try {
    state.selectedTask = await service.invoke('task.cancel', {
      task_id: state.selectedTaskId,
      reason: 'Cancelled from renderer task view',
      confirmation: 'confirm:task.cancel'
    });
    await loadTasks();
  } catch (error) {
    renderError(els.taskDetail, error);
  } finally {
    setBusy(els.cancelTask, false);
  }
}

function renderTasks(tasks) {
  els.taskList.innerHTML = '';
  if (!tasks?.length) {
    els.taskList.textContent = 'No backend tasks recorded.';
    return;
  }
  tasks.forEach((task) => {
    const item = document.createElement('button');
    item.className = `task-item ${task.status || 'unknown'}`;
    item.classList.toggle('active', task.task_id === state.selectedTaskId);
    item.type = 'button';
    item.innerHTML = [
      `<strong>${escapeHtml(task.type || task.task_id)}</strong>`,
      `<span>${escapeHtml(task.status || 'unknown')} - ${escapeHtml(task.classification || 'unknown')}</span>`,
      `<small>${escapeHtml(task.scope_key || 'unscoped')}</small>`
    ].join('');
    item.addEventListener('click', () => loadTaskDetail(task.task_id));
    els.taskList.appendChild(item);
  });
}

function renderTaskDetail(task) {
  if (!task) {
    renderRows(els.taskDetail, [['Task', 'No task selected.']]);
    els.taskProgress.textContent = 'No progress events.';
    els.taskOutput.textContent = 'Select a task to inspect details.';
    els.cancelTask.hidden = true;
    return;
  }

  renderRows(els.taskDetail, [
    ['Task ID', task.task_id],
    ['Type', task.type || 'unknown'],
    ['Status', task.status || 'unknown'],
    ['Classification', task.classification || 'unknown'],
    ['Scope', task.scope_key || 'unscoped'],
    ['Queued', task.queued_at || 'unknown'],
    ['Started', task.started_at || 'not started'],
    ['Finished', task.finished_at || 'not finished'],
    ['Cancel Requested', task.cancel_requested_at || 'no']
  ]);

  renderProgress(task.progress || []);
  renderTaskOutput(task);
  els.cancelTask.hidden = !isCancellable(task);
}

function renderProgress(progress) {
  els.taskProgress.innerHTML = '';
  if (!progress.length) {
    els.taskProgress.textContent = 'No progress events.';
    return;
  }
  progress.forEach((event) => {
    const row = document.createElement('div');
    row.className = 'timeline-row';
    const count = event.total ? ` (${event.current || 0}/${event.total})` : '';
    row.innerHTML = `<span>${escapeHtml(event.at || '')}</span><strong>${escapeHtml(event.stage || 'progress')}</strong><p>${escapeHtml((event.message || '') + count)}</p>`;
    els.taskProgress.appendChild(row);
  });
}

function renderTaskOutput(task) {
  const payload = {
    warnings: task.warnings || [],
    error: task.error || null,
    result: task.result || null,
    cancel_reason: task.cancel_reason || null
  };
  els.taskOutput.textContent = JSON.stringify(payload, null, 2);
}

function isCancellable(task) {
  return ['queued', 'running'].includes(task.status);
}

/**
 * Taskr — Task Manager
 * Features: CRUD, filter (all/active/completed), localStorage persistence,
 * XSS prevention via DOMPurify-style escaping, input validation.
 */

(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const STORAGE_KEY = 'taskr_tasks';

  let tasks = loadTasks();
  let filter = 'all';
  let editingId = null;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const taskInput   = document.getElementById('task-input');
  const addBtn      = document.getElementById('add-btn');
  const inputError  = document.getElementById('input-error');
  const taskList    = document.getElementById('task-list');
  const emptyState  = document.getElementById('empty-state');
  const emptyMsg    = document.getElementById('empty-msg');
  const listFooter  = document.getElementById('list-footer');
  const remaining   = document.getElementById('remaining');
  const clearBtn    = document.getElementById('clear-completed');
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const statCount   = document.getElementById('stat-count');
  const statDone    = document.getElementById('stat-done');

  // Modal
  const modalOverlay = document.getElementById('modal-overlay');
  const modalInput   = document.getElementById('modal-input');
  const modalError   = document.getElementById('modal-error');
  const modalCancel  = document.getElementById('modal-cancel');
  const modalSave    = document.getElementById('modal-save');

  // ── Persistence ────────────────────────────────────────────────────────────
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      // Validate shape
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        t => t && typeof t.id === 'string' &&
             typeof t.text === 'string' &&
             typeof t.completed === 'boolean' &&
             typeof t.createdAt === 'number'
      );
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Could not save tasks to localStorage:', e);
    }
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function genId() {
    return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * XSS prevention: escape HTML entities before inserting into DOM.
   * Used as a safety net; we primarily use textContent for user data.
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function sanitizeInput(str) {
    // Trim, collapse excessive whitespace
    return str.replace(/\s+/g, ' ').trim();
  }

  function validateTaskText(text) {
    const cleaned = sanitizeInput(text);
    if (!cleaned) return { valid: false, msg: 'Task cannot be empty.' };
    if (cleaned.length > 200) return { valid: false, msg: 'Task must be 200 characters or fewer.' };
    return { valid: true, text: cleaned };
  }

  function showError(el, msg) {
    el.textContent = msg;
  }

  function clearError(el) {
    el.textContent = '';
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  function addTask(text) {
    const validation = validateTaskText(text);
    if (!validation.valid) {
      showError(inputError, validation.msg);
      return false;
    }
    clearError(inputError);
    const task = {
      id: genId(),
      text: validation.text,
      completed: false,
      createdAt: Date.now(),
    };
    tasks.unshift(task);
    saveTasks();
    return true;
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
  }

  function updateTask(id, newText) {
    const validation = validateTaskText(newText);
    if (!validation.valid) {
      showError(modalError, validation.msg);
      return false;
    }
    clearError(modalError);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.text = validation.text;
      saveTasks();
    }
    return true;
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  function getFilteredTasks() {
    switch (filter) {
      case 'active':    return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default:          return tasks;
    }
  }

  function render() {
    const filtered = getFilteredTasks();
    const activeCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;

    // Update header stats
    statCount.textContent = `${totalCount} task${totalCount !== 1 ? 's' : ''}`;
    statDone.textContent = `${completedCount} done`;

    // Clear list
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.hidden = false;
      listFooter.hidden = true;
      if (filter === 'active' && totalCount > 0) {
        emptyMsg.textContent = 'No active tasks — all done! 🎉';
      } else if (filter === 'completed' && totalCount > 0) {
        emptyMsg.textContent = 'No completed tasks yet.';
      } else {
        emptyMsg.textContent = 'Nothing here yet. Add your first task above.';
      }
    } else {
      emptyState.hidden = true;
      listFooter.hidden = false;

      filtered.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item${task.completed ? ' completed' : ''}`;
        item.setAttribute('role', 'listitem');
        item.dataset.id = task.id;

        // Checkbox
        const check = document.createElement('button');
        check.className = `task-check${task.completed ? ' checked' : ''}`;
        check.setAttribute('aria-label', task.completed ? 'Mark as active' : 'Mark as complete');
        check.setAttribute('aria-pressed', String(task.completed));

        // Text — use textContent to prevent XSS
        const textEl = document.createElement('span');
        textEl.className = 'task-text';
        textEl.textContent = task.text; // Safe: textContent does NOT parse HTML

        // Actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit';
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.textContent = '✎';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.textContent = '✕';

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        item.appendChild(check);
        item.appendChild(textEl);
        item.appendChild(actions);
        taskList.appendChild(item);

        // Events
        check.addEventListener('click', () => {
          toggleTask(task.id);
          render();
        });

        editBtn.addEventListener('click', () => openEditModal(task.id, task.text));

        deleteBtn.addEventListener('click', () => {
          // Animate out
          item.style.transition = 'all 0.18s ease';
          item.style.opacity = '0';
          item.style.transform = 'translateX(16px)';
          setTimeout(() => {
            deleteTask(task.id);
            render();
          }, 160);
        });
      });
    }

    // Footer
    remaining.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    clearBtn.style.display = completedCount > 0 ? '' : 'none';
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      render();
    });
  });

  // ── Add Task ───────────────────────────────────────────────────────────────
  addBtn.addEventListener('click', () => {
    if (addTask(taskInput.value)) {
      taskInput.value = '';
      render();
    }
  });

  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (addTask(taskInput.value)) {
        taskInput.value = '';
        render();
      }
    }
  });

  taskInput.addEventListener('input', () => {
    clearError(inputError);
  });

  // ── Clear Completed ────────────────────────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    clearCompleted();
    render();
  });

  // ── Edit Modal ─────────────────────────────────────────────────────────────
  function openEditModal(id, text) {
    editingId = id;
    modalInput.value = text;
    clearError(modalError);
    modalOverlay.hidden = false;
    modalInput.focus();
    modalInput.select();
  }

  function closeEditModal() {
    modalOverlay.hidden = true;
    editingId = null;
    clearError(modalError);
  }

  modalSave.addEventListener('click', () => {
    if (editingId && updateTask(editingId, modalInput.value)) {
      closeEditModal();
      render();
    }
  });

  modalCancel.addEventListener('click', closeEditModal);

  modalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (editingId && updateTask(editingId, modalInput.value)) {
        closeEditModal();
        render();
      }
    }
    if (e.key === 'Escape') closeEditModal();
  });

  modalInput.addEventListener('input', () => clearError(modalError));

  // Close modal on overlay click
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeEditModal();
  });

  // Trap focus inside modal when open (accessibility)
  modalOverlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeEditModal();
    if (e.key === 'Tab') {
      const focusable = modalOverlay.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  render();
})();

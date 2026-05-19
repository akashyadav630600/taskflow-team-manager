document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('token')) { window.location.href = '/'; return; }

    // ─── State ───────────────────────────────────────────────
    let currentUser   = null;
    let statusChart   = null;
    let userChart     = null;
    let allProjects   = [];
    let allUsers      = [];
    let activeMemberProjectId = null;

    // ─── DOM refs ────────────────────────────────────────────
    const views     = document.querySelectorAll('.view-section');
    const navLinks  = document.querySelectorAll('.sidebar nav a');
    const pageTitle = document.getElementById('page-title');
    const userNameEl  = document.getElementById('user-name');
    const userAvatarEl = document.getElementById('user-avatar');

    // ─── Toast ───────────────────────────────────────────────
    function toast(msg, type = 'info') {
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span>${icons[type]}</span> ${msg}`;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => el.remove(), 3200);
    }

    // ─── Button loading ───────────────────────────────────────
    function setLoading(btn, loading, label) {
        btn.disabled = loading;
        btn.innerHTML = loading ? '<div class="spinner"></div> Working…' : label;
    }

    // ─── Initials helper ────────────────────────────────────
    function initials(name) {
        return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    // ─── Init App ─────────────────────────────────────────────
    try {
        [currentUser, allUsers] = await Promise.all([API.auth.getMe(), API.auth.getAllUsers()]);
        userNameEl.textContent   = currentUser.name;
        userAvatarEl.textContent = initials(currentUser.name);
        loadDashboard();
    } catch (err) {
        console.error('Init error:', err);
        toast('Session expired. Please log in again.', 'error');
        setTimeout(() => { localStorage.removeItem('token'); window.location.href = '/'; }, 2000);
    }

    // ─── Navigation ──────────────────────────────────────────
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetView = link.id.replace('nav-', 'view-');
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            views.forEach(v => v.classList.remove('active'));
            document.getElementById(targetView).classList.add('active');
            pageTitle.textContent = link.textContent.trim();
            if (targetView === 'view-dashboard') loadDashboard();
            if (targetView === 'view-projects')  loadProjects();
            if (targetView === 'view-tasks')      loadTasks();
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    });

    // ─── Dashboard ───────────────────────────────────────────
    async function loadDashboard() {
        try {
            const stats = await API.dashboard.getStats();
            document.getElementById('stat-total').textContent   = stats.total_tasks;
            document.getElementById('stat-overdue').textContent = stats.overdue_tasks;
            renderCharts(stats);
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    function renderCharts(stats) {
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        const userCtx   = document.getElementById('userChart').getContext('2d');
        if (statusChart) statusChart.destroy();
        if (userChart)   userChart.destroy();

        const chartDefaults = {
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Outfit' } } } }
        };

        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: stats.tasks_by_status.map(s => s.status),
                datasets: [{ data: stats.tasks_by_status.map(s => s.count), backgroundColor: ['#6366f1','#10b981','#f59e0b'], borderWidth: 0 }]
            },
            options: { ...chartDefaults, cutout: '68%' }
        });

        userChart = new Chart(userCtx, {
            type: 'bar',
            data: {
                labels: stats.tasks_per_user.map(u => u.user),
                datasets: [{ label: 'Tasks', data: stats.tasks_per_user.map(u => u.count), backgroundColor: '#6366f1', borderRadius: 6 }]
            },
            options: {
                ...chartDefaults,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { ticks: { color: '#64748b' }, grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // ─── Projects ────────────────────────────────────────────
    async function loadProjects() {
        const list = document.getElementById('projects-list');
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Loading projects…</p></div>';
        try {
            allProjects = await API.projects.getAll();
            list.innerHTML = '';
            if (!allProjects.length) {
                list.innerHTML = '<div class="empty-state"><div class="empty-icon">📁</div><p>No projects yet. Create your first one!</p></div>';
                return;
            }
            allProjects.forEach(p => list.appendChild(buildProjectCard(p)));
        } catch (err) {
            list.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">${err.message}</p></div>`;
        }
    }

    function buildProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        const created = new Date(project.created_at).toLocaleDateString();
        card.innerHTML = `
            <h3>${escHtml(project.name)}</h3>
            <p>${escHtml(project.description || 'No description provided.')}</p>
            <div class="project-card-footer">
                <span class="project-meta">Created ${created}</span>
                <div class="project-actions">
                    <button class="btn btn-sm btn-secondary btn-member" data-id="${project.id}">👥 Members</button>
                    <button class="btn btn-danger btn-del-project" data-id="${project.id}">Delete</button>
                </div>
            </div>`;

        card.addEventListener('click', e => {
            if (e.target.closest('button')) return; // let buttons handle themselves
            document.getElementById('nav-tasks').click();
            document.getElementById('project-filter').value = project.id;
            loadTasks();
        });

        card.querySelector('.btn-member').addEventListener('click', e => {
            e.stopPropagation();
            openMemberModal(project.id);
        });

        card.querySelector('.btn-del-project').addEventListener('click', async e => {
            e.stopPropagation();
            if (!confirm(`Delete project "${project.name}"? This will also delete all tasks.`)) return;
            try {
                await API.projects.delete(project.id);
                toast(`Project "${project.name}" deleted.`, 'success');
                loadProjects();
            } catch (err) { toast(err.message, 'error'); }
        });

        return card;
    }

    document.getElementById('btn-new-project').onclick = () => openModal('modal-project');

    document.getElementById('form-project').onsubmit = async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-create-project');
        setLoading(btn, true, 'Create Project');
        try {
            await API.projects.create({
                name: document.getElementById('proj-name').value,
                description: document.getElementById('proj-desc').value
            });
            closeModal('modal-project');
            document.getElementById('form-project').reset();
            toast('Project created!', 'success');
            loadProjects();
        } catch (err) { toast(err.message, 'error'); }
        setLoading(btn, false, 'Create Project');
    };

    // ─── Members modal ───────────────────────────────────────
    async function openMemberModal(projectId) {
        activeMemberProjectId = projectId;
        openModal('modal-member');
        const chipsEl  = document.getElementById('current-members');
        const selectEl = document.getElementById('member-select');
        chipsEl.innerHTML  = '<span style="color:var(--text-muted);font-size:0.85rem">Loading…</span>';
        selectEl.innerHTML = '<option value="">— Select user —</option>';

        try {
            const members = await API.projects.getMembers(projectId);
            const memberIds = members.map(m => m.user_id);

            chipsEl.innerHTML = '';
            members.forEach(m => {
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.innerHTML = `<div class="chip-avatar">${initials(m.user.name)}</div>${escHtml(m.user.name)} <small style="color:var(--text-muted)">(${m.role})</small>`;
                chipsEl.appendChild(chip);
            });
            if (!members.length) chipsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem">No members yet.</span>';

            // Populate non-member users
            allUsers.filter(u => !memberIds.includes(u.id)).forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.name} (${u.email})`;
                selectEl.appendChild(opt);
            });
        } catch (err) { toast(err.message, 'error'); }
    }

    document.getElementById('btn-add-member').onclick = async () => {
        const userId = parseInt(document.getElementById('member-select').value);
        const role   = document.getElementById('member-role').value;
        if (!userId) { toast('Please select a user.', 'error'); return; }
        const btn = document.getElementById('btn-add-member');
        setLoading(btn, true, 'Add Member');
        try {
            await API.projects.addMember(activeMemberProjectId, { user_id: userId, role });
            toast('Member added!', 'success');
            openMemberModal(activeMemberProjectId);
        } catch (err) { toast(err.message, 'error'); }
        setLoading(btn, false, 'Add Member');
    };

    // ─── Tasks ───────────────────────────────────────────────
    const projectFilter = document.getElementById('project-filter');
    const newTaskBtn    = document.getElementById('btn-new-task');

    async function loadTasks() {
        const projectId = projectFilter.value;

        // Populate the filter dropdown if needed
        if (!allProjects.length) allProjects = await API.projects.getAll();
        const current = projectFilter.value;
        projectFilter.innerHTML = '<option value="">— Select Project —</option>';
        allProjects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            projectFilter.appendChild(opt);
        });
        projectFilter.value = current;

        if (!projectFilter.value) { newTaskBtn.disabled = true; return; }

        newTaskBtn.disabled = false;
        try {
            const tasks = await API.tasks.getByProject(projectFilter.value);
            renderTaskBoard(tasks);
            // Populate assignee dropdown with project members
            const members = await API.projects.getMembers(projectFilter.value);
            const assigneeEl = document.getElementById('task-assignee');
            assigneeEl.innerHTML = '<option value="">— Unassigned —</option>';
            members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.user_id;
                opt.textContent = m.user.name;
                assigneeEl.appendChild(opt);
            });
        } catch (err) {
            console.error('Task load error:', err);
            toast(err.message, 'error');
        }
    }

    projectFilter.onchange = loadTasks;

    function renderTaskBoard(tasks) {
        const cols = {
            'To Do':       { el: document.getElementById('col-todo').querySelector('.task-list'),       count: document.getElementById('count-todo') },
            'In Progress': { el: document.getElementById('col-inprogress').querySelector('.task-list'), count: document.getElementById('count-inprogress') },
            'Done':        { el: document.getElementById('col-done').querySelector('.task-list'),       count: document.getElementById('count-done') }
        };

        Object.values(cols).forEach(c => { c.el.innerHTML = ''; c.count.textContent = 0; });

        const grouped = { 'To Do': [], 'In Progress': [], 'Done': [] };
        tasks.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });

        Object.entries(grouped).forEach(([status, list]) => {
            if (!cols[status]) return;
            cols[status].count.textContent = list.length;
            if (!list.length) {
                cols[status].el.innerHTML = '<div class="empty-state" style="padding:1.5rem 0"><div class="empty-icon" style="font-size:1.5rem">📭</div><p>No tasks</p></div>';
                return;
            }
            list.forEach(task => cols[status].el.appendChild(buildTaskCard(task)));
        });
    }

    function buildTaskCard(task) {
        const card = document.createElement('div');
        const prio = (task.priority || 'medium').toLowerCase();
        card.className = `task-card priority-${prio}`;

        const badgeClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
        const dueStr = task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : 'No due date';
        const assigneeName = task.assignee ? escHtml(task.assignee.name) : 'Unassigned';

        card.innerHTML = `
            <h4>${escHtml(task.title)}</h4>
            ${task.description ? `<p>${escHtml(task.description)}</p>` : ''}
            <div class="task-meta">
                <span>👤 ${assigneeName}</span>
                <span>📅 ${dueStr}</span>
            </div>
            <div class="task-footer">
                <select class="status-select" data-id="${task.id}">
                    <option value="To Do"       ${task.status === 'To Do'       ? 'selected' : ''}>To Do</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Done"        ${task.status === 'Done'        ? 'selected' : ''}>Done</option>
                </select>
                <span class="priority-badge ${badgeClass[prio]}">${task.priority}</span>
                <button class="btn btn-danger btn-del-task" data-id="${task.id}" title="Delete task">🗑</button>
            </div>`;

        card.querySelector('.status-select').onchange = async e => {
            try {
                await API.tasks.update(task.id, { status: e.target.value });
                toast('Status updated!', 'success');
                loadTasks();
            } catch (err) { toast(err.message, 'error'); }
        };

        card.querySelector('.btn-del-task').onclick = async () => {
            if (!confirm(`Delete task "${task.title}"?`)) return;
            try {
                await API.tasks.delete(task.id);
                toast('Task deleted.', 'success');
                loadTasks();
            } catch (err) { toast(err.message, 'error'); }
        };

        return card;
    }

    newTaskBtn.onclick = () => openModal('modal-task');

    document.getElementById('form-task').onsubmit = async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-create-task');
        setLoading(btn, true, 'Create Task');
        const assigneeVal = document.getElementById('task-assignee').value;
        const data = {
            title:       document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value || null,
            due_date:    document.getElementById('task-due').value   || null,
            priority:    document.getElementById('task-priority').value,
            project_id:  parseInt(projectFilter.value),
            assigned_to: assigneeVal ? parseInt(assigneeVal) : null
        };
        try {
            await API.tasks.create(data);
            closeModal('modal-task');
            document.getElementById('form-task').reset();
            toast('Task created!', 'success');
            loadTasks();
        } catch (err) { toast(err.message, 'error'); }
        setLoading(btn, false, 'Create Task');
    };

    // ─── Modal helpers ───────────────────────────────────────
    function openModal(id)  { document.getElementById(id).classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => closeModal(btn.dataset.modal);
    });

    window.addEventListener('click', e => {
        document.querySelectorAll('.modal.active').forEach(m => {
            if (e.target === m) closeModal(m.id);
        });
    });

    // ─── Utility ─────────────────────────────────────────────
    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
});

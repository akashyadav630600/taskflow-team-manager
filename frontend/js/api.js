const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(endpoint, { ...options, headers });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        if (response.status === 204) return null;

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    },

    auth: {
        async getMe()       { return API.request('/auth/me'); },
        async getAllUsers()  { return API.request('/auth/users'); }
    },

    projects: {
        async getAll()              { return API.request('/projects/'); },
        async create(data)          { return API.request('/projects/', { method: 'POST', body: JSON.stringify(data) }); },
        async delete(id)            { return API.request(`/projects/${id}`, { method: 'DELETE' }); },
        async getMembers(id)        { return API.request(`/projects/${id}/members`); },
        async addMember(id, data)   { return API.request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }); }
    },

    tasks: {
        async getByProject(projectId) { return API.request(`/tasks/project/${projectId}`); },
        async create(data)            { return API.request('/tasks/', { method: 'POST', body: JSON.stringify(data) }); },
        async update(id, data)        { return API.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
        async delete(id)              { return API.request(`/tasks/${id}`, { method: 'DELETE' }); }
    },

    dashboard: {
        async getStats() { return API.request('/dashboard/'); }
    }
};

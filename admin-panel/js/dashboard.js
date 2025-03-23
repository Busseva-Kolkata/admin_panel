document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard();
    loadBuses();
    setupEventListeners();
});

// Initialize dashboard components
function initializeDashboard() {
    // Set admin name
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    document.getElementById('adminName').textContent = adminData.name || 'Admin';

    // Setup sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // Handle navigation here
        });
    });
}

// Load buses from API
async function loadBuses() {
    const tableBody = document.getElementById('busesTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';

    try {
        const response = await fetch('YOUR_BACKEND_URL/api/buses', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load buses');

        const buses = await response.json();
        renderBuses(buses);
    } catch (error) {
        showToast(error.message, 'error');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load buses</td></tr>';
    }
}

// Render buses in table
function renderBuses(buses) {
    const tableBody = document.getElementById('busesTableBody');
    tableBody.innerHTML = '';

    buses.forEach(bus => {
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full" src="${bus.imageUrl}" alt="${bus.name}">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${bus.name}</div>
                        <div class="text-sm text-gray-500">${bus.route}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${bus.route}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${bus.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${bus.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="action-btn edit mr-2" onclick="editBus('${bus._id}')">
                    <i class="fas fa-edit mr-1"></i> Edit
                </button>
                <button class="action-btn delete" onclick="deleteBus('${bus._id}')">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add Bus Button
    document.getElementById('addBusBtn').addEventListener('click', () => {
        showBusModal();
    });

    // Search functionality
    document.getElementById('searchBus').addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#busesTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }, 300));

    // Filter functionality
    document.getElementById('filterBus').addEventListener('change', (e) => {
        const filterValue = e.target.value;
        const rows = document.querySelectorAll('#busesTableBody tr');
        
        rows.forEach(row => {
            const status = row.querySelector('.status-badge').textContent.trim();
            row.style.display = !filterValue || status === filterValue ? '' : 'none';
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = 'index.html';
    });

    // Bus Form
    document.getElementById('busForm').addEventListener('submit', handleBusSubmit);
    document.getElementById('cancelBtn').addEventListener('click', hideBusModal);
}

// Bus Modal Functions
function showBusModal(busData = null) {
    const modal = document.getElementById('busModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('busForm');

    modalTitle.textContent = busData ? 'Edit Bus' : 'Add New Bus';
    form.reset();
    
    if (busData) {
        form.busName.value = busData.name;
        form.route.value = busData.route;
        form.stops.value = busData.stops.join(', ');
    }

    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
}

function hideBusModal() {
    const modal = document.getElementById('busModal');
    modal.classList.remove('modal-enter');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Handle bus form submission
async function handleBusSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('YOUR_BACKEND_URL/api/buses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to save bus');

        showToast('Bus saved successfully!', 'success');
        hideBusModal();
        loadBuses();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Bus CRUD Operations
async function editBus(busId) {
    try {
        const response = await fetch(`YOUR_BACKEND_URL/api/buses/${busId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load bus details');

        const busData = await response.json();
        showBusModal(busData);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function deleteBus(busId) {
    if (!confirm('Are you sure you want to delete this bus?')) return;

    try {
        const response = await fetch(`YOUR_BACKEND_URL/api/buses/${busId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete bus');

        showToast('Bus deleted successfully!', 'success');
        loadBuses();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 
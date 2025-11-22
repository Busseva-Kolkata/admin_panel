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
    setupMobileMenu();
});

// Setup mobile menu functionality
function setupMobileMenu() {
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileMenuOverlay');
    
    menuToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
        document.body.classList.add('sidebar-open');
    });
    
    closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    overlay.addEventListener('click', closeMobileSidebar);
    
    function closeMobileSidebar() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        overlay.classList.add('hidden');
        document.body.classList.remove('sidebar-open');
    }
    
    // Close sidebar when clicking on a navigation link on mobile
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeMobileSidebar();
            }
        });
    });
}

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
        const response = await fetch('https://busseva-backend-yhzz.onrender.com/api/buses', {
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
    const cardsContainer = document.getElementById('busesCardsContainer');
    tableBody.innerHTML = '';
    cardsContainer.innerHTML = '';

    if (buses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No buses found</td></tr>';
        cardsContainer.innerHTML = '<div class="text-center py-8 text-gray-500">No buses found</div>';
        return;
    }

    buses.forEach(bus => {
        // Render table row for desktop
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.setAttribute('data-bus-name', bus.name?.toLowerCase() || '');
        row.setAttribute('data-bus-status', bus.status || 'inactive');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full object-cover" src="${bus.imageUrl || 'https://via.placeholder.com/40'}" alt="${bus.name || 'Bus'}" onerror="this.src='https://via.placeholder.com/40'">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${bus.name || 'Unknown'}</div>
                        <div class="text-sm text-gray-500">${bus.route || 'No route'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${bus.route || 'No route'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${bus.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${bus.status || 'inactive'}
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
        
        // Render card for mobile
        const card = document.createElement('div');
        card.className = 'bus-card bg-white rounded-lg shadow-md p-4';
        card.setAttribute('data-bus-name', bus.name?.toLowerCase() || '');
        card.setAttribute('data-bus-status', bus.status || 'inactive');
        card.innerHTML = `
            <div class="bus-card-header">
                <img class="bus-card-image" src="${bus.imageUrl || 'https://via.placeholder.com/48'}" alt="${bus.name || 'Bus'}" onerror="this.src='https://via.placeholder.com/48'">
                <div class="bus-card-info">
                    <div class="bus-card-name">${bus.name || 'Unknown'}</div>
                    <div class="bus-card-route">${bus.route || 'No route'}</div>
                </div>
                <span class="status-badge ${bus.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${bus.status || 'inactive'}
                </span>
            </div>
            <div class="bus-card-actions">
                <button class="action-btn edit flex-1 bg-yellow-50 text-yellow-800 hover:bg-yellow-100" onclick="editBus('${bus._id}')">
                    <i class="fas fa-edit mr-1"></i> Edit
                </button>
                <button class="action-btn delete flex-1 bg-red-50 text-red-800 hover:bg-red-100" onclick="deleteBus('${bus._id}')">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
            </div>
        `;
        cardsContainer.appendChild(card);
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
        const tableRows = document.querySelectorAll('#busesTableBody tr');
        const cards = document.querySelectorAll('#busesCardsContainer .bus-card');
        
        tableRows.forEach(row => {
            const busName = row.getAttribute('data-bus-name') || '';
            const text = row.textContent.toLowerCase();
            row.style.display = (busName.includes(searchTerm) || text.includes(searchTerm)) ? '' : 'none';
        });
        
        cards.forEach(card => {
            const busName = card.getAttribute('data-bus-name') || '';
            const text = card.textContent.toLowerCase();
            card.style.display = (busName.includes(searchTerm) || text.includes(searchTerm)) ? '' : 'none';
        });
    }, 300));

    // Filter functionality
    document.getElementById('filterBus').addEventListener('change', (e) => {
        const filterValue = e.target.value;
        const tableRows = document.querySelectorAll('#busesTableBody tr');
        const cards = document.querySelectorAll('#busesCardsContainer .bus-card');
        
        tableRows.forEach(row => {
            const status = row.getAttribute('data-bus-status') || '';
            row.style.display = (!filterValue || status === filterValue) ? '' : 'none';
        });
        
        cards.forEach(card => {
            const status = card.getAttribute('data-bus-status') || '';
            card.style.display = (!filterValue || status === filterValue) ? '' : 'none';
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
        const response = await fetch('https://busseva-backend-yhzz.onrender.com/api/buses', {
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
        const response = await fetch(`https://busseva-backend-yhzz.onrender.com/api/buses/${busId}`, {
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

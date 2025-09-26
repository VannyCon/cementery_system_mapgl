
// Records Management (Admin)

let records = [];
let recordMeta = { page: 1, size: 12, total: 0, totalPages: 1, search: '' };
let deleteId = null;

const authManager = new AuthManager();
const recordsAPI = authManager.API_CONFIG.baseURL + 'records.php';

// Load records when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    const searchInput = document.getElementById('recordSearch');
    const pageSizeSelect = document.getElementById('recordPageSize');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                recordMeta.search = searchInput.value.trim();
                recordMeta.page = 1;
                renderRecordsFromCache();
            }, 300);
        });
    }
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            recordMeta.size = parseInt(pageSizeSelect.value, 10) || 12;
            recordMeta.page = 1;
            renderRecordsFromCache();
        });
    }
});

async function loadRecords() {
    try {
        const params = new URLSearchParams({ action: 'getAllRecords', page: String(recordMeta.page), size: String(recordMeta.size) });
        if (recordMeta.search) params.set('search', recordMeta.search);
        const response = await axios.get(`${recordsAPI}?${params.toString()}`, {
            headers: authManager.API_CONFIG.getHeaders()
        });
        if (response.data && response.data.success) {
            records = Array.isArray(response.data.data) ? response.data.data : [];
            // Server does not return meta; compute client-side
            recordMeta.total = records.length;
            recordMeta.totalPages = Math.max(1, Math.ceil(recordMeta.total / recordMeta.size));
            renderRecordsFromCache();
        } else {
            const message = (response.data && response.data.message) ? response.data.message : 'Unknown error';
            showAlert && showAlert('Error loading records: ' + message, 'danger');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Failed to load records');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

function getFilteredRecords() {
    if (!recordMeta.search) return records;
    const q = recordMeta.search.toLowerCase();
    return records.filter(r => {
        const name = (r.name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
    });
}

function renderRecordsFromCache() {
    const filtered = getFilteredRecords();
    recordMeta.total = filtered.length;
    recordMeta.totalPages = Math.max(1, Math.ceil(recordMeta.total / recordMeta.size));
    const start = (recordMeta.page - 1) * recordMeta.size;
    const pageItems = filtered.slice(start, start + recordMeta.size);
    displayRecords(pageItems);
    updateRecordCount();
    renderRecordPagination();
}

function displayRecords(list) {
    const tbody = document.querySelector('#recordTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="9" class="text-center text-muted">No records found</td>';
        tbody.appendChild(emptyRow);
        return;
    }
    list.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.grave_number || ''}</td>
            <td>${record.deceased_name || ''}</td>
            <td>${record.date_of_birth || ''}</td>
            <td>${record.date_of_death || ''}</td>
            <td>${record.burial_date || ''}</td>
            <td>${record.next_of_kin || ''}</td>
            <td>${record.contact_info || ''}</td>
            <td>${record.notes || ''}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewRecord(${record.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                 <button class="btn btn-sm btn-primary mx-1" onclick="editRecord(${record.id})" title="Edit">
                    <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRecord(${record.id})" title="Delete">
                    <i class="bx bx-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateRecordCount() {
    const el = document.getElementById('recordCount');
    if (!el) return;
    const start = (recordMeta.page - 1) * recordMeta.size + 1;
    const end = Math.min(recordMeta.page * recordMeta.size, recordMeta.total);
    const shown = recordMeta.total === 0 ? 0 : (end - start + 1);
    el.textContent = `Showing ${shown} of ${recordMeta.total} records (Page ${recordMeta.page}/${recordMeta.totalPages})`;
}

function renderRecordPagination() {
    // HTML uses categoryPagination id; align with it
    const container = document.getElementById('categoryPagination');
    if (!container) return;
    const page = recordMeta.page || 1;
    const totalPages = recordMeta.totalPages || 1;
    container.innerHTML = '';
    const createItem = (label, disabled, active, targetPage) => {
        const li = document.createElement('li');
        li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        const a = document.createElement(active ? 'span' : 'a');
        a.className = 'page-link';
        a.textContent = label;
        if (!active && !disabled) {
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                recordMeta.page = targetPage;
                renderRecordsFromCache();
            });
        }
        li.appendChild(a);
        return li;
    };
    container.appendChild(createItem('Previous', page <= 1, false, Math.max(1, page - 1)));
    const maxToShow = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxToShow - 1);
    if (end - start + 1 < maxToShow) start = Math.max(1, end - maxToShow + 1);
    for (let i = start; i <= end; i++) {
        container.appendChild(createItem(String(i), false, i === page, i));
    }
    if (end < totalPages) {
        const dots = document.createElement('li');
        dots.className = 'page-item disabled';
        const span = document.createElement('span');
        span.className = 'page-link';
        span.textContent = '...';
        dots.appendChild(span);
        container.appendChild(dots);
        container.appendChild(createItem(String(totalPages), false, false, totalPages));
    }
    container.appendChild(createItem('Next', page >= totalPages, false, Math.min(totalPages, page + 1)));
}

function openAddModal() {
    document.getElementById('recordModalLabel').textContent = 'Add Record';
    document.getElementById('recordForm').reset();
    document.getElementById('recordId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function viewRecord(id) {
    const record = records.find(r => String(r.id) === String(id));
    if (!record) { CustomToast && CustomToast.error('Error', 'Record not found'); return; }
    document.getElementById('viewGraveNumber').textContent = record.grave_number || '';
    document.getElementById('viewDeceasedName').textContent = record.deceased_name || '';
    document.getElementById('viewDateOfBirth').textContent = window.Utils.formatDate(record.date_of_birth);
    document.getElementById('viewDateOfDeath').textContent = window.Utils.formatDate(record.date_of_death);
    document.getElementById('viewBurialDate').textContent = window.Utils.formatDate(record.burial_date);
    document.getElementById('viewNextOfKin').textContent = record.next_of_kin || '';
    document.getElementById('viewContactInfo').textContent = record.contact_info || '';
    document.getElementById('viewNotes').textContent = record.notes || '';
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
}

function editRecord(id) {
    const record = records.find(r => String(r.id) === String(id));
    if (!record) { CustomToast?.error('Error', 'Record not found'); return; }
    document.getElementById('graveNumber').value = record.grave_number || '';
    document.getElementById('deceasedName').value = record.deceased_name || '';
    document.getElementById('dateOfBirth').value = record.date_of_birth || '';
    document.getElementById('dateOfDeath').value = record.date_of_death || '';
    document.getElementById('burialDate').value = record.burial_date || '';
    document.getElementById('nextOfKin').value = record.next_of_kin || '';
    document.getElementById('contactInfo').value = record.contact_info || '';
    document.getElementById('notes').value = record.notes || '';
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function deleteRecord(id) {
    deleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        const formData = new FormData();
        formData.append('action', 'deleteBurialRecord');
        formData.append('id', deleteId);
        const response = await axios.post(`${recordsAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            CustomToast && CustomToast.success('Success', result.message || 'Deleted');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            await loadRecords();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Delete failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Delete failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

// Handle form submission
document.getElementById('recordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
        const formData = new FormData(this);
        const recordId = document.getElementById('recordId').value;
        if (recordId) {
            formData.append('action', 'updateBurialRecord');
            formData.append('id', recordId);
        } else {
            formData.append('action', 'createBurialRecord');
        }
        const response = await axios.post(`${recordsAPI}`, formData, {
            headers: authManager.API_CONFIG.getFormHeaders()
        });
        const result = response.data;
        if (result && result.success) {
            await loadRecords();
            CustomToast && CustomToast.success('Success', result.message || 'Saved');
            bootstrap.Modal.getInstance(document.getElementById('recordModal')).hide();
        } else {
            CustomToast && CustomToast.error('Error', (result && result.message) || 'Save failed');
        }
    } catch (err) {
        CustomToast && CustomToast.error('Error', 'Save failed');
        // eslint-disable-next-line no-console
        console.error(err);
    }
});

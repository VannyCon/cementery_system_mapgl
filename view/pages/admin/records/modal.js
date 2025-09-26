// Modal Management System for Cemetery Management
class ModalManager {
    constructor(cemeteryManager) {
        this.cemeteryManager = cemeteryManager;
        this.currentModal = null;
        this.currentFeature = null;
        this.pendingCoordinates = null;
        
        this.initializeModalHandlers();
    }

    // Initialize all modal event handlers
    initializeModalHandlers() {
        this.setupGraveModalHandlers();
        
        // Generic modal handlers
        this.setupGenericModalHandlers();
    }


    // Annotation Modal Management
    showGraveModal(feature = null) {
        this.currentModal = 'grave';
        this.currentFeature = feature;
        
        // If feature provided, populate form
        if (feature && feature.geometry && feature.geometry.type === 'Polygon') {
            const coordinates = feature.geometry.coordinates;
            
            // Convert coordinates from [lng, lat] to [lat, lng] for database storage
            const convertedCoordinates = coordinates[0].map(coord => [coord[1], coord[0]]);
            
            // Set coordinates in hidden input
            const graveCoordinatesInput = document.getElementById('graveCoordinates');
            if (graveCoordinatesInput) {
                graveCoordinatesInput.value = JSON.stringify(convertedCoordinates);
            }
            
            // Convert to WKT format for geometry field
            const wkt = `POLYGON((${convertedCoordinates.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
            const graveGeometryInput = document.getElementById('graveGeometry');
            if (graveGeometryInput) {
                graveGeometryInput.value = wkt;
            }
            
            // If feature has properties, populate them
            if (feature.properties) {
                const titleInput = document.getElementById('graveTitle');
                const descriptionInput = document.getElementById('graveDescription');
                const typeInput = document.getElementById('graveType');
                
                if (titleInput && feature.properties.title) titleInput.value = feature.properties.title;
                if (descriptionInput && feature.properties.description) descriptionInput.value = feature.properties.description;
                if (typeInput && feature.properties.type) typeInput.value = feature.properties.type;
            }
        } else if (this.cemeteryManager && this.cemeteryManager.pendingPolygonCoords) {
            // Use pending coordinates
            const graveCoordinatesInput = document.getElementById('graveCoordinates');
            if (graveCoordinatesInput) {
                graveCoordinatesInput.value = JSON.stringify(this.cemeteryManager.pendingPolygonCoords);
            }
            
            // Convert to WKT format for geometry field
            const wkt = `POLYGON((${this.cemeteryManager.pendingPolygonCoords.map(coord => `${coord[0]} ${coord[1]}`).join(', ')}))`;
            const graveGeometryInput = document.getElementById('graveGeometry');
            if (graveGeometryInput) {
                graveGeometryInput.value = wkt;
            }
        }
        
        // Reset form if no feature
        if (!feature) {
            const form = document.getElementById('graveForm');
            if (form) form.reset();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('graveModal'));
        modal.show();
    }

        setupGraveModalHandlers() {
        // Annotation form submission
        const graveForm = document.getElementById('graveForm');
        if (graveForm) {
            graveForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleGraveSubmit();
            });
        }

        // Annotation modal close
        const graveModal = document.getElementById('graveModal');
        if (graveModal) {
            graveModal.addEventListener('hidden.bs.modal', () => {
                this.resetGraveModal();
            });
        }
    }

    handleGraveSubmit() {
        const form = document.getElementById('graveForm');
        const formData = new FormData(form);
        
        // Call cemetery manager's save method
        if (this.cemeteryManager && this.cemeteryManager.saveGrave) {
            this.cemeteryManager.saveGrave(formData);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('graveModal'));
        if (modal) modal.hide();
    }

    resetGraveModal() {
        const form = document.getElementById('graveForm');
        if (form) form.reset();
        this.currentFeature = null;
        this.currentModal = null;
        
        // Clear pending coordinates
        if (this.cemeteryManager) {
            this.cemeteryManager.pendingPolygonCoords = null;
        }
    }

    // Generic Modal Handlers
    setupGenericModalHandlers() {
        // Handle all modal dismiss events
        document.addEventListener('hidden.bs.modal', (e) => {
            const modalId = e.target.id;
            
            // Reset any pending states
            switch (modalId) {
                case 'graveModal':
                    this.resetGraveModal();
                    break;
            }
        });

        // Handle modal show events
        document.addEventListener('show.bs.modal', (e) => {
            const modalId = e.target.id;
            this.currentModal = modalId.replace('Modal', '');
        });
    }

    // Utility Methods
    closeCurrentModal() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        });
    }

    setPendingCoordinates(latlng) {
        this.pendingCoordinates = latlng;
    }

    clearPendingCoordinates() {
        this.pendingCoordinates = null;
    }
    // Show confirmation modal
    showConfirmationModal(title, message, onConfirm, onCancel = null) {
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) return;

        // Set modal content
        const modalTitle = confirmModal.querySelector('.modal-title');
        const modalBody = confirmModal.querySelector('.modal-body');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.textContent = message;

        // Set up event handlers
        const confirmBtn = confirmModal.querySelector('.btn-confirm');
        const cancelBtn = confirmModal.querySelector('.btn-cancel');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                onConfirm();
                const modal = bootstrap.Modal.getInstance(confirmModal);
                if (modal) modal.hide();
            };
        }

        if (cancelBtn && onCancel) {
            cancelBtn.onclick = () => {
                onCancel();
                const modal = bootstrap.Modal.getInstance(confirmModal);
                if (modal) modal.hide();
            };
        }

        // Show modal
        const modal = new bootstrap.Modal(confirmModal);
        modal.show();
    }
}

function openPlotModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showGraveModal();
    }
}

function openGraveModal() {
    if (window.cemeteryManager && window.cemeteryManager.modalManager) {
        window.cemeteryManager.modalManager.showGraveModal();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}

// ES6 module export
if (typeof window !== 'undefined') {
    window.ModalManager = ModalManager;
}

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title">Add Grave Point</h3>
                    <div class="btn-group d-flex gap-2" role="group">
                        <!-- <button type="button" class="btn btn-success btn-sm" id="btnAddCemetery">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            <span class="d-none d-sm-inline">Add Cemetery</span>
                            <span class="d-inline d-sm-none">Cemetery</span>
                        </button> -->
                        <!-- <button type="button" class="btn btn-primary btn-sm" id="btnAddRoad">
                            <i class="fas fa-road me-1"></i>
                            <span class="d-none d-sm-inline">Add Road</span>
                            <span class="d-inline d-sm-none">Road</span>
                        </button>
                        <button type="button" class="btn btn-info btn-sm" id="btnAddAnnotation">
                            <i class="fas fa-sticky-note me-1"></i>
                            <span class="d-none d-sm-inline">Add Annotation</span>
                            <span class="d-inline d-sm-none">Note</span>
                        </button> -->
                        <button type="button" class="btn btn-warning btn-sm" id="btnAddGravePlot">
                            <i class="fas fa-square me-1"></i>
                            <span class="d-none d-sm-inline">Add Grave Plot</span>
                            <span class="d-inline d-sm-none">Plot</span>
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" id="btnReload">
                            <i class="fas fa-sync me-1"></i>
                            <span class="d-none d-sm-inline">Reload</span>
                            <span class="d-inline d-sm-none">Reload</span>
                        </button>
                        </div>
                </div>
                <div class="card-body p-0">
                    <div id="map" style="height: calc(100vh - 250px); width: 100%;" class="mobile-map"></div>
                </div>
            </div>
        </div>
    </div>
</div>



<!-- Grave Plot Modal -->
<div class="modal fade" id="graveModal" tabindex="-1" style="z-index: 10000;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="graveModalLabel">Add Grave Plot</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="gravePlotForm">
                <div class="modal-body">
                    <input type="hidden" id="gravePlotId" name="id">
                    <input type="hidden" name="action" value="createBurialRecord">
                    <input type="hidden" id="gravePlotGeometry" name="boundary">
                    <input type="hidden" id="gravePlotCoordinates" name="location">
                    <input type="hidden" class="form-control" id="graveLocation" name="location" readonly>
                    <input type="hidden" class="form-control" id="graveStatus" name="status" value="occupied" readonly>
                    <div class="mb-3">
                        <label for="graveNumber" class="form-label">Grave Number</label>
                        <input type="text" class="form-control" id="graveNumber" name="grave_number">
                    </div>
                    <div class="mb-3">
                        <label for="graveImage" class="form-label">Image</label>
                        <input type="file" class="form-control" id="graveImage" name="image_path" accept="image/*">
                    </div>
                    <!-- <div class="mb-3">
                        <label for="graveStatus" class="form-label">Status</label>
                        <select class="form-select" id="graveStatus" name="status">
                            <option value="">Select Status</option>
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div> -->
                    <div class="mb-3">
                        <label for="graveNotes" class="form-label">Notes</label>
                        <textarea class="form-control" id="graveNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save me-1"></i>Save Grave Plot
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
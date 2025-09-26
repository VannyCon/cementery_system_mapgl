// Cemetery Management System with Enhanced MapLibre GL Integration
class CemeteryManager {
    constructor() {
        this.authManager = new AuthManager();
        this.cemeteryAPI = this.authManager.API_CONFIG.baseURL + 'cemetery.php';
        this.initializeMap();
        this.initializeUI();
        // Don't load data immediately - wait for map to be ready
    }

    initializeMap() {
        // Initialize MapLibre GL map
        this.map = new maplibregl.Map({
            container: 'map',
            style: 'https://tiles.openfreemap.org/styles/bright',
            // pitch: 100,
            center: [123.3372456, 10.950055], // [lng, lat] for MapLibre GL
            zoom: 19,
            minZoom: 0,
            maxZoom: 24,  // 👈 allow zooming up to level 24
            canvasContextAttributes: {antialias: true}
        });

        // Wait for map to load before adding controls and setting up interactions
        this.map.on('load', () => {
            console.log('MapLibre GL map loaded successfully');
            
            // Add navigation controls after map loads
            this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
            this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');
            
            // Initialize Mapbox GL Draw
            this.initializeDrawControls();
            
            // Load data after map is ready
            this.loadData();
        });

        // Initialize feature collections for different data types
        this.features = {
            cemeteries: [],
            roads: [],
            gravePlots: [],
            annotations: [],
            routes: []
        };

        // Drawing state (now handled by Mapbox GL Draw)
        // this.drawingMode, this.currentDrawing, this.drawingSource removed

        // Routing state
        this.routingMode = null;
        this.startMarker = null;
        this.endMarker = null;
        this.startNodeId = null;
        this.endNodeId = null;

        // Graph structures for routing
        this.graphNodes = [];
        this.graphAdj = new Map();
        this.nodeKeyToId = new Map();

        // Snapping tolerance
        this.SNAP_TOLERANCE_METERS = 5;

        // Initialize tab state
        window.tabs = window.tabs || 'annotations'; // Default to annotations tab

        // Event handlers
        this.setupMapEventHandlers();
    }


    setupMapEventHandlers() {
        // Handle map clicks for drawing and routing
        this.map.on('click', (e) => {
            const lngLat = e.lngLat;
            const latlng = { lat: lngLat.lat, lng: lngLat.lng };
            
            // Drawing is now handled by Mapbox GL Draw
            
            // If user location is active, automatically use it as start and clicked point as destination
            if (this.isUserLocationActive && this.graphNodes.length > 0) {
                const snapped = this.findNearestGraphNode(latlng);
                if (!snapped) {
                    this.setRouteInfo('No nearby road point found for destination.');
                    if (typeof CustomToast !== 'undefined') {
                        CustomToast.show('warning','Click closer to a road for routing');
                    }
                    return;
                }
                
                // Set destination and automatically calculate route
                this.setEndPoint(snapped);
                this.findRoute();
                
                if (typeof CustomToast !== 'undefined') {
                    CustomToast.show('success','Route calculated from your location!');
                }
                return;
            }
            
            // Original routing mode handling
            if (!this.routingMode) return;
            if (!this.graphNodes.length) {
                this.setRouteInfo('No roads to route on. Add roads first.');
                return;
            }
            
            const snapped = this.findNearestGraphNode(latlng);
            if (!snapped) {
                this.setRouteInfo('No nearby road point found.');
                return;
            }
            
            if (this.routingMode === 'start') {
                this.setStartPoint(snapped);
            } else if (this.routingMode === 'end') {
                this.setEndPoint(snapped);
            }
            
            this.routingMode = null;
        });

        // Note: Feature-specific click handlers are set up in each render method
        // (renderCemeteries, renderRoads, renderGravePlots, renderAnnotations)
    }


    initializeUI() {
        // Drawing buttons - now using Mapbox GL Draw
        const btnAddRoad = document.getElementById('btnAddRoad');
        const btnAddGravePlot = document.getElementById('btnAddGravePlot');
        const btnAddAnnotation = document.getElementById('btnAddAnnotation');
        
        console.log('Button elements found:', {
            btnAddRoad: !!btnAddRoad,
            btnAddGravePlot: !!btnAddGravePlot,
            btnAddAnnotation: !!btnAddAnnotation
        });
        
        if (btnAddRoad) {
            btnAddRoad.addEventListener('click', () => {
                console.log('Add Road button clicked');
                this.currentDrawingMode = 'road';
                this.startDrawMode('line_string');
            });
        } else {
            console.warn('btnAddRoad element not found');
        }

        if (btnAddGravePlot) {
            btnAddGravePlot.addEventListener('click', () => {
                console.log('Add Grave Plot button clicked');
                this.currentDrawingMode = 'grave_plot';
                this.startDrawMode('polygon');
            });
        } else {
            console.warn('btnAddGravePlot element not found');
        }

        if (btnAddAnnotation) {
            btnAddAnnotation.addEventListener('click', () => {
                console.log('Add Annotation button clicked');
                this.currentDrawingMode = 'annotation';
                this.startDrawMode('polygon');
            });
        } else {
            console.warn('btnAddAnnotation element not found');
        }

        document.getElementById('btnReload').addEventListener('click', () => {
            this.loadData();
        });

        // Form submissions
        this.setupFormHandlers();
        
        // Tab interactions
        this.setupTabInteractions();
    }


    setupFormHandlers() {
        // Form handlers are now managed by ModalManager
        // Only keep delete confirmation handler
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', async () => {
                await this.confirmDelete();
            });
        }
    }


    // Data Management
    async loadData() {
        console.log('Loading cemetery data...');
        // Prevent multiple simultaneous calls
        if (this.isLoadingData) {
            console.log('Data loading already in progress, skipping...');
            return;
        }
        
        this.isLoadingData = true;
        
        try {
            const response = await axios.get(`${this.cemeteryAPI}?action=getMapData`, {
                headers: this.authManager.API_CONFIG.getHeaders()
            });
            if (response.data.success) {
                console.log('Data:', response.data);
                this.clearLayers();
                const data = response.data.data;

                // Store cemetery data for later use in dropdowns
                this.cemeteries = data.cemeteries || [];
                // Render roads last so they appear on top
                if (this.roadManager) {
                    this.roadManager.renderRoads(data.roads || []);
                }
                // Render layers in order (bottom to top)
                this.renderCemeteries(data.cemeteries || []);
                this.renderGravePlots(data.grave_plots || []);


                
                // Store annotations data for editing
                this.annotations = data.layer_annotations || [];
                if (this.layerManager) {
                    this.layerManager.renderAnnotations(this.annotations);
                }
                

                if (this.roadManager) {
                    this.roadManager.buildGraphFromRoads(data.roads || []);
                }
                this.updateTables(data);
                
                // Fit bounds if any data exists
                setTimeout(() => {
                    this.fitMapToData();
                }, 100); // Small delay to ensure all layers are rendered
            } else {
                CustomToast.show("danger","Failed to load cemetery data");
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            if (error.response && error.response.status === 401) {
                CustomToast.show("danger","Authentication Error", "Please login again");
                // Redirect to login page
                window.location.href = '../../auth/login.php';
            } else {
                CustomToast.show('danger','Failed to load cemetery data');
            }
        } finally {
            this.isLoadingData = false;
        }
    }

    clearLayers() {
        // Remove all custom layers and sources
        const layersToRemove = [
            'cemeteries', 
            'roads', 
            'grave-plots-polygon', 
            'grave-plots-polygon-stroke', 
            'grave-plots-point',
            'annotations', 
            'annotations-stroke',
            'routes'
        ];
        layersToRemove.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        
        // Remove sources (these have different IDs than layers)
        const sourcesToRemove = ['cemeteries', 'roads', 'grave-plots', 'annotations', 'routes'];
        sourcesToRemove.forEach(sourceId => {
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
        
        // Clear feature collections
        this.features = {
            cemeteries: [],
            roads: [],
            gravePlots: [],
            annotations: [],
            routes: []
        };
    }

    fitMapToData() {
        // Check if map is loaded before proceeding
        if (!this.map || !this.map.isStyleLoaded()) {
            console.warn('Map not ready for fitting bounds');
            return;
        }

        // Calculate bounds from all features
        let minLng = Infinity, minLat = Infinity;
        let maxLng = -Infinity, maxLat = -Infinity;
        let hasData = false;
        
        Object.values(this.features).forEach(featureCollection => {
            if (featureCollection.length > 0) {
                featureCollection.forEach(feature => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        const coords = this.getFeatureBounds(feature);
                        if (coords) {
                            hasData = true;
                            
                            if (Array.isArray(coords[0])) {
                                // Handle bounds array [min, max]
                                const [min, max] = coords;
                                minLng = Math.min(minLng, min[0]);
                                minLat = Math.min(minLat, min[1]);
                                maxLng = Math.max(maxLng, max[0]);
                                maxLat = Math.max(maxLat, max[1]);
                            } else {
                                // Handle single coordinate [lng, lat]
                                minLng = Math.min(minLng, coords[0]);
                                minLat = Math.min(minLat, coords[1]);
                                maxLng = Math.max(maxLng, coords[0]);
                                maxLat = Math.max(maxLat, coords[1]);
                            }
                        }
                    }
                });
            }
        });
        
        if (hasData && isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
            // Create bounds in MapLibre GL format: [[minLng, minLat], [maxLng, maxLat]]
            const bounds = [[minLng, minLat], [maxLng, maxLat]];
            this.map.fitBounds(bounds, { padding: 50 });
        }
    }

    getFeatureBounds(feature) {
        if (feature.geometry.type === 'Point') {
            return feature.geometry.coordinates; // [lng, lat]
        } else if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates;
            if (coords.length === 0) return null;
            
            let minLng = coords[0][0], minLat = coords[0][1];
            let maxLng = coords[0][0], maxLat = coords[0][1];
            
            coords.forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLng = Math.max(maxLng, coord[0]);
                maxLat = Math.max(maxLat, coord[1]);
            });
            
            return [[minLng, minLat], [maxLng, maxLat]];
        } else if (feature.geometry.type === 'Polygon') {
            const coords = feature.geometry.coordinates[0];
            if (coords.length === 0) return null;
            
            let minLng = coords[0][0], minLat = coords[0][1];
            let maxLng = coords[0][0], maxLat = coords[0][1];
            
            coords.forEach(coord => {
                minLng = Math.min(minLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLng = Math.max(maxLng, coord[0]);
                maxLat = Math.max(maxLat, coord[1]);
            });
            
            return [[minLng, minLat], [maxLng, maxLat]];
        }
        return null;
    }

    renderCemeteries(cemeteries) {
        // Check if map is loaded before proceeding
        if (!this.map) {
            console.warn('Map not initialized for rendering cemeteries');
            return;
        }

        if (!this.map.isStyleLoaded()) {
            console.warn('Map style not ready for rendering cemeteries, retrying in 100ms...');
            setTimeout(() => {
                this.renderCemeteries(cemeteries);
            }, 100);
            return;
        }

        const features = cemeteries.map(cemetery => {
            const lat = parseFloat(cemetery.latitude);
            const lng = parseFloat(cemetery.longitude);
            
            if (this.isValidLatLng(lat, lng)) {
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    properties: {
                        id: cemetery.id,
                        name: cemetery.name,
                        description: cemetery.description || '',
                        photo_path: cemetery.photo_path || '',
                        type: 'cemetery'
                    }
                };
            }
            return null;
        }).filter(Boolean);

        this.features.cemeteries = features;

        // Add source and layer for cemeteries
        if (features.length > 0) {
            // Check if source already exists and remove it first
            if (this.map.getSource('cemeteries')) {
                this.map.removeSource('cemeteries');
            }
            
            this.map.addSource('cemeteries', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            this.map.addLayer({
                id: 'cemeteries',
                type: 'circle',
                source: 'cemeteries',
                paint: {
                    'circle-radius': 8,
                    'circle-color': '#dc3545',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });

            // Add click handler for cemeteries
            this.map.on('click', 'cemeteries', (e) => {
                const feature = e.features[0];
                this.showCemeteryPopup(feature, e.lngLat);
            });

            // Change cursor on hover
            this.map.on('mouseenter', 'cemeteries', () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', 'cemeteries', () => {
                this.map.getCanvas().style.cursor = '';
            });
        }
    }

    showCemeteryPopup(feature, lngLat) {
        const cemetery = feature.properties;
                const photoHtml = cemetery.photo_path ? 
                    `<div class="mt-2"><img src="${cemetery.photo_path}" alt="photo" style="max-width:150px;max-height:100px;object-fit:cover;"></div>` : '';
                
        const popupContent = `
                    <div>
                        <strong>${this.escapeHtml(cemetery.name)}</strong><br>
                        ${this.escapeHtml(cemetery.description || '')}
                        ${photoHtml}
                        <div class="mt-2">
                            <button class="btn btn-sm btn-primary" onclick="cemeteryManager.editCemetery(${cemetery.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="cemeteryManager.deleteCemetery(${cemetery.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
        `;

        new maplibregl.Popup()
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(this.map);
    }


    renderGravePlots(gravePlots) {
        // Check if map is loaded before proceeding
        if (!this.map) {
            console.warn('Map not initialized for rendering grave plots');
            return;
        }

        if (!this.map.isStyleLoaded()) {
            console.warn('Map style not ready for rendering grave plots, retrying in 100ms...');
            setTimeout(() => {
                this.renderGravePlots(gravePlots);
            }, 100);
            return;
        }

            const statusColors = {
                'available': '#28a745',
                'occupied': '#dc3545',
                'reserved': '#ffc107'
            };
            
        const features = gravePlots.map(plot => {
            if (plot.boundary) {
                try {
                    // Parse WKT boundary to coordinates
                    const coordinates = this.parseWKTPolygon(plot.boundary);
                    if (coordinates && coordinates.length > 0) {
                        // Convert [lat, lng] to [lng, lat] for MapLibre GL
                        const convertedCoords = coordinates.map(coord => [coord[1], coord[0]]);
                        
                        return {
                            type: 'Feature',
                            geometry: {
                                type: 'Polygon',
                                coordinates: [convertedCoords]
                            },
                            properties: {
                                id: plot.id,
                                grave_number: plot.grave_number,
                                status: plot.status,
                                cemetery_name: plot.cemetery_name || 'Unknown',
                                notes: plot.notes || '',
                                type: 'grave-plot',
                                color: statusColors[plot.status] || '#6c757d'
                            }
                        };
                    }
                } catch (error) {
                    console.error('Error rendering grave plot boundary:', error, plot);
                }
            }
            
            // Fallback to point if no boundary or parsing failed
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [123.421292, 10.887254] // Default coordinates
                },
                properties: {
                    id: plot.id,
                    grave_number: plot.grave_number,
                    status: plot.status,
                    cemetery_name: plot.cemetery_name || 'Unknown',
                    notes: plot.notes || '',
                    type: 'grave-plot',
                    color: statusColors[plot.status] || '#6c757d'
                }
            };
        });

        this.features.gravePlots = features;

        // Add source and layer for grave plots
        if (features.length > 0) {
            // Check if source already exists and remove it first
            if (this.map.getSource('grave-plots')) {
                this.map.removeSource('grave-plots');
            }
            
            this.map.addSource('grave-plots', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: features
                }
            });

            // Add polygon layer for grave plots with boundaries
            const polygonFeatures = features.filter(f => f.geometry.type === 'Polygon');
            if (polygonFeatures.length > 0) {
                this.map.addLayer({
                    id: 'grave-plots-polygon',
                    type: 'fill',
                    source: 'grave-plots',
                    filter: ['==', ['geometry-type'], 'Polygon'],
                    paint: {
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.7
                    }
                });

                this.map.addLayer({
                    id: 'grave-plots-polygon-stroke',
                    type: 'line',
                    source: 'grave-plots',
                    filter: ['==', ['geometry-type'], 'Polygon'],
                    paint: {
                        'line-color': ['get', 'color'],
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });
            }

            // Add circle layer for grave plots without boundaries
            const pointFeatures = features.filter(f => f.geometry.type === 'Point');
            if (pointFeatures.length > 0) {
                this.map.addLayer({
                    id: 'grave-plots-point',
                    type: 'circle',
                    source: 'grave-plots',
                    filter: ['==', ['geometry-type'], 'Point'],
                    paint: {
                        'circle-radius': 8,
                        'circle-color': ['get', 'color'],
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 2,
                        'circle-opacity': 0.7
                    }
                });
            }

            // Add click handler for grave plots
            this.map.on('click', ['grave-plots-polygon', 'grave-plots-point'], (e) => {
                const feature = e.features[0];
                this.showGravePlotPopup(feature, e.lngLat);
            });

            // Change cursor on hover
            this.map.on('mouseenter', ['grave-plots-polygon', 'grave-plots-point'], () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });

            this.map.on('mouseleave', ['grave-plots-polygon', 'grave-plots-point'], () => {
                this.map.getCanvas().style.cursor = '';
            });
        }
    }

    showGravePlotPopup(feature, lngLat) {
        const plot = feature.properties;
        
        const popupContent = `
                <div>
                    <strong>Grave ${this.escapeHtml(plot.grave_number)}</strong><br>
                    Status: <span class="badge bg-${plot.status === 'available' ? 'success' : plot.status === 'occupied' ? 'danger' : 'warning'}">${plot.status}</span><br>
                    Cemetery: ${this.escapeHtml(plot.cemetery_name || 'Unknown')}
                    ${plot.notes ? `<br>Notes: ${this.escapeHtml(plot.notes)}` : ''}
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary" onclick="cemeteryManager.editGravePlot(${plot.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="cemeteryManager.deleteGravePlot(${plot.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
        `;

        new maplibregl.Popup()
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(this.map);
    }


    // Helper function to parse WKT POLYGON to Leaflet coordinates
    parseWKTPolygon(wkt) {
        if (!wkt || typeof wkt !== 'string') {
            return null;
        }
        
        try {
            // Remove POLYGON(( and ))
            const coordsString = wkt.replace(/^POLYGON\(\(/, '').replace(/\)\)$/, '');
            
            // Split coordinates and detect format
            const coordinates = coordsString.split(',').map(coordPair => {
                const [first, second] = coordPair.trim().split(/\s+/).map(parseFloat);
                
                // For Philippines coordinates: lat ~10-11, lng ~123-124
                // If first value is > 100, it's likely longitude (lng, lat format)
                // If first value is < 20, it's likely latitude (lat, lng format)
                if (first > 100) {
                    // WKT is in [lng, lat] format, convert to [lat, lng]
                    return [second, first];
                } else {
                    // WKT is already in [lat, lng] format
                    return [first, second];
                }
            });
            
            return coordinates;
        } catch (error) {
            console.error('Error parsing WKT:', error, wkt);
            return null;
        }
    }


    // Routing Functions (from your original system_script.js)

    performNodeSnapping(segments) {
        // Endpoint snapping
        for (let i = 0; i < this.graphNodes.length; i++) {
            for (let j = i + 1; j < this.graphNodes.length; j++) {
                const a = this.graphNodes[i];
                const b = this.graphNodes[j];
                const d = this.haversineMeters(a.lat, a.lng, b.lat, b.lng);
                if (d > 0 && d <= this.SNAP_TOLERANCE_METERS) {
                    this.addEdge(a.id, b.id, d);
                }
            }
        }
        
        // Mid-segment snapping
        for (let pIdx = 0; pIdx < this.graphNodes.length; pIdx++) {
            const p = this.graphNodes[pIdx];
            for (const [aId, bId] of segments) {
                if (p.id === aId || p.id === bId) continue;
                const a = this.graphNodes[aId];
                const b = this.graphNodes[bId];
                const { t, dist, proj } = this.projectPointOntoSegmentMeters(p, a, b);
                if (t > 0 && t < 1 && dist <= this.SNAP_TOLERANCE_METERS) {
                    const jId = this.addNode(proj.lat, proj.lng);
                    const d1 = this.haversineMeters(a.lat, a.lng, proj.lat, proj.lng);
                    const d2 = this.haversineMeters(b.lat, b.lng, proj.lat, proj.lng);
                    const dp = this.haversineMeters(p.lat, p.lng, proj.lat, proj.lng);
                    this.addEdge(aId, jId, d1);
                    this.addEdge(jId, bId, d2);
                    this.addEdge(p.id, jId, dp);
                }
            }
        }
    }

    // Routing helper functions (from original system_script.js)
    nodeKey(lat, lng) {
        const f = 1e5;
        return `${Math.round(lat * f) / f},${Math.round(lng * f) / f}`;
    }

    addNode(lat, lng) {
        const key = this.nodeKey(lat, lng);
        if (this.nodeKeyToId.has(key)) return this.nodeKeyToId.get(key);
        const id = this.graphNodes.length;
        this.graphNodes.push({ id, lat, lng, key });
        this.nodeKeyToId.set(key, id);
        this.graphAdj.set(id, []);
        return id;
    }

    addEdge(aId, bId, w) {
        if (aId === bId) return;
        if (!this.hasEdge(aId, bId)) this.graphAdj.get(aId).push({ to: bId, w });
        if (!this.hasEdge(bId, aId)) this.graphAdj.get(bId).push({ to: aId, w });
    }

    hasEdge(aId, bId) {
        const list = this.graphAdj.get(aId) || [];
        return list.some(e => e.to === bId);
    }

    findNearestGraphNode(latlng) {
        let best = null;
        let bestD = Infinity;
        for (const n of this.graphNodes) {
            const d = this.haversineMeters(latlng.lat, latlng.lng, n.lat, n.lng);
            if (d < bestD) { bestD = d; best = n; }
        }
        return best;
    }

    setStartPoint(node) {
        this.startNodeId = node.id;
        if (this.startMarker) this.startMarker.remove();
        
        // Create custom start marker element
        const startMarkerEl = document.createElement('div');
        startMarkerEl.style.width = '20px';
        startMarkerEl.style.height = '20px';
        startMarkerEl.style.backgroundColor = '#28a745';
        startMarkerEl.style.borderRadius = '50%';
        startMarkerEl.style.border = '2px solid white';
        startMarkerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        this.startMarker = new maplibregl.Marker({
            element: startMarkerEl
        })
        .setLngLat([node.lng, node.lat])
        .addTo(this.map);
        
        this.setRouteInfo(`Start set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`);
    }

    setEndPoint(node) {
        this.endNodeId = node.id;
        if (this.endMarker) this.endMarker.remove();
        
        // Create custom end marker element
        const endMarkerEl = document.createElement('div');
        endMarkerEl.style.width = '20px';
        endMarkerEl.style.height = '20px';
        endMarkerEl.style.backgroundColor = '#ffc107';
        endMarkerEl.style.borderRadius = '50%';
        endMarkerEl.style.border = '2px solid white';
        endMarkerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        this.endMarker = new maplibregl.Marker({
            element: endMarkerEl
        })
        .setLngLat([node.lng, node.lat])
        .addTo(this.map);
        
        this.setRouteInfo(`End set to (${node.lat.toFixed(5)}, ${node.lng.toFixed(5)})`);
    }

    findRoute() {
        if (this.startNodeId == null || this.endNodeId == null) {
            this.setRouteInfo('Set Start and End first');
            return;
        }
        const res = this.dijkstra(this.startNodeId, this.endNodeId);
        this.renderRoute(res.pathCoords, res.distanceMeters);
        
        // Store for AR navigation
        if (res.pathCoords && res.pathCoords.length >= 2) {
            try {
                localStorage.setItem('cl_route_coords', JSON.stringify(res.pathCoords));
                localStorage.setItem('cl_route_distance_m', String(res.distanceMeters || 0));
            } catch (e) {}
            const arBtn = document.getElementById('btnARNavigate');
            if (arBtn) arBtn.disabled = false;
        }
    }

    dijkstra(sourceId, targetId) {
        const N = this.graphNodes.length;
        const dist = new Array(N).fill(Infinity);
        const prev = new Array(N).fill(-1);
        dist[sourceId] = 0;
        
        const used = new Array(N).fill(false);
        for (let iter = 0; iter < N; iter++) {
            let u = -1;
            let best = Infinity;
            for (let i = 0; i < N; i++) {
                if (!used[i] && dist[i] < best) { 
                    best = dist[i]; 
                    u = i; 
                }
            }
            if (u === -1) break;
            used[u] = true;
            if (u === targetId) break;
            
            const neighbors = this.graphAdj.get(u) || [];
            for (const { to, w } of neighbors) {
                const nd = dist[u] + w;
                if (nd < dist[to]) { 
                    dist[to] = nd; 
                    prev[to] = u; 
                }
            }
        }
        
        // Reconstruct path
        const pathIds = [];
        let cur = targetId;
        if (prev[cur] !== -1 || cur === sourceId) {
            while (cur !== -1) { 
                pathIds.push(cur); 
                cur = prev[cur]; 
            }
            pathIds.reverse();
        }
        const pathCoords = pathIds.map(id => [this.graphNodes[id].lat, this.graphNodes[id].lng]);
        return { pathIds, pathCoords, distanceMeters: dist[targetId] };
    }

    renderRoute(coords, distanceMeters) {
        // Clear existing route
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        
        // Clear existing markers
        if (this.startMarker) this.startMarker.remove();
        if (this.endMarker) this.endMarker.remove();
        
        if (!coords || coords.length < 2) {
            this.setRouteInfo('No route found');
            return;
        }
        
        // Convert coordinates to [lng, lat] format for MapLibre GL
        const routeCoords = coords.map(coord => [coord[1], coord[0]]);
        
        // Add route source and layer
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: routeCoords
                },
                properties: {}
            }
        });
        
        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            paint: {
                'line-color': '#dc3545',
                'line-width': 5,
                'line-opacity': 0.9
            }
        });
        
        // Add start and end markers
        if (this.startNodeId !== null && this.graphNodes[this.startNodeId]) {
            const startNode = this.graphNodes[this.startNodeId];
            this.startMarker = new maplibregl.Marker({
                color: '#28a745'
            })
            .setLngLat([startNode.lng, startNode.lat])
            .addTo(this.map);
        }
        
        if (this.endNodeId !== null && this.graphNodes[this.endNodeId]) {
            const endNode = this.graphNodes[this.endNodeId];
            this.endMarker = new maplibregl.Marker({
                color: '#ffc107'
            })
            .setLngLat([endNode.lng, endNode.lat])
            .addTo(this.map);
        }
        
        this.setRouteInfo(`Route length: ${(distanceMeters/1000).toFixed(2)} km`);
    }

    clearRoute() {
        this.startNodeId = null;
        this.endNodeId = null;
        
        // Remove route layer and source
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        
        // Remove markers
        if (this.startMarker) this.startMarker.remove();
        if (this.endMarker) this.endMarker.remove();
        
        this.setRouteInfo('Route cleared');
        
        try {
            localStorage.removeItem('cl_route_coords');
            localStorage.removeItem('cl_route_distance_m');
        } catch (e) {}
        
        const arBtn = document.getElementById('btnARNavigate');
        if (arBtn) arBtn.disabled = true;
    }

    async useMyLocation() {
        try {
            if (!navigator.geolocation) {
                this.setRouteInfo('Geolocation not supported by this browser');
                CustomToast.show('error','Geolocation not supported');
                return;
            }
            
            // Show loading state
            this.setRouteInfo('Getting your precise location…');
            const btn = document.getElementById('btnUseMyLocation');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Locating...';
            }
            
            // Get high-accuracy location
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000 // Allow 1-minute cached location
                });
            });
            
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            
            // Clear any existing user location marker
            if (this.userLocationMarker) {
                this.userLocationMarker.remove();
            }
            if (this.userAccuracyCircle) {
                this.userAccuracyCircle.remove();
            }
            
            // Create custom user location marker element
            const userLocationEl = document.createElement('div');
            userLocationEl.className = 'user-location-marker';
            userLocationEl.innerHTML = '<div class="user-location-dot"><div class="user-location-pulse"></div></div>';
            userLocationEl.style.width = '20px';
            userLocationEl.style.height = '20px';
            
            // Add user location marker
            this.userLocationMarker = new maplibregl.Marker({
                element: userLocationEl,
                title: `Your Location (±${Math.round(accuracy)}m accuracy)`
            })
            .setLngLat([lng, lat])
            .addTo(this.map);
            
            // Add accuracy circle
            this.userAccuracyCircle = new maplibregl.Marker({
                element: this.createAccuracyCircle(accuracy)
            })
            .setLngLat([lng, lat])
            .addTo(this.map);
            
            // Create popup with location info
            const popupContent = `
                <div class="user-location-popup">
                    <h6><i class="fas fa-location-arrow text-primary"></i> Your Location</h6>
                    <p class="mb-1"><strong>Coordinates:</strong><br>
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    <p class="mb-1"><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</p>
                    <small class="text-muted">Updated: ${new Date().toLocaleTimeString()}</small>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-success" onclick="cemeteryManager.setLocationAsStart(${lat}, ${lng})">
                            <i class="fas fa-play"></i> Set as Start
                        </button>
                        <button class="btn btn-sm btn-warning ms-1" onclick="cemeteryManager.setLocationAsEnd(${lat}, ${lng})">
                            <i class="fas fa-stop"></i> Set as End
                        </button>
                    </div>
                </div>
            `;
            
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: false
            })
            .setLngLat([lng, lat])
            .setHTML(popupContent)
            .addTo(this.map);
            
            // Zoom to location with appropriate zoom level based on accuracy
            let zoomLevel = 18; // Default high zoom
            if (accuracy > 100) zoomLevel = 16;
            if (accuracy > 500) zoomLevel = 14;
            if (accuracy > 1000) zoomLevel = 12;
            
            this.map.setCenter([lng, lat]);
            this.map.setZoom(zoomLevel);
            
            // Automatically set as start point for routing
            this.userCurrentLocation = { lat, lng };
            this.isUserLocationActive = true;
            
            // If roads exist, automatically set as start point
            if (this.graphNodes.length > 0) {
                const snapped = this.findNearestGraphNode({ lat, lng });
                if (snapped) {
                    this.setStartPoint(snapped);
                    this.setRouteInfo(`Your location set as start point. Click anywhere to set destination and get route.`);
                } else {
                    this.setRouteInfo(`Location found but no nearby roads. Add roads first for routing.`);
                }
            } else {
                this.setRouteInfo(`Location found with ${Math.round(accuracy)}m accuracy. Add roads to enable routing.`);
            }
            
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success',`Your location is now the start point! Click destination to get route.`);
            }
            
            // Open popup after a brief delay
            setTimeout(() => {
                this.userLocationMarker.openPopup();
            }, 1000);
            
            // Start high-frequency real-time location tracking
            this.startRealtimeLocationTracking();
            
        } catch (err) {
            console.error('Geolocation error:', err);
            let errorMessage = 'Failed to get your location';
            
            switch(err.code) {
                case err.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions.';
                    break;
                case err.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. Please try again.';
                    break;
                case err.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = `Location error: ${err.message}`;
            }
            
            this.setRouteInfo(errorMessage);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('error',errorMessage);
            }
        } finally {
            // Reset button state
            const btn = document.getElementById('btnUseMyLocation');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-location-arrow me-1"></i><span class="d-none d-sm-inline">My Location</span><span class="d-inline d-sm-none">GPS</span>';
            }
        }
    }

    createAccuracyCircle(accuracy) {
        const circleEl = document.createElement('div');
        circleEl.style.width = `${accuracy * 2}px`;
        circleEl.style.height = `${accuracy * 2}px`;
        circleEl.style.border = '2px solid #4285f4';
        circleEl.style.borderRadius = '50%';
        circleEl.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
        circleEl.style.position = 'absolute';
        circleEl.style.left = '50%';
        circleEl.style.top = '50%';
        circleEl.style.transform = 'translate(-50%, -50%)';
        circleEl.style.pointerEvents = 'none';
        return circleEl;
    }
    
    // Helper methods for setting location as start/end points
    setLocationAsStart(lat, lng) {
        if (this.graphNodes.length === 0) {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No roads available. Add roads first to use routing.');
            }
            return;
        }
        
        const snapped = this.findNearestGraphNode({ lat, lng });
        if (snapped) {
            this.setStartPoint(snapped);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success','Start point set to nearest road');
            }
        } else {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No nearby road found for routing');
            }
        }
    }
    
    setLocationAsEnd(lat, lng) {
        if (this.graphNodes.length === 0) {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No roads available. Add roads first to use routing.');
            }
            return;
        }
        
        const snapped = this.findNearestGraphNode({ lat, lng });
        if (snapped) {
            this.setEndPoint(snapped);
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('success','End point set to nearest road');
            }
        } else {
            if (typeof CustomToast !== 'undefined') {
                CustomToast.show('warning','No nearby road found for routing');
            }
        }
    }
    
    // High-frequency real-time location tracking
    startRealtimeLocationTracking() {
        // Stop any existing tracking
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
        }
        
        let lastUpdateTime = 0;
        let locationHistory = [];
        
        // Start high-frequency position watching
        this.locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                const speed = position.coords.speed || 0;
                
                // Smooth location updates - only update if moved significantly or accuracy improved
                const shouldUpdate = this.shouldUpdateLocation(lat, lng, accuracy, now - lastUpdateTime);
                
                if (shouldUpdate && this.userLocationMarker) {
                    // Smooth animation for marker movement
                    this.animateMarkerToPosition(lat, lng);
                    
                    // Update accuracy circle with smooth transition
                    if (this.userAccuracyCircle) {
                        this.userAccuracyCircle.setLngLat([lng, lat]);
                        // Update accuracy circle size
                        const circleEl = this.userAccuracyCircle.getElement();
                        if (circleEl) {
                            circleEl.style.width = `${accuracy * 2}px`;
                            circleEl.style.height = `${accuracy * 2}px`;
                        }
                    }
                    
                    // Store current location
                    this.userCurrentLocation = { lat, lng, accuracy, speed };
                    
                    // Update start point if user location is active
                    if (this.isUserLocationActive && this.graphNodes.length > 0) {
                        const snapped = this.findNearestGraphNode({ lat, lng });
                        if (snapped && this.startMarker) {
                            // Smoothly update start point
                            this.startMarker.setLngLat([snapped.lng, snapped.lat]);
                            this.startPoint = snapped;
                            
                            // Auto-recalculate route if end point exists
                            if (this.endPoint) {
                                this.findRoute();
                            }
                        }
                    }
                    
                    // Update popup with real-time info
                    this.updateLocationPopup(lat, lng, accuracy, speed);
                    
                    // Keep location history for smoothing
                    locationHistory.push({ lat, lng, accuracy, timestamp: now });
                    if (locationHistory.length > 10) {
                        locationHistory.shift(); // Keep only last 10 positions
                    }
                    
                    lastUpdateTime = now;
                }
            },
            (error) => {
                console.warn('Real-time location tracking error:', error);
                if (error.code === error.TIMEOUT) {
                    // Continue tracking even on timeout
                    console.log('Location timeout, continuing tracking...');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,           // Shorter timeout for faster updates
                maximumAge: 1000         // Very fresh location data (1 second max age)
            }
        );
        
        // Extended tracking time for navigation
        setTimeout(() => {
            if (this.locationWatchId) {
                navigator.geolocation.clearWatch(this.locationWatchId);
                this.locationWatchId = null;
                this.setRouteInfo('Real-time location tracking stopped to save battery');
            }
        }, 1800000); // 30 minutes for navigation
    }
    
    // Determine if location should be updated
    shouldUpdateLocation(lat, lng, accuracy, timeSinceLastUpdate) {
        if (!this.userCurrentLocation) return true;
        
        const distance = this.haversineMeters(
            this.userCurrentLocation.lat, 
            this.userCurrentLocation.lng, 
            lat, 
            lng
        );
        
        // Update conditions:
        // 1. Moved more than 2 meters
        // 2. Accuracy improved by more than 5 meters
        // 3. At least 2 seconds since last update
        return distance > 2 || 
               (accuracy < this.userCurrentLocation.accuracy - 5) || 
               timeSinceLastUpdate > 2000;
    }
    
    // Smooth marker animation
    animateMarkerToPosition(lat, lng) {
        if (!this.userLocationMarker) return;
        
        const currentLngLat = this.userLocationMarker.getLngLat();
        const targetLngLat = [lng, lat];
        
        // Calculate distance for animation duration
        const distance = this.haversineMeters(currentLngLat.lat, currentLngLat.lng, lat, lng);
        const duration = Math.min(Math.max(distance * 10, 100), 1000); // 100ms to 1s
        
        // Animate marker movement
        this.userLocationMarker.setLngLat(targetLngLat);
        
        // Add smooth CSS transition
        const markerElement = this.userLocationMarker.getElement();
        if (markerElement) {
            markerElement.style.transition = `all ${duration}ms ease-out`;
            setTimeout(() => {
                markerElement.style.transition = '';
            }, duration);
        }
    }
    
    // Update location popup with real-time data
    updateLocationPopup(lat, lng, accuracy, speed) {
        if (!this.userLocationMarker) return;
        
        const speedKmh = speed ? (speed * 3.6).toFixed(1) : '0.0';
        const popupContent = `
            <div class="user-location-popup">
                <h6><i class="fas fa-location-arrow text-primary"></i> Your Location (Live)</h6>
                <p class="mb-1"><strong>Coordinates:</strong><br>
                ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p class="mb-1"><strong>Accuracy:</strong> ±${Math.round(accuracy)}m</p>
                <p class="mb-1"><strong>Speed:</strong> ${speedKmh} km/h</p>
                <small class="text-muted">Live tracking active • ${new Date().toLocaleTimeString()}</small>
                <div class="mt-2">
                    <button class="btn btn-sm btn-danger" onclick="cemeteryManager.stopRealtimeTracking()">
                        <i class="fas fa-stop"></i> Stop Tracking
                    </button>
                    <button class="btn btn-sm btn-info ms-1" onclick="cemeteryManager.centerOnUserLocation()">
                        <i class="fas fa-crosshairs"></i> Center
                    </button>
                </div>
            </div>
        `;
        
        // Update existing popup or create new one
        const existingPopup = this.userLocationMarker.getPopup();
        if (existingPopup) {
            existingPopup.setHTML(popupContent);
        } else {
            const popup = new maplibregl.Popup({
                closeButton: true,
                closeOnClick: false
            })
            .setLngLat([lng, lat])
            .setHTML(popupContent);
            
            this.userLocationMarker.setPopup(popup);
        }
    }
    
    // Stop real-time tracking
    stopRealtimeTracking() {
        if (this.locationWatchId) {
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
        }
        this.isUserLocationActive = false;
        this.setRouteInfo('Real-time location tracking stopped');
        if (typeof CustomToast !== 'undefined') {
            CustomToast.show('info','Location tracking stopped');
        }
    }
    
    // Center map on user location
    centerOnUserLocation() {
        if (this.userCurrentLocation && this.userLocationMarker) {
            this.map.setCenter([this.userCurrentLocation.lng, this.userCurrentLocation.lat]);
            this.map.setZoom(18);
        }
    }
    
    // Stop location tracking (legacy method)
    stopLocationTracking() {
        this.stopRealtimeTracking();
    }

    setRouteInfo(text) {
        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) routeInfo.textContent = text;
    }

    // Utility Functions
    haversineMeters(aLat, aLng, bLat, bLng) {
        const R = 6371000;
        const toRad = (d) => d * Math.PI / 180;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const sa = Math.sin(dLat/2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng/2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(sa));
    }

    projectPointOntoSegmentMeters(p, a, b) {
        const lat0 = a.lat;
        const P = this.latLngToXY(p.lat, p.lng, lat0);
        const A = this.latLngToXY(a.lat, a.lng, lat0);
        const B = this.latLngToXY(b.lat, b.lng, lat0);
        const ABx = B.x - A.x, ABy = B.y - A.y;
        const APx = P.x - A.x, APy = P.y - A.y;
        const ab2 = ABx*ABx + ABy*ABy;
        if (ab2 === 0) return { t: 0, dist: Math.hypot(APx, APy), proj: a };
        let t = (APx*ABx + APy*ABy) / ab2;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        const X = { x: A.x + t*ABx, y: A.y + t*ABy };
        const dist = Math.hypot(P.x - X.x, P.y - X.y);
        const projLL = this.xyToLatLng(X.x, X.y, lat0);
        return { t, dist, proj: { lat: projLL.lat, lng: projLL.lng } };
    }

    latLngToXY(lat, lng, lat0 = lat) {
        const R = 6371000;
        const x = (lng * Math.PI / 180) * R * Math.cos(lat0 * Math.PI / 180);
        const y = (lat * Math.PI / 180) * R;
        return { x, y };
    }

    xyToLatLng(x, y, lat0) {
        const R = 6371000;
        const lat = (y / R) * 180 / Math.PI;
        const lng = (x / (R * Math.cos(lat0 * Math.PI / 180))) * 180 / Math.PI;
        return { lat, lng };
    }

    normalizeCoordinates(input, geometryType) {
        if (!Array.isArray(input)) return geometryType === 'polygon' ? [] : [];
        
        if (geometryType === 'polygon') {
            if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
                return input
                    .map(ring => ring.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean))
                    .filter(ring => ring.length >= 3);
            } else {
                const ring = input.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean);
                return ring.length >= 3 ? [ring] : [];
            }
        } else {
            if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
                const parts = input.map(part => part.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean)).filter(p => p.length >= 2);
                return parts[0] || [];
            } else {
                return input.map(this.normalizeToLatLngPair.bind(this)).filter(Boolean);
            }
        }
    }

    normalizeToLatLngPair(p) {
        if (!p) return null;
        if (Array.isArray(p) && p.length >= 2) {
            const first = Number(p[0]);
            const second = Number(p[1]);
            
            // For Philippines coordinates: lat ~10-11, lng ~123-124
            // If first value is > 100, it's likely longitude (lng, lat format)
            // If first value is < 20, it's likely latitude (lat, lng format)
            if (first > 100) {
                // Likely [lng, lat] format, convert to [lat, lng]
                return this.isValidLatLng(second, first) ? [second, first] : null;
            } else {
                // Assume [lat, lng] format
                return this.isValidLatLng(first, second) ? [first, second] : null;
            }
        }
        if (typeof p === 'object') {
            const lat = Number(p.lat ?? p.latitude);
            const lng = Number(p.lng ?? p.lon ?? p.longitude);
            return this.isValidLatLng(lat, lng) ? [lat, lng] : null;
        }
        return null;
    }

    isValidLatLng(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' && 
               isFinite(lat) && isFinite(lng) && 
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180;
    }

    coordsToWKT(coords, type) {
        if (type === 'POLYGON') {
            // coords should be in [lat, lng] format
            const ring = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `POLYGON((${ring}))`;
        } else if (type === 'LINESTRING') {
            // coords should be in [lat, lng] format
            const line = coords.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
            return `LINESTRING(${line})`;
        }
        return '';
    }

    populateCemeterySelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.warn(`Select element with id '${selectId}' not found`);
            return;
        }
        
        // Clear existing options
        select.innerHTML = '<option value="">Select Cemetery</option>';
        
        // Populate with cemetery data if available
        if (this.cemeteries && this.cemeteries.length > 0) {
            this.cemeteries.forEach(cemetery => {
                const option = document.createElement('option');
                option.value = cemetery.id;
                option.textContent = cemetery.name;
                select.appendChild(option);
            });
        } else {
            // If no cemeteries loaded yet, try to load them only once
            if (!this.cemeteries && !this.isLoadingCemeteries) {
                console.log('No cemetery data available, attempting to load...');
                this.isLoadingCemeteries = true;
                this.loadData().then(() => {
                    this.isLoadingCemeteries = false;
                    // Only call recursively if we now have data
                    if (this.cemeteries && this.cemeteries.length > 0) {
                        this.populateCemeterySelect(selectId);
                    }
                }).catch((error) => {
                    this.isLoadingCemeteries = false;
                    console.error('Failed to load cemetery data:', error);
                });
            }
        }
    }

    updateTables(data) {
        // this.updateCemeteriesTable(data.cemeteries || []);
        this.updateRoadsTable(data.roads || []);
        this.updatePlotsTable(data.grave_plots || []);
        this.updateAnnotationsTable(data.layer_annotations || []);
    }

    escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"]/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        }[s]));
    }
}

// Global functions for modal management are now handled by ModalManager class

// Initialize the cemetery manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if required libraries are already loaded
    if (typeof maplibregl !== 'undefined') {
        // Libraries already loaded, initialize immediately
        window.cemeteryManager = new CemeteryManager();
        return;
    }
    
    // Load required scripts first
    const scripts = [
        'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js'
    ];
    
    const styles = [
        'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css'
    ];
    
    // Load CSS first
    styles.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    });
    
    let loadedScripts = 0;
    
    function loadNextScript(index) {
        if (index >= scripts.length) {
            // All scripts loaded, wait a bit and initialize
            setTimeout(() => {
                if (typeof maplibregl !== 'undefined') {
                    window.cemeteryManager = new CemeteryManager();
                } else {
                    console.error('Required libraries not loaded properly');
                }
            }, 100);
            return;
        }
        
        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = () => {
            loadedScripts++;
            console.log(`Loaded script ${index + 1}/${scripts.length}: ${scripts[index]}`);
            loadNextScript(index + 1);
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${scripts[index]}`);
        };
        document.head.appendChild(script);
    }
    
    // Start loading scripts sequentially
    loadNextScript(0);
});

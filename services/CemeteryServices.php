<?php
require_once('../connection/connection.php');

class CemeteryServices extends config {
    // ============ CEMETERY MANAGEMENT ============
    
    /**
     * Get all cemeteries
     */
    public function getCemeteries() {
        try {
            $query = "SELECT * FROM tbl_place_cemeteries ORDER BY created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get cemeteries error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new cemetery
     */
    public function createCemetery($data) {
        try {
            $query = "INSERT INTO tbl_place_cemeteries (name, description, latitude, longitude, photo_path) 
                     VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['latitude'],
                $data['longitude'],
                $data['photo_path'] ?? null
            ]);

            return [
                'success' => true,
                'message' => 'Cemetery created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create cemetery: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update cemetery
     */
    public function updateCemetery($id, $data) {
        try {
            $query = "UPDATE tbl_place_cemeteries 
                     SET name = ?, description = ?, latitude = ?, longitude = ?, photo_path = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['latitude'],
                $data['longitude'],
                $data['photo_path'] ?? null,
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Cemetery updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update cemetery: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete cemetery
     */
    public function deleteCemetery($id) {
        try {
            $query = "DELETE FROM tbl_place_cemeteries WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Cemetery deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete cemetery error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete cemetery: ' . $e->getMessage()
            ];
        }
    }

    // ============ ROADS MANAGEMENT ============

    /**
     * Get all roads
     */
    public function getRoads() {
        try {
            $query = "SELECT r.*
                     FROM tbl_roads r 
                     ORDER BY r.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get roads error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new road
     */
    public function createRoad($data) {
        try {
            $query = "INSERT INTO tbl_roads (road_name, coordinates, geometry_type) 
                     VALUES (?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['road_name'],
                $data['coordinates'],
                $data['geometry_type'] ?? 'polyline',
            ]);

            return [
                'success' => true,
                'message' => 'Road created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create road: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update road
     */
    public function updateRoad($id, $data) {
        try {
            $query = "UPDATE tbl_roads 
                     SET road_name = ?, coordinates = ?, geometry_type = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['road_name'],
                $data['coordinates'],
                $data['geometry_type'] ?? 'polyline',
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Road updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update road: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete road
     */
    public function deleteRoad($id) {
        try {
            $query = "DELETE FROM tbl_roads WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Road deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete road error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete road: ' . $e->getMessage()
            ];
        }
    }

    // ============ BURIAL RECORDS MANAGEMENT ============


    public function getAllRecords($page = 1, $size = 12, $search = '', $featured = null) {
        try {
            $page = max(1, (int)$page);
            $size = max(1, min(100, (int)$size));
            $offset = ($page - 1) * $size;

            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(deceased_name LIKE :search OR grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

			$query = "SELECT * FROM tbl_burial_records $whereSql ORDER BY deceased_name ASC LIMIT :limit OFFSET :offset";
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $k => $v) { $stmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $stmt->bindValue(':limit', (int)$size, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    public function countAllRecords($search = '', $featured = null) {
        try {
            $whereClauses = [];
            $params = [];
            if ($search !== null && $search !== '') {
                $whereClauses[] = "(deceased_name LIKE :search OR grave_number LIKE :search)";
                $params[':search'] = "%" . $search . "%";
            }
            $whereSql = count($whereClauses) ? ('WHERE ' . implode(' AND ', $whereClauses)) : '';

            $query = "SELECT COUNT(*) as total FROM tbl_burial_records $whereSql";
            $stmt = $this->pdo->prepare($query);
            foreach ($params as $k => $v) { $stmt->bindValue($k, is_int($v) ? $v : $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR); }
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($row['total'] ?? 0);
        } catch (PDOException $e) {
            return 0;
        }
    }


    /**
     * Get all burial records
     */
    public function getBurialRecords() {
        try {
            $query = "SELECT br.*
                     FROM tbl_burial_records br 
                     ORDER BY br.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get burial records error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new burial record
     */
    public function createBurialRecord($data) {
        try {
            $query = "INSERT INTO tbl_burial_records 
                     (deceased_name, date_of_birth, date_of_death, burial_date, grave_number, 
                      grave_id_fk, next_of_kin, contact_info, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $data['grave_number'],
                $data['grave_id_fk'],
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null
            ]);

            return [
                'success' => true,
                'message' => 'Burial record created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create burial record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update burial record
     */
    public function updateBurialRecord($id, $data) {
        try {
            $query = "UPDATE tbl_burial_records 
                     SET deceased_name = ?, date_of_birth = ?, date_of_death = ?, burial_date = ?, 
                         grave_number = ?, grave_id_fk = ?, next_of_kin = ?, contact_info = ?, notes = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['deceased_name'],
                $data['date_of_birth'] ?? null,
                $data['date_of_death'],
                $data['burial_date'],
                $data['grave_number'],
                $data['grave_id_fk'],
                $data['next_of_kin'] ?? null,
                $data['contact_info'] ?? null,
                $data['notes'] ?? null,
                $id
            ]);

            return [
                'success' => true,
                'message' => 'Burial record updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update burial record: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete burial record
     */
    public function deleteBurialRecord($id) {
        try {
            $query = "DELETE FROM tbl_burial_records WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Burial record deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete burial record error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete burial record: ' . $e->getMessage()
            ];
        }
    }

    // ============ GRAVE PLOTS MANAGEMENT ============

    /**
     * Get all grave plots
     */
    public function getGravePlots() {
        try {
            $query = "SELECT gp.id, gp.grave_number,
                             ST_AsText(gp.location) as location,
                             gp.image_path,
                             gp.status,
                             ST_AsText(gp.boundary) as boundary, gp.notes, gp.created_at,
                      FROM tbl_grave_plots gp
                      ORDER BY gp.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get grave plots error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create a new grave plot
     */
    public function createGravePlot($data) {
        try {
            $location = isset($data['location']) && $data['location'] ? $data['location'] : null;
            $imagePath = isset($data['image_path']) ? $data['image_path'] : null;
    
            $boundary = isset($data['boundary']) ? $this->ensurePolygonClosed($data['boundary']) : null;
    
            // If location is provided, validate it
            if ($location) {
                $testQuery = "SELECT ST_GeomFromText(?) as test_geom";
                $testStmt = $this->pdo->prepare($testQuery);
                $testStmt->execute([$location]);
                if ($testStmt->fetch(PDO::FETCH_ASSOC)['test_geom'] === null) {
                    return ['success' => false, 'message' => 'Invalid location format.'];
                }
            }
    
            $query = "INSERT INTO tbl_grave_plots
                      (grave_number, location, image_path, boundary, status, notes)
                      VALUES (?, ST_GeomFromText(?), ?, ST_GeomFromText(?), ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['grave_number'],
                $location,
                $imagePath,
                $boundary,
                $data['status'] ?? 'available',
                $data['notes'] ?? null
            ]);
    
            return [
                'success' => true,
                'message' => 'Grave plot created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to create grave plot: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update grave plot
     */
    public function updateGravePlot($id, $data) {
        try {
            $location = isset($data['location']) && $data['location'] ? $data['location'] : null;
            $imagePath = isset($data['image_path']) ? $data['image_path'] : null;
    
            $query = "UPDATE tbl_grave_plots
                      SET grave_number = ?,
                          location = ST_GeomFromText(?), image_path = ?,
                          boundary = ST_GeomFromText(?), status = ?, notes = ?
                      WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $data['grave_number'],
                $location,
                $imagePath,
                $data['boundary'] ?? null,
                $data['status'] ?? 'available',
                $data['notes'] ?? null,
                $id
            ]);
    
            return [
                'success' => true,
                'message' => 'Grave plot updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update grave plot: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete grave plot
     */
    public function deleteGravePlot($id) {
        try {
            $query = "DELETE FROM tbl_grave_plots WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Grave plot deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete grave plot error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete grave plot: ' . $e->getMessage()
            ];
        }
    }

    // ============ LAYER ANNOTATIONS MANAGEMENT ============

    /**
     * Get all layer annotations
     */
    public function getLayerAnnotations() {
        try {
            // Convert binary geometry to WKT format for JavaScript consumption
            $query = "SELECT la.id, ST_AsText(la.geometry) as geometry, 
                            la.label, la.color, la.notes, la.is_visible, 
                            la.is_active, la.sort_order, la.created_at, la.updated_at
                     FROM tbl_layer_annotations la 
                     ORDER BY la.sort_order ASC, la.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Sanitize UTF-8 for each result
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get layer annotations error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Ensure polygon is properly closed (first and last coordinates must be identical)
     */
    private function ensurePolygonClosed($wkt) {
        if (strpos($wkt, 'POLYGON') === false) {
            return $wkt; // Not a polygon, return as-is
        }
        
        // Extract coordinates from POLYGON((coords))
        preg_match('/POLYGON\(\(([^)]+)\)\)/', $wkt, $matches);
        if (!isset($matches[1])) {
            return $wkt; // Invalid format, return as-is
        }
        
        $coordsString = trim($matches[1]);
        $coords = explode(',', $coordsString);
        
        if (count($coords) < 3) {
            return $wkt; // Not enough coordinates for a polygon
        }
        
        $firstCoord = trim($coords[0]);
        $lastCoord = trim($coords[count($coords) - 1]);
        
        // If first and last coordinates are different, close the polygon
        if ($firstCoord !== $lastCoord) {
            $coordsString .= ', ' . $firstCoord;
        }
        
        return 'POLYGON((' . $coordsString . '))';
    }

    /**
     * Create a new layer annotation
     */
    public function createLayerAnnotation($data) {
        try {
            error_log("Creating layer annotation with geometry: " . $data['geometry']);
            
            // Ensure polygon is properly closed
            $geometry = $this->ensurePolygonClosed($data['geometry']);
            error_log("Processed geometry: " . $geometry);
            
            // Test if the geometry is valid before inserting
            $testQuery = "SELECT ST_GeomFromText(?) as test_geom";
            $testStmt = $this->pdo->prepare($testQuery);
            $testStmt->execute([$geometry]);
            $testResult = $testStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($testResult['test_geom'] === null) {
                error_log("Invalid geometry format: " . $geometry);
                return [
                    'success' => false,
                    'message' => 'Invalid geometry format. Polygon must be properly closed.'
                ];
            }
            
            $query = "INSERT INTO tbl_layer_annotations 
                     (geometry, label, color, notes, is_visible, is_active, sort_order) 
                     VALUES (ST_GeomFromText(?), ?, ?, ?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                $geometry,
                $data['label'] ?? null,
                $data['color'] ?? '#FF0000',
                $data['notes'] ?? null,
                $data['is_visible'] ?? 1,
                $data['is_active'] ?? 1,
                $data['sort_order'] ?? 0
            ]);

            return [
                'success' => true,
                'message' => 'Layer annotation created successfully',
                'id' => $this->pdo->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("Create layer annotation error: " . $e->getMessage());
            error_log("Geometry data: " . ($data['geometry'] ?? 'null'));
            return [
                'success' => false,
                'message' => 'Failed to create layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update layer annotation
     */
    public function updateLayerAnnotation($id, $data) {
        try {
            // If geometry is null or empty, do not update the geometry column
            if (!isset($data['geometry']) || is_null($data['geometry']) || trim($data['geometry']) === '') {
                $query = "UPDATE tbl_layer_annotations 
                         SET label = ?, color = ?, notes = ?, 
                             is_visible = ?, is_active = ?, sort_order = ? 
                         WHERE id = ?";
                $params = [
                    $data['label'] ?? null,
                    $data['color'] ?? '#FF0000',
                    $data['notes'] ?? null,
                    $data['is_visible'] ?? 1,
                    $data['is_active'] ?? 1,
                    $data['sort_order'] ?? 0,
                    $id
                ];
            } else {
                $query = "UPDATE tbl_layer_annotations 
                         SET geometry = ST_GeomFromText(?), label = ?, color = ?, notes = ?, 
                             is_visible = ?, is_active = ?, sort_order = ? 
                         WHERE id = ?";
                $params = [
                    $data['geometry'], // WKT format polygon
                    $data['label'] ?? null,
                    $data['color'] ?? '#FF0000',
                    $data['notes'] ?? null,
                    $data['is_visible'] ?? 1,
                    $data['is_active'] ?? 1,
                    $data['sort_order'] ?? 0,
                    $id
                ];
            }

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            return [
                'success' => true,
                'message' => 'Layer annotation updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update layer annotation error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete layer annotation
     */
    public function deleteLayerAnnotation($id) {
        try {
            $query = "DELETE FROM tbl_layer_annotations WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            return [
                'success' => true,
                'message' => 'Layer annotation deleted successfully'
            ];
        } catch (PDOException $e) {
            error_log("Delete layer annotation error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to delete layer annotation: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get layer annotations with visibility filter
     */
    public function getVisibleLayerAnnotations() {
        try {
            $query = "SELECT la.id, ST_AsText(la.geometry) as geometry, 
                            la.label, la.color, la.notes, la.is_visible, 
                            la.is_active, la.sort_order, la.created_at, la.updated_at
                     FROM tbl_layer_annotations la 
                     WHERE la.is_visible = 1 AND la.is_active = 1
                     ORDER BY la.sort_order ASC, la.created_at DESC";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return array_map(function($row) {
                return array_map(function($value) {
                    if (is_string($value)) {
                        return mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    }
                    return $value;
                }, $row);
            }, $results);
        } catch (PDOException $e) {
            error_log("Get visible layer annotations error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Toggle annotation visibility
     */
    public function toggleAnnotationVisibility($id) {
        try {
            $query = "UPDATE tbl_layer_annotations 
                     SET is_visible = NOT is_visible 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$id]);

            // Get the updated visibility status
            $checkQuery = "SELECT is_visible FROM tbl_layer_annotations WHERE id = ?";
            $checkStmt = $this->pdo->prepare($checkQuery);
            $checkStmt->execute([$id]);
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'message' => 'Annotation visibility updated successfully',
                'is_visible' => $result['is_visible']
            ];
        } catch (PDOException $e) {
            error_log("Toggle annotation visibility error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to toggle annotation visibility: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update annotation sort order
     */
    public function updateAnnotationSortOrder($id, $sortOrder) {
        try {
            $query = "UPDATE tbl_layer_annotations 
                     SET sort_order = ? 
                     WHERE id = ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$sortOrder, $id]);

            return [
                'success' => true,
                'message' => 'Annotation sort order updated successfully'
            ];
        } catch (PDOException $e) {
            error_log("Update annotation sort order error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to update annotation sort order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get combined data for map display
     */
    public function getMapData() {
        try {
            error_log("Starting getMapData...");
            
            $cemeteries = $this->getCemeteries();
            error_log("Cemeteries count: " . count($cemeteries));
            
            $roads = $this->getRoads();
            error_log("Roads count: " . count($roads));
            
            $burialRecords = $this->getBurialRecords();
            error_log("Burial records count: " . count($burialRecords));
            
            $gravePlots = $this->getGravePlots();
            error_log("Grave plots count: " . count($gravePlots));
            
            $layerAnnotations = $this->getVisibleLayerAnnotations();
            error_log("Visible layer annotations count: " . count($layerAnnotations));
            
            $result = [
                'success' => true,
                'data' => [
                    'cemeteries' => $cemeteries,
                    'roads' => $roads,
                    'burial_records' => $burialRecords,
                    'grave_plots' => $gravePlots,
                    'layer_annotations' => $layerAnnotations
                ]
            ];
            
            error_log("getMapData completed successfully");
            return $result;
            
        } catch (Exception $e) {
            error_log("Get map data error: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => 'Failed to load map data: ' . $e->getMessage()
            ];
        }
    }
}
?>

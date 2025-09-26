<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once __DIR__ . '/../middleware/JWTMiddleware.php';
require_once('../services/CemeteryServices.php');

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_log("=== CEMETERY API SCRIPT STARTED ===");
error_log("Current time: " . date('Y-m-d H:i:s'));
error_log("Request URI: " . $_SERVER['REQUEST_URI']);
error_log("Output buffering level: " . ob_get_level());

$middleware = new JWTMiddleware();
header('Content-Type: application/json');
$cemeteryServices = new CemeteryServices();

// Handle guest-accessible (read-only) operations first
// if ($_SERVER["REQUEST_METHOD"] == "GET") {
//     $action = $_GET['action'] ?? '';
//     error_log("GET action received: " . $action);

//     switch ($action) {
//         case 'getAllRecords':
//             $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
//             $size = isset($_GET['size']) ? intval($_GET['size']) : 12;
//             $search = isset($_GET['search']) ? trim($_GET['search']) : '';
//             $categories = $cemeteryServices->getAllRecords($page, $size, $search);
//             $total = $cemeteryServices->countAllCategories($search);
//             $totalPages = $size > 0 ? (int)ceil($total / $size) : 1;
//             echo json_encode([
//                 'success' => true,
//                 'data' => $categories,
//                 'meta' => [
//                     'page' => $page,
//                     'size' => $size,
//                     'total' => $total,
//                     'totalPages' => $totalPages,
//                     'search' => $search
//                 ]
//             ]);
//             exit;
//         default:
//             // Optionally handle unknown actions
//             break;
//     }
// }

// Require authentication for all other cemetery operations
$middleware->requireAuth(function() {
    error_log("Inside authenticated callback");
    global $cemeteryServices;
    
    // Handle different actions based on HTTP method
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'createCemetery':
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->createCemetery($data);
                echo json_encode($result);
                break;
                
            case 'updateCemetery':
                $id = $_POST['id'] ?? '';
                $data = $cemeteryServices->cleanArray($_POST);
                $result = $cemeteryServices->updateCemetery($id, $data);
                echo json_encode($result);
                break;
                
            case 'deleteCemetery':
                $id = $_POST['id'] ?? '';
                $result = $cemeteryServices->deleteCemetery($id);
                echo json_encode($result);
                break;
                
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'createCemetery', 'updateCemetery', 'deleteCemetery',
                        'createRoad', 'updateRoad', 'deleteRoad',
                        'createBurialRecord', 'updateBurialRecord', 'deleteBurialRecord',
                        'createGravePlot', 'updateGravePlot', 'deleteGravePlot',
                        'createLayerAnnotation', 'updateLayerAnnotation', 'deleteLayerAnnotation',
                        'toggleAnnotationVisibility', 'updateAnnotationSortOrder'
                    ]
                ]);
                break;
        }
    } elseif ($_SERVER["REQUEST_METHOD"] == "GET") {
        $action = $_GET['action'] ?? '';
        error_log("GET action received: " . $action);
        
        switch ($action) {
            case 'getAllRecords':
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $size = isset($_GET['size']) ? intval($_GET['size']) : 12;
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                $records = $cemeteryServices->getAllRecords($page, $size, $search);
                $total = $cemeteryServices->countAllRecords($search);
                $totalPages = $size > 0 ? (int)ceil($total / $size) : 1;
                echo json_encode([
                    'success' => true,
                    'data' => $records,
                    'meta' => [
                        'page' => $page,
                        'size' => $size,
                        'total' => $total,
                        'totalPages' => $totalPages,
                        'search' => $search
                    ]
                ]);
                exit;
      
            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid action',
                    'available_actions' => [
                        'getAllRecords', 'getRoads', 'getBurialRecords', 
                    ]
                ]);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Method not allowed',
            'allowed_methods' => ['GET', 'POST']
        ]);
    }
});
?>

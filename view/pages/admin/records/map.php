<?php
require_once '../../../components/render.php';

// Use the new clean approach
renderPage(__DIR__ . '/map_content.php', [
    'page_js' => ['map.js', 'road.js', 'layer.js', 'modal.js', 'grave.js']
]);
?>

<?php
require_once '../../../components/render.php';

// Use the new clean approach
renderPage(__DIR__ . '/map_content.php', [
    'page_js' => ['js/map.js', 'js/road.js', 'js/layer.js', 'js/grave.js']
]);
?>

<?php
/**
 * Data Upload Handler for Lotto Application
 * Saves draw data to server for backup and sync purposes
 * 
 * Endpoint: /api-upload-draws.php
 * Method: POST
 * Content-Type: application/json
 */

// Enable error reporting (disable in production)
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Validate required fields
if (empty($data['gameType']) || empty($data['draws']) || !is_array($data['draws'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: gameType, draws']);
    exit;
}

$gameType = $data['gameType'];
$draws = $data['draws'];
$timestamp = $data['timestamp'] ?? date('c');
$source = $data['source'] ?? 'unknown';

// Validate game type
if (!in_array($gameType, ['eurojackpot', 'lotto'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid gameType']);
    exit;
}

// Create server backup directory (if writable)
$backupDir = __DIR__ . '/server-backups';
$drawsDataDir = __DIR__ . '/data';

// Try to create directories if they don't exist
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}
if (!is_dir($drawsDataDir)) {
    @mkdir($drawsDataDir, 0755, true);
}

// Determine filenames
$filename = $gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json';
$filepath = $drawsDataDir . '/' . $filename;
$backupName = $gameType . '_draws_' . str_replace([':', '-'], '', $timestamp) . '.json';
$backupPath = $backupDir . '/' . $backupName;

$response = [
    'success' => false,
    'message' => '',
    'details' => [
        'gameType' => $gameType,
        'drawsCount' => count($draws),
        'timestamp' => $timestamp,
        'source' => $source
    ]
];

try {
    // Create backup of existing file if it exists
    if (file_exists($filepath)) {
        $existingData = file_get_contents($filepath);
        if (@file_put_contents($backupPath, $existingData)) {
            $response['details']['backup'] = [
                'name' => $backupName,
                'size' => strlen($existingData)
            ];
        }
    }

    // Write new data
    $jsonData = json_encode($draws, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    if (@file_put_contents($filepath, $jsonData)) {
        $response['success'] = true;
        $response['message'] = "Successfully saved {$gameType} draws to server";
        $response['details']['saved'] = [
            'filepath' => $filepath,
            'size' => strlen($jsonData)
        ];
        http_response_code(200);
    } else {
        throw new Exception("Cannot write to {$filepath} - check permissions");
    }
} catch (Exception $e) {
    http_response_code(500);
    $response['error'] = $e->getMessage();
    $response['message'] = 'Failed to save data';
}

echo json_encode($response);
?>

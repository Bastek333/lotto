<?php
/**
 * Draws Data Reader for Lotto Application
 * Returns saved draw data from server-side JSON files
 *
 * Endpoint: /api-draws.php
 * Method: GET
 * Query: ?gameType=eurojackpot|lotto
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$gameType = isset($_GET['gameType']) ? $_GET['gameType'] : 'eurojackpot';
if (!in_array($gameType, ['eurojackpot', 'lotto'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid gameType']);
    exit;
}

$filename = $gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json';
$primaryPath = __DIR__ . '/' . $filename;
$legacyPath = __DIR__ . '/data/' . $filename;
$filepath = file_exists($primaryPath) ? $primaryPath : $legacyPath;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Draws file not found',
        'expected' => [$primaryPath, $legacyPath]
    ]);
    exit;
}

$data = file_get_contents($filepath);
if ($data === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Cannot read draws file']);
    exit;
}

// Validate JSON before returning
$decoded = json_decode($data, true);
if (!is_array($decoded)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Corrupted draws file']);
    exit;
}

echo $data;
?>

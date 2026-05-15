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
$legacyDrawsDataDir = __DIR__ . '/data';

// Try to create directories if they don't exist
if (!is_dir($backupDir)) {
    @mkdir($backupDir, 0755, true);
}
if (!is_dir($legacyDrawsDataDir)) {
    @mkdir($legacyDrawsDataDir, 0755, true);
}

// Determine filenames
$filename = $gameType === 'eurojackpot' ? 'eurojackpot_draws.json' : 'lotto_draws.json';
$filepath = __DIR__ . '/' . $filename;
$legacyFilepath = $legacyDrawsDataDir . '/' . $filename;
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

function normalizeDrawCollection($raw): array {
    if (is_array($raw) && isset($raw['draws']) && is_array($raw['draws'])) {
        return $raw['draws'];
    }
    return is_array($raw) ? $raw : [];
}

function drawCompletenessScore(array $draw): int {
    $mainCount = isset($draw['numbers']) && is_array($draw['numbers']) ? count($draw['numbers']) : 0;
    $euroCount = isset($draw['euroNumbers']) && is_array($draw['euroNumbers']) ? count($draw['euroNumbers']) : 0;
    return ($mainCount * 100) + $euroCount;
}

function mergeDrawsByDate(array $existingDraws, array $incomingDraws): array {
    $merged = [];

    foreach ($existingDraws as $draw) {
        if (!is_array($draw) || empty($draw['drawDate'])) {
            continue;
        }
        $merged[$draw['drawDate']] = $draw;
    }

    foreach ($incomingDraws as $draw) {
        if (!is_array($draw) || empty($draw['drawDate'])) {
            continue;
        }

        $dateKey = $draw['drawDate'];
        if (!isset($merged[$dateKey])) {
            $merged[$dateKey] = $draw;
            continue;
        }

        $existingScore = drawCompletenessScore($merged[$dateKey]);
        $incomingScore = drawCompletenessScore($draw);
        if ($incomingScore >= $existingScore) {
            $merged[$dateKey] = array_merge($merged[$dateKey], $draw);
        }
    }

    $mergedDraws = array_values($merged);
    usort($mergedDraws, function ($a, $b) {
        return strtotime($b['drawDate']) <=> strtotime($a['drawDate']);
    });

    return $mergedDraws;
}

try {
    // Create backup of existing file if it exists (primary or legacy path)
    $existingFileForBackup = file_exists($filepath) ? $filepath : $legacyFilepath;
    if (file_exists($existingFileForBackup)) {
        $existingData = file_get_contents($existingFileForBackup);
        if (@file_put_contents($backupPath, $existingData)) {
            $response['details']['backup'] = [
                'name' => $backupName,
                'size' => strlen($existingData)
            ];
        }
    }

    $existingRaw = [];
    $existingPath = file_exists($filepath) ? $filepath : $legacyFilepath;
    if (file_exists($existingPath)) {
        $decoded = json_decode(file_get_contents($existingPath), true);
        if (is_array($decoded)) {
            $existingRaw = $decoded;
        }
    }

    $existingDraws = normalizeDrawCollection($existingRaw);
    $mergedDraws = mergeDrawsByDate($existingDraws, $draws);

    // Write merged data with metadata so the app can fetch incrementally next time
    $payload = [
        'meta' => [
            'gameType' => $gameType,
            'lastFetchedAt' => $timestamp,
            'drawsCount' => count($mergedDraws),
            'source' => $source
        ],
        'draws' => $mergedDraws
    ];

    $jsonData = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
    if (@file_put_contents($filepath, $jsonData)) {
        $response['success'] = true;
        $response['message'] = "Successfully saved {$gameType} draws to server";
        $response['details']['saved'] = [
            'filepath' => $filepath,
            'size' => strlen($jsonData)
        ];
        $response['details']['merged'] = [
            'existingCount' => count($existingDraws),
            'incomingCount' => count($draws),
            'resultCount' => count($mergedDraws)
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

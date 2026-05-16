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
$parentPath = dirname(__DIR__) . '/' . $filename;

function getFreshestExistingPath(array $paths): ?string {
    $freshestPath = null;
    $freshestMTime = -1;

    foreach ($paths as $path) {
        if (!file_exists($path)) {
            continue;
        }

        $mtime = @filemtime($path);
        if ($mtime === false) {
            $mtime = 0;
        }

        if ($freshestPath === null || $mtime > $freshestMTime) {
            $freshestPath = $path;
            $freshestMTime = $mtime;
        }
    }

    return $freshestPath;
}

$candidatePaths = array_values(array_unique([$primaryPath, $legacyPath, $parentPath]));
$filepath = getFreshestExistingPath($candidatePaths);

if ($filepath === null || !file_exists($filepath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Draws file not found',
        'expected' => $candidatePaths
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

if (isset($decoded['draws']) && is_array($decoded['draws'])) {
    $lastFetchedAt = $decoded['meta']['lastFetchedAt'] ?? date('c', filemtime($filepath));
    echo json_encode([
        'meta' => [
            'gameType' => $gameType,
            'lastFetchedAt' => $lastFetchedAt,
            'source' => $decoded['meta']['source'] ?? 'server-json'
        ],
        'draws' => $decoded['draws']
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$lastFetchedAt = date('c', filemtime($filepath));
echo json_encode([
    'meta' => [
        'gameType' => $gameType,
        'lastFetchedAt' => $lastFetchedAt,
        'source' => 'legacy-array'
    ],
    'draws' => $decoded
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>

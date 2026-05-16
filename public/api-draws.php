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
$combinedFilename = 'lottery_draws.json';
$combinedPrimaryPath = __DIR__ . '/' . $combinedFilename;
$combinedLegacyPath = __DIR__ . '/data/' . $combinedFilename;
$combinedParentPath = dirname(__DIR__) . '/' . $combinedFilename;

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

function normalizeDrawCollection($raw): array {
    if (is_array($raw) && isset($raw['draws']) && is_array($raw['draws'])) {
        return $raw['draws'];
    }
    return is_array($raw) ? $raw : [];
}

function resolveGameDataFromCombined(array $combinedPayload, string $gameType): ?array {
    if (!isset($combinedPayload['games']) || !is_array($combinedPayload['games'])) {
        return null;
    }

    if (!isset($combinedPayload['games'][$gameType]) || !is_array($combinedPayload['games'][$gameType])) {
        return null;
    }

    $gamePayload = $combinedPayload['games'][$gameType];
    $draws = normalizeDrawCollection($gamePayload);
    $meta = [];
    if (isset($gamePayload['meta']) && is_array($gamePayload['meta'])) {
        $meta = $gamePayload['meta'];
    }

    return [
        'meta' => $meta,
        'draws' => $draws
    ];
}

$candidatePaths = array_values(array_unique([$primaryPath, $legacyPath, $parentPath]));
$filepath = getFreshestExistingPath($candidatePaths);
$combinedCandidatePaths = array_values(array_unique([$combinedPrimaryPath, $combinedLegacyPath, $combinedParentPath]));
$combinedFilepath = getFreshestExistingPath($combinedCandidatePaths);

$selectedFilepath = $filepath;
$useCombinedPayload = false;
if ($combinedFilepath !== null && file_exists($combinedFilepath)) {
    if ($selectedFilepath === null || @filemtime($combinedFilepath) > @filemtime($selectedFilepath)) {
        $selectedFilepath = $combinedFilepath;
        $useCombinedPayload = true;
    }
}

if ($selectedFilepath === null || !file_exists($selectedFilepath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Draws file not found',
        'expected' => array_values(array_unique(array_merge($candidatePaths, $combinedCandidatePaths)))
    ]);
    exit;
}

$data = file_get_contents($selectedFilepath);
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

if ($useCombinedPayload) {
    $resolved = resolveGameDataFromCombined($decoded, $gameType);
    if ($resolved !== null && is_array($resolved['draws'])) {
        $lastFetchedAt = $resolved['meta']['lastFetchedAt'] ?? date('c', filemtime($selectedFilepath));
        echo json_encode([
            'meta' => [
                'gameType' => $gameType,
                'lastFetchedAt' => $lastFetchedAt,
                'source' => $resolved['meta']['source'] ?? 'combined-server-json'
            ],
            'draws' => $resolved['draws']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (isset($decoded['draws']) && is_array($decoded['draws'])) {
    $lastFetchedAt = $decoded['meta']['lastFetchedAt'] ?? date('c', filemtime($selectedFilepath));
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

$lastFetchedAt = date('c', filemtime($selectedFilepath));
echo json_encode([
    'meta' => [
        'gameType' => $gameType,
        'lastFetchedAt' => $lastFetchedAt,
        'source' => 'legacy-array'
    ],
    'draws' => $decoded
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>

<?php
/**
 * save.php — Café Solna admin write endpoint
 *
 * Security:
 *  - Requires X-Admin-Token header (set ADMIN_TOKEN env, default "cafe2025")
 *  - CORS limited to allow-listed origins
 *  - Payload size limited (32 KB)
 *  - Strict input validation, JSON stored raw (NO htmlspecialchars on JSON)
 *  - Writes are atomic (tmp file + rename)
 */

declare(strict_types=1);

// ---------- Config ----------
$ADMIN_TOKEN = getenv('ADMIN_TOKEN') ?: 'cafe2025';
$ALLOWED_ORIGINS = [
  'https://lkwd.se',
  'https://www.lkwd.se',
  'https://cafe-solna.lkwd.se',
];
$MAX_BODY_BYTES = 32 * 1024;

// ---------- CORS ----------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
header('Access-Control-Max-Age: 600');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Only POST allowed']);
  exit;
}

// ---------- Auth ----------
$provided = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
if (!is_string($provided) || !hash_equals($ADMIN_TOKEN, $provided)) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Unauthorized']);
  exit;
}

// ---------- Read & size-limit body ----------
$raw = file_get_contents('php://input', false, null, 0, $MAX_BODY_BYTES + 1);
if ($raw === false || strlen($raw) > $MAX_BODY_BYTES) {
  http_response_code(413);
  echo json_encode(['success' => false, 'message' => 'Payload too large']);
  exit;
}

$body = json_decode($raw, true);
if (!is_array($body) || !isset($body['action'], $body['data'])) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Invalid request']);
  exit;
}

$action = $body['action'];
$data   = $body['data'];

// ---------- Storage ----------
$dataDir = __DIR__ . '/../data/';
if (!is_dir($dataDir) && !mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Data directory unavailable']);
  exit;
}
if (!is_writable($dataDir)) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Data directory not writable']);
  exit;
}

function atomic_write(string $path, string $contents): bool {
  $tmp = $path . '.tmp.' . bin2hex(random_bytes(4));
  if (file_put_contents($tmp, $contents, LOCK_EX) === false) return false;
  @chmod($tmp, 0644);
  return rename($tmp, $path);
}

function s(string $v, int $max): string {
  // Trim, enforce max length, strip control chars
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', trim($v));
  return mb_substr($v, 0, $max);
}

// ---------- Actions ----------
if ($action === 'settings') {
  if (
    !isset($data['lunch']['description'], $data['lunch']['price']) ||
    !isset($data['reviews']) || !is_array($data['reviews'])
  ) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid settings structure']);
    exit;
  }
  if (count($data['reviews']) > 20) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Too many reviews']);
    exit;
  }

  $clean = [
    'lunch' => [
      'description' => s((string)$data['lunch']['description'], 300),
      'price'       => s((string)$data['lunch']['price'], 30),
    ],
    'reviews' => [],
  ];
  foreach ($data['reviews'] as $r) {
    if (!is_array($r)) continue;
    $clean['reviews'][] = [
      'text'  => s((string)($r['text']  ?? ''), 500),
      'name'  => s((string)($r['name']  ?? ''), 80),
      'title' => s((string)($r['title'] ?? ''), 80),
    ];
  }

  $ok = atomic_write(
    $dataDir . 'settings.json',
    json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  );
  echo json_encode(['success' => $ok, 'message' => $ok ? 'Settings saved' : 'Write failed']);
  exit;
}

if ($action === 'badges') {
  if (!is_array($data) || count($data) > 50) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid badges structure']);
    exit;
  }
  $allowed = ['popular', 'bestseller'];
  $clean = [];
  foreach ($data as $product => $info) {
    if (!is_string($product) || !is_array($info)) continue;
    if (!isset($info['type'], $info['id'])) continue;
    if (!in_array($info['type'], $allowed, true)) continue;
    $key = s((string)$product, 80);
    if ($key === '') continue;
    $clean[$key] = [
      'type' => $info['type'],
      'id'   => s((string)$info['id'], 40),
    ];
  }

  $ok = atomic_write(
    $dataDir . 'badges.json',
    json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  );
  echo json_encode(['success' => $ok, 'message' => $ok ? 'Badges saved' : 'Write failed']);
  exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unknown action']);

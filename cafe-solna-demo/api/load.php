<?php
/**
 * load.php — Café Solna public read endpoint
 * Read-only; serves settings + badges JSON with safe defaults.
 */

declare(strict_types=1);

$ALLOWED_ORIGINS = [
  'https://lkwd.se',
  'https://www.lkwd.se',
  'https://cafe-solna.lkwd.se',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
} else {
  // Public read: allow same-origin / direct fetches without echoing arbitrary origins
  header('Access-Control-Allow-Origin: *');
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: public, max-age=60');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'HEAD') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Only GET allowed']);
  exit;
}

$dataDir      = __DIR__ . '/../data/';
$settingsFile = $dataDir . 'settings.json';
$badgesFile   = $dataDir . 'badges.json';

$defaultSettings = [
  'lunch' => [
    'description' => 'Grillad lax med örtcrème fraiche, pressad potatis och sallad',
    'price'       => '125:-'
  ],
  'reviews' => [
    ['text' => 'Bästa cafét i Solna! Fantastiskt kaffe och otroligt goda bakverk.', 'name' => 'Maria, Solna',     'title' => 'Återkommande gäst'],
    ['text' => 'Älskar deras veckas lunch! God mat till bra pris.',                 'name' => 'Johan, Stockholm', 'title' => 'Lunchgäst'],
    ['text' => 'Mysigaste cafét. Bra arbetsplats, god fika och härlig atmosfär.',   'name' => 'Anna, Sundbyberg', 'title' => 'Jobbar på distans']
  ]
];

$defaultBadges = [
  'Bryggkaffe'      => ['type' => 'popular',    'id' => 'pop1'],
  'Cappuccino'      => ['type' => 'bestseller', 'id' => 'pop2'],
  'Kardemummabulle' => ['type' => 'popular',    'id' => 'pop3'],
  'Dagens soppa'    => ['type' => 'bestseller', 'id' => 'pop4']
];

function safe_read_json(string $path, array $fallback): array {
  if (!is_file($path) || !is_readable($path)) return $fallback;
  $raw = file_get_contents($path);
  if ($raw === false) return $fallback;
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : $fallback;
}

$settings = safe_read_json($settingsFile, $defaultSettings);
$badges   = safe_read_json($badgesFile,   $defaultBadges);

echo json_encode([
  'success'  => true,
  'settings' => $settings,
  'badges'   => $badges,
], JSON_UNESCAPED_UNICODE);

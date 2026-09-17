<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::first();
if ($user) {
    auth()->login($user);
}

$request = Illuminate\Http\Request::create('/apt/attendance', 'GET');
$response = $kernel->handle($request);

$content = $response->getContent();
preg_match('/data-page="([^"]+)"/', $content, $matches);
if (isset($matches[1])) {
    $page = json_decode(htmlspecialchars_decode($matches[1]), true);
    echo "Inertia Component: " . ($page['component'] ?? 'None') . "\n";
    echo "Props keys: " . implode(', ', array_keys($page['props'] ?? [])) . "\n";
} else {
    echo "No data-page found!\n";
}

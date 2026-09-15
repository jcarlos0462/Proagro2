<?php
$env = parse_ini_file(__DIR__ . '/.env');
$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$database = $env['DB_DATABASE'] ?? 'u174025152_vecode_v3';
$username = $env['DB_USERNAME'] ?? 'u174025152_Vecode_2026';
$password = $env['DB_PASSWORD'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database`");
    echo "Database created successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

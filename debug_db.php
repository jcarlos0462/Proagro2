<?php
$env = parse_ini_file(__DIR__ . '/.env');
$mysqli = new mysqli(
    $env['DB_HOST'] ?? '127.0.0.1',
    $env['DB_USERNAME'] ?? '',
    $env['DB_PASSWORD'] ?? '',
    $env['DB_DATABASE'] ?? ''
);

if ($mysqli->connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli->connect_error . "\n";
} else {
    echo "Connected to MySQL database " . ($env['DB_DATABASE'] ?? '') . "\n";
    queryVessels($mysqli);
}

function queryVessels($mysqli)
{
    $result = $mysqli->query("SELECT id, name FROM vessels");
    while ($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . " - Name: " . $row['name'] . "\n";
    }
}

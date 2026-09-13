<?php
// Configurações do Banco de Dados
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Altere no InfinityFree (ex: epiz_12345678)
define('DB_PASS', '');     // Altere no InfinityFree
define('DB_NAME', 'readverse_wiki'); // Altere no InfinityFree (ex: epiz_12345678_readverse)

// Inicia sessão global
session_start();

// Configura fuso horário
date_default_timezone_set('America/Sao_Paulo');

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $db = new PDO($dsn, DB_USER, DB_PASS);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Se o banco não existir, retorna a exceção
            throw $e;
        }
    }
    return $db;
}

// Resposta JSON padrão
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Resposta de erro JSON
function jsonError($message, $status = 400) {
    jsonResponse(['error' => $message], $status);
}

<?php
require_once 'config.php';

// Apenas usuários logados e com permissão (exceto avatars) podem fazer upload
if (!isset($_SESSION['user'])) {
    jsonError('Não autorizado', 401);
}
$user = $_SESSION['user'];
$canEdit = ($user['role'] === 'admin' || $user['editorPermission']);

$type = $_POST['type'] ?? 'general';

if ($type !== 'avatar' && !$canEdit) {
    jsonError('Sem permissão para upload', 403);
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    jsonError('Nenhum arquivo ou erro no envio.');
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// Validações de segurança
$allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if (!in_array($ext, $allowedExts)) {
    jsonError('Apenas imagens (JPG, PNG, GIF, WEBP) são permitidas.');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
if (strpos($mime, 'image/') !== 0) {
    jsonError('O arquivo não é uma imagem válida.');
}

// Limite 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    jsonError('A imagem deve ter no máximo 5MB.');
}

$uploadDir = '../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Gera nome único
$filename = uniqid($type . '_') . '.' . $ext;
$dest = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $dest)) {
    // Retorna URL relativa ao root
    jsonResponse(['url' => 'uploads/' . $filename]);
} else {
    jsonError('Falha ao mover arquivo.');
}

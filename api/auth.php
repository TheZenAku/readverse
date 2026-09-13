<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'register') {
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (!$name || !$email || strlen($password) < 6) {
            jsonError('Dados inválidos. A senha deve ter no mínimo 6 caracteres.');
        }

        // Verifica se email já existe
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            jsonError('Este email já está em uso.', 409);
        }

        // Verifica se é o primeiro usuário (será admin)
        $stmt = $db->query("SELECT COUNT(*) FROM users");
        $count = $stmt->fetchColumn();
        $role = ($count == 0) ? 'admin' : 'member';
        $editor = ($role === 'admin') ? 1 : 0;

        $uid = bin2hex(random_bytes(16)); // Gera um UID único simulando o Firebase
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $db->prepare("INSERT INTO users (uid, email, password_hash, display_name, role, editor_permission) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$uid, $email, $hash, $name, $role, $editor])) {
            $user = [
                'uid' => $uid,
                'email' => $email,
                'displayName' => $name,
                'role' => $role,
                'editorPermission' => (bool)$editor,
                'photoURL' => null,
                'bio' => ''
            ];
            $_SESSION['user'] = $user;
            jsonResponse(['user' => $user]);
        } else {
            jsonError('Erro ao criar conta.');
        }
    }

    if ($action === 'login') {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $userData = [
                'uid' => $user['uid'],
                'email' => $user['email'],
                'displayName' => $user['display_name'],
                'role' => $user['role'],
                'editorPermission' => (bool)$user['editor_permission'],
                'photoURL' => $user['photo_url'],
                'bio' => $user['bio']
            ];
            $_SESSION['user'] = $userData;
            jsonResponse(['user' => $userData]);
        } else {
            jsonError('Email ou senha incorretos.', 401);
        }
    }

    if ($action === 'logout') {
        session_destroy();
        jsonResponse(['success' => true]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'session') {
        if (isset($_SESSION['user'])) {
            // Recarrega os dados do banco para garantir que estão atualizados (ex: permissões)
            $stmt = $db->prepare("SELECT * FROM users WHERE uid = ?");
            $stmt->execute([$_SESSION['user']['uid']]);
            $user = $stmt->fetch();
            if ($user) {
                $_SESSION['user'] = [
                    'uid' => $user['uid'],
                    'email' => $user['email'],
                    'displayName' => $user['display_name'],
                    'role' => $user['role'],
                    'editorPermission' => (bool)$user['editor_permission'],
                    'photoURL' => $user['photo_url'],
                    'bio' => $user['bio']
                ];
                jsonResponse(['user' => $_SESSION['user']]);
            } else {
                session_destroy();
                jsonResponse(['user' => null]);
            }
        } else {
            jsonResponse(['user' => null]);
        }
    }
}

jsonError('Ação inválida', 400);

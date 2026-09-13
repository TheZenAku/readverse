<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$db = getDB();
$user = $_SESSION['user'] ?? null;

// Helper de autorização
function requireAuth() {
    global $user;
    if (!$user) jsonError('Não autenticado', 401);
}
function canEdit() {
    global $user;
    return $user && ($user['role'] === 'admin' || $user['editorPermission']);
}
function requireEdit() {
    if (!canEdit()) jsonError('Permissão negada', 403);
}

// ─── ARTICLES ─────────────────────────────────────────

if ($action === 'getArticles') {
    $cat = $_GET['category'] ?? null;
    $limit = (int)($_GET['limit'] ?? 20);
    $sql = "SELECT * FROM articles";
    $params = [];
    if ($cat) {
        $sql .= " WHERE category = ?";
        $params[] = $cat;
    }
    $sql .= " ORDER BY created_at DESC LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    
    // Converte de volta os nomes para o padrão JS
    $res = array_map(function($r) {
        return [
            'id' => $r['id'],
            'title' => $r['title'],
            'excerpt' => $r['excerpt'],
            'category' => $r['category'],
            'content' => $r['content'],
            'coverURL' => $r['cover_url'],
            'createdBy' => $r['created_by_uid'],
            'createdByName' => $r['created_by_name'],
            'createdAt' => $r['created_at'],
            'views' => $r['views']
        ];
    }, $rows);
    jsonResponse($res);
}

if ($action === 'getArticle') {
    $id = $_GET['id'] ?? null;
    $stmt = $db->prepare("SELECT * FROM articles WHERE id = ?");
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    if (!$r) jsonResponse(null);
    jsonResponse([
        'id' => $r['id'],
        'title' => $r['title'],
        'excerpt' => $r['excerpt'],
        'category' => $r['category'],
        'content' => $r['content'],
        'coverURL' => $r['cover_url'],
        'createdBy' => $r['created_by_uid'],
        'createdByName' => $r['created_by_name'],
        'createdAt' => $r['created_at'],
        'updatedByName' => $r['updated_by_name'],
        'views' => $r['views'],
        'sections' => json_decode($r['sections_json'] ?? '[]')
    ]);
}

if ($action === 'saveArticle') {
    requireEdit();
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $sections = json_encode($data['sections'] ?? []);
    
    if ($id) {
        $stmt = $db->prepare("UPDATE articles SET title=?, excerpt=?, category=?, content=?, status=?, cover_url=?, updated_by_uid=?, updated_by_name=?, sections_json=? WHERE id=?");
        $stmt->execute([$data['title'], $data['excerpt'], $data['category'], $data['content'], $data['status'], $data['coverURL'], $user['uid'], $user['displayName'], $sections, $id]);
        jsonResponse(['id' => $id]);
    } else {
        $stmt = $db->prepare("INSERT INTO articles (title, excerpt, category, content, status, cover_url, created_by_uid, created_by_name, sections_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['title'], $data['excerpt'], $data['category'], $data['content'], $data['status'], $data['coverURL'], $user['uid'], $user['displayName'], $sections]);
        jsonResponse(['id' => $db->lastInsertId()]);
    }
}

if ($action === 'deleteArticle') {
    requireEdit();
    $id = $_GET['id'] ?? null;
    $db->prepare("DELETE FROM articles WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true]);
}

if ($action === 'incrementViews') {
    $id = $_GET['id'] ?? null;
    $db->prepare("UPDATE articles SET views = views + 1 WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true]);
}

// ─── CHARACTERS ───────────────────────────────────────

if ($action === 'getCharacters') {
    $limit = (int)($_GET['limit'] ?? 30);
    $stmt = $db->prepare("SELECT * FROM characters ORDER BY name ASC LIMIT $limit");
    $stmt->execute();
    $rows = $stmt->fetchAll();
    $res = array_map(function($r) {
        return [
            'id' => $r['id'],
            'name' => $r['name'],
            'role' => $r['role'],
            'status' => $r['status'],
            'species' => $r['species'],
            'imageURL' => $r['image_url'],
            'tags' => json_decode($r['tags_json'] ?? '[]')
        ];
    }, $rows);
    jsonResponse($res);
}

if ($action === 'getCharacter') {
    $id = $_GET['id'] ?? null;
    $stmt = $db->prepare("SELECT * FROM characters WHERE id = ?");
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    if (!$r) jsonResponse(null);
    jsonResponse([
        'id' => $r['id'],
        'name' => $r['name'],
        'role' => $r['role'],
        'status' => $r['status'],
        'species' => $r['species'],
        'gender' => $r['gender'],
        'age' => $r['age'],
        'birthdate' => $r['birthdate'],
        'affiliation' => $r['affiliation'],
        'occupation' => $r['occupation'],
        'abilities' => $r['abilities'],
        'firstAppear' => $r['first_appear'],
        'biography' => $r['biography'],
        'imageURL' => $r['image_url'],
        'createdByName' => $r['created_by_name'],
        'createdAt' => $r['created_at'],
        'updatedByName' => $r['updated_by_name'],
        'sections' => json_decode($r['sections_json'] ?? '[]'),
        'tags' => json_decode($r['tags_json'] ?? '[]'),
        'gallery' => json_decode($r['gallery_json'] ?? '[]')
    ]);
}

if ($action === 'saveCharacter') {
    requireEdit();
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $sections = json_encode($data['sections'] ?? []);
    $tags = json_encode($data['tags'] ?? []);
    $gallery = json_encode($data['gallery'] ?? []);
    
    if ($id) {
        $stmt = $db->prepare("UPDATE characters SET name=?, role=?, status=?, species=?, gender=?, age=?, birthdate=?, affiliation=?, occupation=?, abilities=?, first_appear=?, biography=?, image_url=?, updated_by_uid=?, updated_by_name=?, sections_json=?, tags_json=?, gallery_json=? WHERE id=?");
        $stmt->execute([$data['name'], $data['role'], $data['status'], $data['species'], $data['gender'], $data['age'], $data['birthdate'], $data['affiliation'], $data['occupation'], $data['abilities'], $data['firstAppear'], $data['biography'], $data['imageURL'], $user['uid'], $user['displayName'], $sections, $tags, $gallery, $id]);
        jsonResponse(['id' => $id]);
    } else {
        $stmt = $db->prepare("INSERT INTO characters (name, role, status, species, gender, age, birthdate, affiliation, occupation, abilities, first_appear, biography, image_url, created_by_uid, created_by_name, sections_json, tags_json, gallery_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['role'], $data['status'], $data['species'], $data['gender'], $data['age'], $data['birthdate'], $data['affiliation'], $data['occupation'], $data['abilities'], $data['firstAppear'], $data['biography'], $data['imageURL'], $user['uid'], $user['displayName'], $sections, $tags, $gallery]);
        jsonResponse(['id' => $db->lastInsertId()]);
    }
}

if ($action === 'deleteCharacter') {
    requireEdit();
    $id = $_GET['id'] ?? null;
    $db->prepare("DELETE FROM characters WHERE id = ?")->execute([$id]);
    jsonResponse(['success' => true]);
}

// ─── CATEGORIES ───────────────────────────────────────

if ($action === 'getCategories') {
    $stmt = $db->query("SELECT * FROM categories ORDER BY name");
    jsonResponse($stmt->fetchAll());
}

if ($action === 'saveCategory') {
    requireEdit();
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'];
    $slug = $data['slug'];
    $stmt = $db->prepare("SELECT id FROM categories WHERE slug = ?");
    $stmt->execute([$slug]);
    if ($row = $stmt->fetch()) {
        jsonResponse(['id' => $row['id']]);
    } else {
        $stmt = $db->prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
        $stmt->execute([$name, $slug]);
        jsonResponse(['id' => $db->lastInsertId()]);
    }
}

// ─── MEMBERS ──────────────────────────────────────────

if ($action === 'getMembers') {
    $stmt = $db->query("SELECT uid, display_name as displayName, email, photo_url as photoURL, role, editor_permission as editorPermission, joined_at as joinedAt FROM users ORDER BY joined_at ASC");
    jsonResponse($stmt->fetchAll());
}

if ($action === 'getMember') {
    $uid = $_GET['uid'] ?? null;
    $stmt = $db->prepare("SELECT uid, display_name as displayName, email, photo_url as photoURL, role, editor_permission as editorPermission, joined_at as joinedAt, bio FROM users WHERE uid = ?");
    $stmt->execute([$uid]);
    jsonResponse($stmt->fetch());
}

if ($action === 'updateMemberPermission') {
    if (!$user || $user['role'] !== 'admin') jsonError('Apenas admins', 403);
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE users SET editor_permission = ? WHERE uid = ?");
    $stmt->execute([(int)$data['editorPermission'], $data['uid']]);
    jsonResponse(['success' => true]);
}

if ($action === 'updateProfile') {
    requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    if ($data['uid'] !== $user['uid'] && $user['role'] !== 'admin') jsonError('Não permitido', 403);
    
    // Atualiza apenas a bio
    if (isset($data['bio'])) {
        $stmt = $db->prepare("UPDATE users SET bio = ? WHERE uid = ?");
        $stmt->execute([$data['bio'], $data['uid']]);
    }
    // Atualiza apenas a foto
    if (isset($data['photoURL'])) {
        $stmt = $db->prepare("UPDATE users SET photo_url = ? WHERE uid = ?");
        $stmt->execute([$data['photoURL'], $data['uid']]);
    }
    jsonResponse(['success' => true]);
}

// ─── SEARCH ───────────────────────────────────────────

if ($action === 'search') {
    $q = $_GET['q'] ?? '';
    if (strlen($q) < 2) jsonResponse([]);
    $like = '%' . $q . '%';
    
    $stmtA = $db->prepare("SELECT id, title FROM articles WHERE title LIKE ? LIMIT 5");
    $stmtA->execute([$like]);
    $arts = $stmtA->fetchAll();
    
    $stmtC = $db->prepare("SELECT id, name FROM characters WHERE name LIKE ? LIMIT 5");
    $stmtC->execute([$like]);
    $chars = $stmtC->fetchAll();
    
    $res = [];
    foreach ($arts as $a) $res[] = ['id' => $a['id'], 'type' => 'article', 'title' => $a['title'], 'url' => 'article.html?id=' . $a['id']];
    foreach ($chars as $c) $res[] = ['id' => $c['id'], 'type' => 'character', 'title' => $c['name'], 'url' => 'character.html?id=' . $c['id']];
    jsonResponse($res);
}

jsonError('Ação inválida', 400);

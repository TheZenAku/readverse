<?php
require_once 'config.php';

// Ativar exibição de erros para o setup
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    // Tenta conectar no MySQL sem especificar o banco primeiro
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Cria o banco se não existir (no InfinityFree isso costuma falhar pois o banco precisa ser criado no cPanel, mas é bom ter para testes locais)
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "`");
    $pdo->exec("USE `" . DB_NAME . "`");

    // Cria as tabelas
    $sql = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        photo_url VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member',
        editor_permission BOOLEAN DEFAULT FALSE,
        bio TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        excerpt TEXT,
        category VARCHAR(255),
        content LONGTEXT,
        status VARCHAR(50) DEFAULT 'published',
        cover_url VARCHAR(255),
        created_by_uid VARCHAR(255),
        created_by_name VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by_uid VARCHAR(255),
        updated_by_name VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        views INT DEFAULT 0,
        sections_json JSON
    );

    CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        status VARCHAR(50),
        species VARCHAR(255),
        gender VARCHAR(255),
        age VARCHAR(255),
        birthdate VARCHAR(255),
        affiliation VARCHAR(255),
        occupation VARCHAR(255),
        abilities VARCHAR(255),
        first_appear VARCHAR(255),
        biography TEXT,
        image_url VARCHAR(255),
        created_by_uid VARCHAR(255),
        created_by_name VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by_uid VARCHAR(255),
        updated_by_name VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        sections_json JSON,
        tags_json JSON,
        gallery_json JSON
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL
    );
    ";

    $pdo->exec($sql);

    echo "<h1 style='color:green'>Instalação concluída com sucesso!</h1>";
    echo "<p>Banco de dados <strong>" . DB_NAME . "</strong> e tabelas criadas.</p>";
    echo "<p>Por favor, apague ou renomeie este arquivo <code>setup.php</code> por segurança.</p>";
    echo "<p><a href='../index.html'>Voltar para a Wiki</a></p>";

} catch (PDOException $e) {
    echo "<h1 style='color:red'>Erro na instalação</h1>";
    echo "<p><strong>Detalhes do erro:</strong> " . $e->getMessage() . "</p>";
    echo "<h3>O que verificar:</h3>";
    echo "<ul>
            <li>As credenciais em <code>api/config.php</code> estão corretas?</li>
            <li>No InfinityFree, você precisa <strong>criar o banco de dados no cPanel</strong> (na seção MySQL Databases) antes de rodar este script.</li>
          </ul>";
}

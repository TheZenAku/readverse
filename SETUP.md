# 🚀 Guia de Configuração — Readverse Wiki

## Passo 1: Criar conta no Google / Firebase

1. Acesse **[firebase.google.com](https://firebase.google.com)**
2. Clique em **"Ir para o console"** e faça login com sua conta Google
3. Clique em **"Adicionar projeto"**
4. Nome do projeto: `readverse-wiki` (ou qualquer nome)
5. Desative o Google Analytics (opcional) → clique **"Criar projeto"**

---

## Passo 2: Configurar Authentication

1. No painel do Firebase, vá em **Authentication** → **"Primeiros passos"**
2. Clique em **"Provedores de login"**
3. Clique em **"Email/senha"** → **Habilitar** → **Salvar**

---

## Passo 3: Configurar Firestore Database

1. No painel, vá em **Firestore Database** → **"Criar banco de dados"**
2. Selecione **"Iniciar no modo de produção"** → **Avançar**
3. Escolha a região **`southamerica-east1`** (São Paulo) → **Ativar**
4. Após criado, vá em **Regras** e cole as regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuários podem ler todos os perfis
    // Só podem editar o próprio perfil
    // Admin pode editar qualquer perfil
    match /users/{userId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Artigos: leitura pública, escrita apenas para admins/editores
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.editorPermission == true);
    }
    
    // Personagens: leitura pública, escrita apenas para admins/editores
    match /characters/{charId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.editorPermission == true);
    }
    
    // Categorias: leitura pública, escrita apenas para admins/editores
    match /categories/{catId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.editorPermission == true);
    }
  }
}
```

5. Clique em **"Publicar"**

---

## Passo 4: Configurar Storage (para imagens)

1. No painel, vá em **Storage** → **"Primeiros passos"**
2. Aceite as configurações padrão
3. Vá em **Regras** e cole:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Leitura pública para todos
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        (firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.editorPermission == true ||
         request.resource.contentType.matches('image/.*') && request.auth.uid != null && allPaths.matches('avatars/.*'));
    }
  }
}
```

---

## Passo 5: Obter as credenciais do Firebase

1. No painel do Firebase, clique no ícone de engrenagem ⚙️ → **"Configurações do projeto"**
2. Role para baixo até **"Seus apps"** → Clique no ícone **`</>`** (Web)
3. Apelido do app: `readverse-wiki-web` → **"Registrar app"**
4. Copie o objeto `firebaseConfig` que aparece

---

## Passo 6: Editar o arquivo de configuração

Abra o arquivo **`js/firebase-config.js`** e substitua os valores:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← cole sua chave
  authDomain: "readverse-wiki.firebaseapp.com",
  projectId: "readverse-wiki",
  storageBucket: "readverse-wiki.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};

// Defina SEU email como admin
const ADMIN_EMAIL = "seu@email.com";  // ← troque pelo seu email!
```

---

## Passo 7: Criar sua conta de admin

1. Abra o site localmente ou no GitHub Pages
2. Vá na página de **Login** → **"Criar Conta"**
3. Use o email que você colocou em `ADMIN_EMAIL`
4. **A senha pode ser qualquer uma** — você escolhe quando criar a conta
   - Pode usar `"1+1 Readverse compartilhada 1+1"` como senha se quiser

---

## Passo 8: Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `readverse-wiki`)
2. Faça upload de todos os arquivos desta pasta
3. Vá em **Settings** → **Pages**
4. Source: **"Deploy from a branch"** → Branch: `main` → Pasta: `/ (root)`
5. Salve. Após alguns minutos, o site estará em:
   `https://SEU_USUARIO.github.io/readverse-wiki`

---

## ✅ Checklist final

- [ ] Conta Firebase criada
- [ ] Authentication (Email/senha) habilitado
- [ ] Firestore criado com as regras de segurança
- [ ] Storage criado com as regras de segurança
- [ ] `js/firebase-config.js` atualizado com suas credenciais
- [ ] `ADMIN_EMAIL` configurado com seu email
- [ ] Site publicado no GitHub Pages
- [ ] Conta de admin criada com o email configurado

---

## ❓ Problemas comuns

**"Permission denied" no Firestore**
→ Verifique se as regras de segurança foram salvas corretamente.

**Imagens não carregam**
→ Verifique as regras do Storage.

**Não consigo entrar como admin**
→ O email da conta criada deve ser exatamente igual ao `ADMIN_EMAIL` no arquivo de configuração.

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Configuração do servidor
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota para página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'entrar.html'));
});

// Rota para a página esqueceu_senha.html
app.get('/esqueceu-senha', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'esqueceu_senha.html'));
});

// Função para ler o arquivo JSON de usuários
function lerArquivoUsuarios() {
    try {
        const data = fs.readFileSync('usuarios.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erro ao ler o arquivo de usuários:', err);
        return [];
    }
}

// Função para escrever no arquivo JSON de usuários
function escreverArquivoUsuarios(usuarios) {
    try {
        fs.writeFileSync('usuarios.json', JSON.stringify(usuarios, null, 2));
    } catch (err) {
        console.error('Erro ao escrever no arquivo de usuários:', err);
    }
}

// Rota para lidar com o login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerArquivoUsuarios();
    const user = usuarios.find(user => user.email === email);
    if (user) {
        // Verifica a senha
        if (bcrypt.compareSync(password, user.password)) {
            res.redirect('/logado.html'); 
            return;
        } else {
            res.status(401).send('Credenciais inválidas.');
        }
    } else {
        res.status(401).send('Usuário não encontrado.');
    }
});

// Rota para lidar com a criação de conta
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const usuarios = lerArquivoUsuarios();
    // Verifica se o usuário já existe
    if (usuarios.some(user => user.email === email)) {
        res.status(400).send('Este email já está em uso.');
    } else {
        // Criptografa a senha
        const hashedPassword = bcrypt.hashSync(password, 10);
        // Adiciona o usuário ao array de usuários
        usuarios.push({ name, email, password: hashedPassword });
        escreverArquivoUsuarios(usuarios);
        res.send('Conta criada com sucesso!');
    }
});

// Rota para lidar com a alteração de senha
app.post('/alterar-senha', (req, res) => {
    const { email, senhaAntiga, novaSenha } = req.body;
    const usuarios = lerArquivoUsuarios();
    const userIndex = usuarios.findIndex(user => user.email === email);

    if (userIndex !== -1) {
        const user = usuarios[userIndex];
        if (bcrypt.compareSync(senhaAntiga, user.password)) {
            const hashedNovaSenha = bcrypt.hashSync(novaSenha, 10);
            usuarios[userIndex].password = hashedNovaSenha;
            escreverArquivoUsuarios(usuarios);
            res.send('Senha alterada com sucesso!');
        } else {
            res.status(401).send('Senha antiga incorreta.');
        }
    } else {
        res.status(404).send('Usuário não encontrado.');
    }
});


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

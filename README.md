# Eixo Eventos - Backend API

API backend simples para o sistema de gestão de eventos Eixo.

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Node.js 18+ (para desenvolvimento local)

### Passos para Deploy

1. **Criar o projeto:**
   ```bash
   mkdir eixo-backend
   cd eixo-backend
   ```

2. **Criar os arquivos:**
   - Copie o conteúdo de `index.js`, `package.json` e `vercel.json`
   - Cole cada um em seus respectivos arquivos

3. **Inicializar Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. **Deploy via Vercel CLI (Recomendado):**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

5. **Ou conectar ao GitHub:**
   - Faça push para um repositório GitHub
   - Conecte o repositório no dashboard da Vercel
   - A Vercel fará deploy automaticamente

### 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 📡 Endpoints da API

### Eventos
- `GET /api/eventos` - Listar eventos (com filtros opcionais)
- `GET /api/eventos/:id` - Buscar evento por ID
- `POST /api/eventos` - Criar novo evento
- `PUT /api/eventos/:id` - Atualizar evento
- `DELETE /api/eventos/:id` - Deletar evento

### Favoritos
- `GET /api/favoritos` - Listar favoritos
- `POST /api/favoritos/:id` - Adicionar aos favoritos
- `DELETE /api/favoritos/:id` - Remover dos favoritos

### Outros
- `GET /api/stats` - Estatísticas
- `GET /api/export` - Exportar dados
- `POST /api/import` - Importar dados
- `GET /` - Health check

## 🔍 Filtros Disponíveis

Todos os filtros são opcionais e podem ser combinados:

```
GET /api/eventos?categoria=musical&data=week&preco=free&search=indie
```

### Parâmetros:
- **categoria:** `cultural`, `gastronomico`, `esportivo`, `educacional`, `networking`, `musical`
- **data:** `today`, `tomorrow`, `week`, `month`
- **preco:** `free`, `0-50`, `50-100`, `100+`
- **search:** busca textual nos campos título, local, organizador, categoria, descrição

## 📝 Exemplo de Uso

### Criar Evento
```javascript
const response = await fetch('YOUR_VERCEL_URL/api/eventos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Meu Evento',
    categoria: 'cultural',
    data: '2024-12-20',
    horario: '19:00',
    local: 'Centro Cultural',
    endereco: 'Rua das Flores, 123',
    preco: 50.00,
    organizador: 'João Silva',
    telefone: '(11) 99999-9999',
    email: 'joao@email.com',
    descricao: 'Descrição do evento'
  })
});
```

### Buscar Eventos
```javascript
const response = await fetch('YOUR_VERCEL_URL/api/eventos?categoria=musical&data=week');
const data = await response.json();
console.log(data.eventos);
```

## 🔧 Configuração do Frontend

Após o deploy, atualize seu frontend para usar a URL da API:

```javascript
const API_BASE_URL = 'https://seu-projeto.vercel.app';

// Exemplo de integração
async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/eventos`);
    const data = await response.json();
    return data.eventos;
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    return [];
  }
}
```

## ⚠️ Limitações

- **Armazenamento:** Os dados são armazenados em memória e serão perdidos a cada deploy/restart
- **Para produção:** Recomenda-se usar um banco de dados (MongoDB, PostgreSQL, etc.)
- **Rate Limiting:** Não implementado (adicione se necessário)
- **Autenticação:** Não implementada (adicione se necessário)

## 🚀 Próximos Passos

Para uma aplicação em produção, considere:

1. **Banco de Dados:** MongoDB Atlas, PlanetScale, ou Supabase
2. **Autenticação:** JWT, Auth0, ou NextAuth
3. **Validação:** Joi, Yup, ou Zod
4. **Rate Limiting:** express-rate-limit
5. **Logs:** Winston ou similar
6. **Testes:** Jest ou Vitest

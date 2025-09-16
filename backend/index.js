const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (em produção, use um banco de dados)
let eventos = [
  {
    id: 'evt_sample_1',
    titulo: 'Festival de Música Indie',
    categoria: 'musical',
    data: '2024-12-15',
    horario: '19:00',
    local: 'Centro Cultural',
    endereco: 'Av. Paulista, 1000 - São Paulo, SP',
    preco: 75.00,
    descricao: 'Uma noite incrível com as melhores bandas indies da cidade.',
    organizador: 'Produtora Musical SP',
    telefone: '(11) 99999-0001',
    email: 'contato@produtorasp.com',
    criadoEm: new Date().toISOString(),
    editadoEm: new Date().toISOString()
  },
  {
    id: 'evt_sample_2',
    titulo: 'Workshop de Culinária Italiana',
    categoria: 'gastronomico',
    data: '2024-12-18',
    horario: '14:00',
    local: 'Escola de Gastronomia',
    endereco: 'Rua Augusta, 500 - São Paulo, SP',
    preco: 120.00,
    descricao: 'Aprenda a fazer autênticos pratos italianos com chef especializado.',
    organizador: 'Chef Marco Antonio',
    telefone: '(11) 99999-0002',
    email: 'marco@escolagastronomia.com',
    criadoEm: new Date().toISOString(),
    editadoEm: new Date().toISOString()
  }
];

let favoritos = [];

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Eixo Eventos funcionando!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GET /api/eventos - Listar todos os eventos
app.get('/api/eventos', (req, res) => {
  const { categoria, data, preco, search } = req.query;
  let eventosFiltered = [...eventos];

  // Filtro por categoria
  if (categoria) {
    eventosFiltered = eventosFiltered.filter(evento => evento.categoria === categoria);
  }

  // Filtro por data
  if (data) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    eventosFiltered = eventosFiltered.filter(evento => {
      const eventDate = new Date(evento.data + 'T00:00:00');
      
      switch (data) {
        case 'today':
          return evento.data === todayStr;
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return evento.data === tomorrow.toISOString().split('T')[0];
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return eventDate >= today && eventDate <= weekEnd;
        case 'month':
          return eventDate.getMonth() === today.getMonth() && 
                 eventDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  }

  // Filtro por preço
  if (preco) {
    eventosFiltered = eventosFiltered.filter(evento => {
      const eventoPreco = parseFloat(evento.preco) || 0;
      
      switch (preco) {
        case 'free':
          return eventoPreco === 0;
        case '0-50':
          return eventoPreco >= 0 && eventoPreco <= 50;
        case '50-100':
          return eventoPreco > 50 && eventoPreco <= 100;
        case '100+':
          return eventoPreco > 100;
        default:
          return true;
      }
    });
  }

  // Filtro por busca textual
  if (search) {
    const query = search.toLowerCase();
    eventosFiltered = eventosFiltered.filter(evento =>
      evento.titulo.toLowerCase().includes(query) ||
      evento.local.toLowerCase().includes(query) ||
      evento.organizador.toLowerCase().includes(query) ||
      evento.categoria.toLowerCase().includes(query) ||
      (evento.descricao && evento.descricao.toLowerCase().includes(query))
    );
  }

  // Ordenar por data
  eventosFiltered.sort((a, b) => new Date(a.data) - new Date(b.data));

  res.json({
    eventos: eventosFiltered,
    total: eventosFiltered.length,
    filtros: { categoria, data, preco, search }
  });
});

// GET /api/eventos/:id - Buscar evento por ID
app.get('/api/eventos/:id', (req, res) => {
  const evento = eventos.find(e => e.id === req.params.id);
  
  if (!evento) {
    return res.status(404).json({ error: 'Evento não encontrado' });
  }
  
  res.json(evento);
});

// POST /api/eventos - Criar novo evento
app.post('/api/eventos', (req, res) => {
  const {
    titulo,
    categoria,
    data,
    horario,
    local,
    endereco,
    preco,
    descricao,
    organizador,
    telefone,
    email
  } = req.body;

  // Validação básica
  if (!titulo || !categoria || !data || !horario || !local || !endereco || !organizador) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: titulo, categoria, data, horario, local, endereco, organizador' 
    });
  }

  const novoEvento = {
    id: `evt_${uuidv4()}`,
    titulo,
    categoria,
    data,
    horario,
    local,
    endereco,
    preco: parseFloat(preco) || 0,
    descricao: descricao || '',
    organizador,
    telefone: telefone || '',
    email: email || '',
    criadoEm: new Date().toISOString(),
    editadoEm: new Date().toISOString()
  };

  eventos.unshift(novoEvento);
  
  res.status(201).json({
    message: 'Evento criado com sucesso',
    evento: novoEvento
  });
});

// PUT /api/eventos/:id - Atualizar evento
app.put('/api/eventos/:id', (req, res) => {
  const eventoIndex = eventos.findIndex(e => e.id === req.params.id);
  
  if (eventoIndex === -1) {
    return res.status(404).json({ error: 'Evento não encontrado' });
  }

  const eventoAtual = eventos[eventoIndex];
  const dadosAtualizados = {
    ...eventoAtual,
    ...req.body,
    id: eventoAtual.id, // Manter ID original
    criadoEm: eventoAtual.criadoEm, // Manter data de criação
    editadoEm: new Date().toISOString()
  };

  // Validar preço
  if (dadosAtualizados.preco) {
    dadosAtualizados.preco = parseFloat(dadosAtualizados.preco) || 0;
  }

  eventos[eventoIndex] = dadosAtualizados;
  
  res.json({
    message: 'Evento atualizado com sucesso',
    evento: dadosAtualizados
  });
});

// DELETE /api/eventos/:id - Deletar evento
app.delete('/api/eventos/:id', (req, res) => {
  const eventoIndex = eventos.findIndex(e => e.id === req.params.id);
  
  if (eventoIndex === -1) {
    return res.status(404).json({ error: 'Evento não encontrado' });
  }

  const eventoRemovido = eventos.splice(eventoIndex, 1)[0];
  
  // Remover dos favoritos também
  favoritos = favoritos.filter(fav => fav !== req.params.id);
  
  res.json({
    message: 'Evento removido com sucesso',
    evento: eventoRemovido
  });
});

// GET /api/favoritos - Listar favoritos
app.get('/api/favoritos', (req, res) => {
  const eventosFavoritos = eventos.filter(evento => favoritos.includes(evento.id));
  
  res.json({
    favoritos: eventosFavoritos,
    total: eventosFavoritos.length
  });
});

// POST /api/favoritos/:id - Adicionar aos favoritos
app.post('/api/favoritos/:id', (req, res) => {
  const eventoId = req.params.id;
  const evento = eventos.find(e => e.id === eventoId);
  
  if (!evento) {
    return res.status(404).json({ error: 'Evento não encontrado' });
  }
  
  if (favoritos.includes(eventoId)) {
    return res.status(400).json({ error: 'Evento já está nos favoritos' });
  }
  
  favoritos.push(eventoId);
  
  res.json({
    message: 'Evento adicionado aos favoritos',
    eventoId: eventoId
  });
});

// DELETE /api/favoritos/:id - Remover dos favoritos
app.delete('/api/favoritos/:id', (req, res) => {
  const eventoId = req.params.id;
  const favoritoIndex = favoritos.indexOf(eventoId);
  
  if (favoritoIndex === -1) {
    return res.status(404).json({ error: 'Evento não está nos favoritos' });
  }
  
  favoritos.splice(favoritoIndex, 1);
  
  res.json({
    message: 'Evento removido dos favoritos',
    eventoId: eventoId
  });
});

// GET /api/stats - Estatísticas
app.get('/api/stats', (req, res) => {
  const categorias = [...new Set(eventos.map(e => e.categoria))];
  const organizadores = [...new Set(eventos.map(e => e.organizador))];
  
  res.json({
    totalEventos: eventos.length,
    totalCategorias: categorias.length,
    totalOrganizadores: organizadores.length,
    totalFavoritos: favoritos.length,
    categorias: categorias,
    organizadores: organizadores
  });
});

// POST /api/import - Importar dados
app.post('/api/import', (req, res) => {
  const { eventos: eventosImportados, favoritos: favoritosImportados } = req.body;
  
  if (!Array.isArray(eventosImportados)) {
    return res.status(400).json({ error: 'Formato de dados inválido' });
  }
  
  eventos = eventosImportados;
  favoritos = Array.isArray(favoritosImportados) ? favoritosImportados : [];
  
  res.json({
    message: 'Dados importados com sucesso',
    totalEventos: eventos.length,
    totalFavoritos: favoritos.length
  });
});

// GET /api/export - Exportar dados
app.get('/api/export', (req, res) => {
  const dados = {
    eventos,
    favoritos,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  res.json(dados);
});

// Middleware de tratamento de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em: http://localhost:${PORT}`);
    console.log(`Documentação em: http://localhost:${PORT}/api`);
  });
}

// Export para Vercel
module.exports = app;
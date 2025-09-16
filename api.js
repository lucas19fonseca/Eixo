// api.js - Arquivo para integração com o backend
// Substitua pela URL do seu deploy na Vercel
const API_BASE_URL = 'https://seu-projeto.vercel.app';

// Classe para gerenciar as chamadas da API
class EventosAPI {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Método auxiliar para fazer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erro na API (${endpoint}):`, error);
      throw error;
    }
  }

  // EVENTOS

  // Buscar todos os eventos com filtros opcionais
  async getEventos(filtros = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filtros).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const query = params.toString();
    const endpoint = `/api/eventos${query ? `?${query}` : ''}`;
    
    return await this.request(endpoint);
  }

  // Buscar evento por ID
  async getEvento(id) {
    return await this.request(`/api/eventos/${id}`);
  }

  // Criar novo evento
  async criarEvento(dadosEvento) {
    return await this.request('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(dadosEvento)
    });
  }

  // Atualizar evento
  async atualizarEvento(id, dadosEvento) {
    return await this.request(`/api/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosEvento)
    });
  }

  // Deletar evento
  async deletarEvento(id) {
    return await this.request(`/api/eventos/${id}`, {
      method: 'DELETE'
    });
  }

  // FAVORITOS

  // Buscar favoritos
  async getFavoritos() {
    return await this.request('/api/favoritos');
  }

  // Adicionar aos favoritos
  async adicionarFavorito(eventoId) {
    return await this.request(`/api/favoritos/${eventoId}`, {
      method: 'POST'
    });
  }

  // Remover dos favoritos
  async removerFavorito(eventoId) {
    return await this.request(`/api/favoritos/${eventoId}`, {
      method: 'DELETE'
    });
  }

  // OUTROS

  // Buscar estatísticas
  async getStats() {
    return await this.request('/api/stats');
  }

  // Exportar dados
  async exportarDados() {
    return await this.request('/api/export');
  }

  // Importar dados
  async importarDados(dados) {
    return await this.request('/api/import', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  }

  // Health check
  async healthCheck() {
    return await this.request('/');
  }
}

// Instância global da API
const api = new EventosAPI();

// Funções modificadas para usar a API
// Substitua as funções existentes no seu HTML por estas:

// Variáveis globais modificadas
let eventos = [];
let favoritos = [];
let currentEditId = null;

// Carregar dados da API
async function loadData() {
  try {
    showLoading(true);
    
    // Carregar eventos
    const eventosData = await api.getEventos();
    eventos = eventosData.eventos || [];
    
    // Carregar favoritos
    try {
      const favoritosData = await api.getFavoritos();
      favoritos = favoritosData.favoritos?.map(f => f.id) || [];
    } catch (error) {
      console.warn('Erro ao carregar favoritos:', error);
      favoritos = [];
    }
    
    showLoading(false);
    return true;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showLoading(false);
    showToast('Erro ao conectar com o servidor. Usando dados locais.', 'warning');
    
    // Fallback para dados locais
    if (eventos.length === 0) {
      addSampleData();
    }
    return false;
  }
}

// Carregar eventos com filtros
async function loadEventsWithFilters(filtros = {}) {
  try {
    showLoading(true);
    const data = await api.getEventos(filtros);
    displayEvents(data.eventos);
    showLoading(false);
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    showLoading(false);
    displayEvents(eventos); // Fallback para dados locais
  }
}

// Função de busca modificada
async function searchEvents() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  
  try {
    const filtros = {
      search: query,
      categoria: document.getElementById('categoryFilter').value,
      data: document.getElementById('dateFilter').value,
      preco: document.getElementById('priceFilter').value
    };
    
    await loadEventsWithFilters(filtros);
  } catch (error) {
    console.error('Erro na busca:', error);
    // Fallback para busca local
    const filtered = eventos.filter(event =>
      event.titulo.toLowerCase().includes(query) ||
      event.local.toLowerCase().includes(query) ||
      event.organizador.toLowerCase().includes(query) ||
      event.categoria.toLowerCase().includes(query) ||
      (event.descricao && event.descricao.toLowerCase().includes(query))
    );
    displayEvents(filtered);
  }
}

// Filtros modificados
async function filterEvents() {
  const filtros = {
    categoria: document.getElementById('categoryFilter').value,
    data: document.getElementById('dateFilter').value,
    preco: document.getElementById('priceFilter').value
  };
  
  await loadEventsWithFilters(filtros);
}

// Criar/atualizar evento modificado
async function handleEventSubmit(eventoData) {
  try {
    showLoading(true);
    
    if (currentEditId) {
      // Atualizar evento
      const response = await api.atualizarEvento(currentEditId, eventoData);
      showToast('Evento atualizado com sucesso!');
    } else {
      // Criar novo evento
      const response = await api.criarEvento(eventoData);
      showToast('Evento criado com sucesso!');
    }
    
    // Recarregar dados
    await loadData();
    await loadEvents();
    await updateStats();
    
    showLoading(false);
    closeModal();
  } catch (error) {
    showLoading(false);
    console.error('Erro ao salvar evento:', error);
    showToast('Erro ao salvar evento: ' + error.message, 'error');
  }
}

// Deletar evento modificado
async function deleteEvent(id) {
  if (!confirm('Tem certeza que deseja excluir este evento?')) return;
  
  try {
    showLoading(true);
    await api.deletarEvento(id);
    
    // Atualizar dados locais
    eventos = eventos.filter(e => e.id !== id);
    favoritos = favoritos.filter(fId => fId !== id);
    
    await loadEvents();
    await updateStats();
    
    showLoading(false);
    showToast('Evento excluído com sucesso!');
  } catch (error) {
    showLoading(false);
    console.error('Erro ao deletar evento:', error);
    showToast('Erro ao excluir evento: ' + error.message, 'error');
  }
}

// Toggle favorito modificado
async function toggleFavorite(id) {
  try {
    const isFavorited = favoritos.includes(id);
    
    if (isFavorited) {
      await api.removerFavorito(id);
      favoritos = favoritos.filter(fId => fId !== id);
      showToast('Removido dos favoritos', 'warning');
    } else {
      await api.adicionarFavorito(id);
      favoritos.push
       showToast('Adicionado aos favoritos!');
    }
    
    await loadEvents();
    await updateStats();
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    showToast('Erro ao atualizar favorito: ' + error.message, 'error');
  }
}

// Atualizar estatísticas modificado
async function updateStats() {
  try {
    const stats = await api.getStats();
    
    document.getElementById('totalEvents').textContent = stats.totalEventos;
    document.getElementById('totalCategories').textContent = stats.totalCategorias;
    document.getElementById('totalOrganizers').textContent = stats.totalOrganizadores;
    document.getElementById('totalFavorites').textContent = stats.totalFavoritos;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    // Fallback para cálculo local
    const categories = [...new Set(eventos.map(e => e.categoria))];
    const organizers = [...new Set(eventos.map(e => e.organizador))];
    
    document.getElementById('totalEvents').textContent = eventos.length;
    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalOrganizers').textContent = organizers.length;
    document.getElementById('totalFavorites').textContent = favoritos.length;
  }
}

// Exportar dados modificado
async function exportData() {
  try {
    const data = await api.exportarDados();
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    showToast('Erro ao exportar dados: ' + error.message, 'error');
  }
}

// Importar dados modificado
async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.eventos && Array.isArray(data.eventos)) {
        if (confirm(`Isso irá substituir os dados existentes. Continuar?`)) {
          showLoading(true);
          
          await api.importarDados(data);
          
          // Recarregar dados
          await loadData();
          await loadEvents();
          await updateStats();
          
          showLoading(false);
          showToast(`Dados importados com sucesso!`);
        }
      } else {
        throw new Error('Formato de arquivo inválido');
      }
    } catch (error) {
      showLoading(false);
      showToast('Erro ao importar arquivo. Verifique o formato.', 'error');
      console.error('Import error:', error);
    }
  };
  reader.readAsText(file);
  
  // Reset input
  event.target.value = '';
}

// Modificar o form submit para usar a nova função
document.getElementById('eventForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const eventData = {
    titulo: document.getElementById('titulo').value,
    categoria: document.getElementById('categoria').value,
    data: document.getElementById('data').value,
    horario: document.getElementById('horario').value,
    local: document.getElementById('local').value,
    endereco: document.getElementById('endereco').value,
    preco: parseFloat(document.getElementById('preco').value) || 0,
    organizador: document.getElementById('organizador').value,
    telefone: document.getElementById('telefone').value,
    email: document.getElementById('email').value,
    descricao: document.getElementById('descricao').value
  };

  await handleEventSubmit(eventData);
});

// Função para inicializar a aplicação com a API
async function initializeApp() {
  try {
    // Tentar health check da API
    await api.healthCheck();
    console.log('✅ Conectado à API');
    
    // Carregar dados da API
    await loadData();
    await loadEvents();
    await updateStats();
    
    showToast('Conectado ao servidor!', 'success');
  } catch (error) {
    console.warn('⚠️ API não disponível, usando modo offline');
    
    // Modo offline - usar dados locais
    if (eventos.length === 0) {
      addSampleData();
    }
    loadEvents();
    updateStats();
    
    showToast('Modo offline ativo', 'warning');
  }
}

// Modificar a inicialização do app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  
  // Set minimum date to today
  document.getElementById('data').min = new Date().toISOString().split('T')[0];
});

// Função para verificar conectividade periodicamente
function setupConnectivityCheck() {
  setInterval(async () => {
    try {
      await api.healthCheck();
      // Se chegou aqui, a API está funcionando
    } catch (error) {
      console.warn('Perda de conectividade detectada');
      // Pode mostrar um indicador visual de modo offline
    }
  }, 30000); // Verificar a cada 30 segundos
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.EventosAPI = EventosAPI;
  window.api = api;
}

// Para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventosAPI, api };
}
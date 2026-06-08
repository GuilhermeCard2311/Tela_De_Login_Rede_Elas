const STORAGE_KEY_POSTS = 'rede_elas_postagens';
const STORAGE_KEY_VOTOS = 'rede_elas_avaliacoes';

const usuarioAtual = JSON.parse(localStorage.getItem("usuarioLogado"));
const USUARIO_LOGADO_ID = usuarioAtual ? usuarioAtual.cpf : 1;

function lerPostagensStorage() {
  const dados = localStorage.getItem(STORAGE_KEY_POSTS);
  try {
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    return [];
  }
}

function lerAvaliacoesStorage() {
  const dados = localStorage.getItem(STORAGE_KEY_VOTOS);
  try {
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    return [];
  }
}

function salvarAvaliacoesStorage(lista) {
  localStorage.setItem(STORAGE_KEY_VOTOS, JSON.stringify(lista));
}

let todasPostagens = [];
let todasAvaliacoes = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  const select = document.getElementById('filterSelect');
  if (select) {
    select.addEventListener('change', renderizarFeed);
  }
});

function carregarDados() {
  try {
    todasPostagens = lerPostagensStorage();
    todasAvaliacoes = lerAvaliacoesStorage();
    renderizarFeed();
  } catch (erro) {
    console.error(erro);
  }
}

function renderizarFeed() {
  const feed = document.getElementById('feedRelatos');
  if (!feed) return;
  feed.innerHTML = '';

  const filtro = document.getElementById('filterSelect') ? document.getElementById('filterSelect').value : 'recentes';
  let postagensOrdenadas = [...todasPostagens];

  if (filtro === 'relevantes') {
    postagensOrdenadas.sort((a, b) => {
      const upvotesA = todasAvaliacoes.filter(v => v.postagemId.toString() === a.id.toString() && v.tipoVoto === 'upvote').length;
      const downvotesA = todasAvaliacoes.filter(v => v.postagemId.toString() === a.id.toString() && v.tipoVoto === 'downvote').length;
      const saldoA = upvotesA - downvotesA;

      const upvotesB = todasAvaliacoes.filter(v => v.postagemId.toString() === b.id.toString() && v.tipoVoto === 'upvote').length;
      const downvotesB = todasAvaliacoes.filter(v => v.postagemId.toString() === b.id.toString() && v.tipoVoto === 'downvote').length;
      const saldoB = upvotesB - downvotesB;

      return saldoB - saldoA;
    });
  } else {
    postagensOrdenadas.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  }

  postagensOrdenadas.forEach(post => {
    const upvotes = todasAvaliacoes.filter(v => v.postagemId.toString() === post.id.toString() && v.tipoVoto === 'upvote').length;
    const downvotes = todasAvaliacoes.filter(v => v.postagemId.toString() === post.id.toString() && v.tipoVoto === 'downvote').length;
    const totalVotos = upvotes - downvotes;

    const meuVoto = todasAvaliacoes.find(v => v.postagemId.toString() === post.id.toString() && v.usuarioId.toString() === USUARIO_LOGADO_ID.toString());
    const tipoMeuVoto = meuVoto ? meuVoto.tipoVoto : null;

    const classUpvote = tipoMeuVoto === 'upvote' ? 'vote-btn upvote-ativo' : 'vote-btn';
    const classDownvote = tipoMeuVoto === 'downvote' ? 'vote-btn downvote-ativo' : 'vote-btn';

    const card = document.createElement('article');
    card.className = 'relato-card';
    card.innerHTML = `
        <div class="relato-inner">
            <h2 class="relato-title">${post.titulo || 'Sem Título'}</h2>
            <p class="relato-author">Por Anônimo</p>
            <p class="relato-text">${post.conteudo}</p>
            
            <div class="relato-actions">
                <div class="vote-pill">
                    <button class="${classUpvote}" onclick="gerenciarVoto('${post.id}', 'upvote')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                    <span class="vote-count">${totalVotos}</span>
                    <button class="${classDownvote}" onclick="gerenciarVoto('${post.id}', 'downvote')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    feed.appendChild(card);
  });
}

function gerenciarVoto(postId, tipo) {
  const indexVotoExistente = todasAvaliacoes.findIndex(v => 
    v.postagemId.toString() === postId.toString() && 
    v.usuarioId.toString() === USUARIO_LOGADO_ID.toString()
  );

  if (indexVotoExistente !== -1) {
    const votoAtual = todasAvaliacoes[indexVotoExistente];
    if (votoAtual.tipoVoto === tipo) {
      todasAvaliacoes.splice(indexVotoExistente, 1);
    } else {
      todasAvaliacoes[indexVotoExistente].tipoVoto = tipo;
    }
  } else {
    const novoVoto = {
      id: Math.random().toString(36).substr(2, 9),
      postagemId: postId.toString(),
      usuarioId: USUARIO_LOGADO_ID,
      tipoVoto: tipo,
      dataCriacao: new Date().toISOString().split('T')[0]
    };
    todasAvaliacoes.push(novoVoto);
  }

  salvarAvaliacoesStorage(todasAvaliacoes);
  renderizarFeed();
}
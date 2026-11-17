// Camada de acesso à API REST: todas as chamadas HTTP do frontend passam por aqui.

const URL_DA_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const CHAVE_DA_SESSAO = 'liratech.sessao'

/** Erro devolvido pela API, com o código HTTP e a mensagem pronta para exibir. */
export class ErroDaApi extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.status = status
  }
}

// --- Sessão: token e dados do usuário ficam no armazenamento do navegador -----
export function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DA_SESSAO))
  } catch {
    return null
  }
}

export function gravarSessao(sessao) {
  try {
    if (sessao) localStorage.setItem(CHAVE_DA_SESSAO, JSON.stringify(sessao))
    else localStorage.removeItem(CHAVE_DA_SESSAO)
  } catch {
    // Navegação privada pode bloquear o armazenamento: a sessão vale só até recarregar.
  }
}

// Função chamada quando a API responde 401 a uma rota protegida (token expirado).
let aoExpirar = () => {}
export function definirAoExpirar(funcao) {
  aoExpirar = funcao
}

async function chamar(metodo, caminho, corpo, { autenticada = true } = {}) {
  const cabecalhos = {}
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  const token = lerSessao()?.token
  if (autenticada && token) cabecalhos.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(URL_DA_API + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroDaApi(0, 'Não foi possível conectar à API. Verifique se ela está em execução.')
  }

  if (resposta.status === 401 && autenticada) {
    aoExpirar()
    throw new ErroDaApi(401, 'Sua sessão expirou. Entre novamente.')
  }
  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new ErroDaApi(resposta.status, dados?.erro ?? `A API respondeu com o código ${resposta.status}.`)
  }
  return dados
}

export const api = {
  // Autenticação
  cadastrar: (dados) => chamar('POST', '/auth/cadastro', dados, { autenticada: false }),
  entrar: (dados) => chamar('POST', '/auth/login', dados, { autenticada: false }),

  // Conta (caso de uso "Gerenciar Conta")
  consultarConta: () => chamar('GET', '/conta'),
  alterarConta: (dados) => chamar('PUT', '/conta', dados),
  trocarSenha: (dados) => chamar('PUT', '/conta/senha', dados),
  excluirConta: (senha) => chamar('DELETE', '/conta', { senha }),

  // Obras, atos e poemas
  listarObras: () => chamar('GET', '/obras'),
  criarObra: (dados) => chamar('POST', '/obras', dados),
  consultarObra: (id) => chamar('GET', `/obras/${id}`),
  alterarObra: (id, dados) => chamar('PUT', `/obras/${id}`, dados),
  excluirObra: (id) => chamar('DELETE', `/obras/${id}`),
  criarAto: (idObra, titulo) => chamar('POST', `/obras/${idObra}/atos`, { titulo }),
  alterarAto: (id, titulo) => chamar('PUT', `/atos/${id}`, { titulo }),
  excluirAto: (id) => chamar('DELETE', `/atos/${id}`),
  criarPoema: (idAto, titulo) => chamar('POST', `/atos/${idAto}/poemas`, { titulo }),

  // Editor
  consultarPoema: (id) => chamar('GET', `/poemas/${id}`),
  renomearPoema: (id, titulo) => chamar('PUT', `/poemas/${id}`, { titulo }),
  salvarConteudo: (id, conteudo) => chamar('PUT', `/poemas/${id}/conteudo`, { conteudo }),
  excluirPoema: (id) => chamar('DELETE', `/poemas/${id}`),

  // Dicionário de rimas e estado do motor
  consultarRimas: (palavra) => chamar('GET', `/rimas?palavra=${encodeURIComponent(palavra)}`),
  estadoDoMotor: () => chamar('GET', '/motor'),
}

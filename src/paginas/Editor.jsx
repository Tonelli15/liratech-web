import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api.js'
import BuscaDeRimas from '../componentes/BuscaDeRimas.jsx'

const ESPERA_PARA_SALVAR = 700 // milissegundos sem digitar antes de enviar o texto à API
const CORES_DAS_RIMAS = 6 // quantidade de cores definidas em estilos.css (.rima-0 a .rima-5)

/**
 * Relaciona cada linha da caixa de texto com o verso analisado correspondente.
 * Linhas em branco não têm verso; linhas alteradas depois da última análise
 * ficam marcadas como pendentes até a API responder.
 */
function relacionarLinhas(texto, poema) {
  const versos = poema ? poema.estrofes.flatMap((estrofe) => estrofe.versos) : []
  let proximo = 0
  return texto.split('\n').map((linha) => {
    const limpa = linha.trim()
    if (!limpa) return { vazia: true }
    const verso = versos[proximo++]
    return verso && verso.textoOriginal === limpa ? { verso } : { pendente: true }
  })
}

const corDaLetra = (letra) => `rima-${(letra.charCodeAt(letra.length - 1) - 65) % CORES_DAS_RIMAS}`

/** Editor de versos com o painel de análise ao lado (RF02 a RF05, RNF03). */
export default function Editor() {
  const { idPoema } = useParams()
  const [poema, setPoema] = useState(null)
  const [texto, setTexto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [estado, setEstado] = useState('salvo') // 'salvo' | 'pendente' | 'salvando' | 'erro'
  const [erro, setErro] = useState('')
  const [linhaAtual, setLinhaAtual] = useState(0)

  const caixa = useRef(null)
  const margem = useRef(null)
  const temporizador = useRef(null)
  const ultimoEnvio = useRef(0) // número do envio mais recente: respostas antigas são descartadas
  const textoAtual = useRef('')

  // Carrega o poema ao abrir a tela.
  useEffect(() => {
    let ativo = true
    setPoema(null)
    setErro('')
    api.consultarPoema(idPoema).then(
      (dados) => {
        if (!ativo) return
        setPoema(dados)
        setTexto(dados.conteudoBruto)
        setTitulo(dados.titulo)
        textoAtual.current = dados.conteudoBruto
        setEstado('salvo')
      },
      (falha) => ativo && setErro(falha.message),
    )
    return () => {
      ativo = false
      clearTimeout(temporizador.current)
    }
  }, [idPoema])

  const salvar = useCallback(
    async (conteudo) => {
      const envio = ++ultimoEnvio.current
      setEstado('salvando')
      try {
        const dados = await api.salvarConteudo(idPoema, conteudo)
        if (envio !== ultimoEnvio.current) return // já existe um envio mais novo
        setPoema(dados)
        setErro('')
        setEstado(textoAtual.current === conteudo ? 'salvo' : 'pendente')
      } catch (falha) {
        if (envio !== ultimoEnvio.current) return
        setErro(falha.message)
        setEstado('erro')
      }
    },
    [idPoema],
  )

  // A cada tecla o envio é adiado: a API só é chamada quando a digitação faz uma pausa.
  function aoDigitar(evento) {
    const conteudo = evento.target.value
    setTexto(conteudo)
    textoAtual.current = conteudo
    setEstado('pendente')
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => salvar(conteudo), ESPERA_PARA_SALVAR)
    atualizarLinha(evento.target)
  }

  function atualizarLinha(elemento) {
    setLinhaAtual(elemento.value.slice(0, elemento.selectionStart).split('\n').length - 1)
  }

  async function renomear() {
    const novo = titulo.trim()
    if (!novo || novo === poema.titulo) {
      setTitulo(poema.titulo)
      return
    }
    try {
      const dados = await api.renomearPoema(idPoema, novo)
      setPoema((anterior) => ({ ...anterior, titulo: dados.titulo }))
    } catch (falha) {
      setErro(falha.message)
      setTitulo(poema.titulo)
    }
  }

  const linhas = useMemo(() => relacionarLinhas(texto, poema), [texto, poema])
  const selecionada = linhas[Math.min(linhaAtual, linhas.length - 1)]
  const verso = selecionada?.verso

  // Rimas do verso selecionado: cada par aparece do ponto de vista deste verso.
  const rimasDoVerso = useMemo(() => {
    if (!verso || !poema) return []
    return poema.rimas
      .filter((par) => par.linhaA === verso.linha || par.linhaB === verso.linha)
      .map((par) =>
        par.linhaA === verso.linha
          ? { linha: par.linhaB, palavra: par.palavraB, riqueza: par.riqueza }
          : { linha: par.linhaA, palavra: par.palavraA, riqueza: par.riqueza },
      )
  }, [verso, poema])

  if (!poema) {
    return (
      <section className="pagina">
        {erro ? (
          <p className="aviso aviso-erro" role="alert">
            {erro} <Link to="/">Voltar às obras</Link>
          </p>
        ) : (
          <p className="vazio">Carregando…</p>
        )}
      </section>
    )
  }

  const ricas = poema.rimas.filter((par) => par.riqueza === 'rica').length
  const rotuloDoEstado = {
    salvo: 'Salvo',
    pendente: 'Alterações não salvas…',
    salvando: 'Analisando…',
    erro: 'Não foi possível salvar',
  }[estado]

  return (
    <section className="pagina pagina-editor">
      <p className="trilha">
        <Link to="/">Obras</Link> / <Link to={`/obras/${poema.idObra}`}>Obra</Link> / Poema
      </p>

      <header className="cabecalho-do-editor">
        <input
          className="titulo-do-poema"
          aria-label="Título do poema"
          value={titulo}
          maxLength={200}
          onChange={(evento) => setTitulo(evento.target.value)}
          onBlur={renomear}
          onKeyDown={(evento) => evento.key === 'Enter' && evento.target.blur()}
        />
        <span className={`estado estado-${estado}`} role="status">
          {rotuloDoEstado}
        </span>
      </header>

      {estado === 'erro' && (
        <p className="aviso aviso-erro" role="alert">
          {erro}{' '}
          <button type="button" className="botao botao-texto" onClick={() => salvar(textoAtual.current)}>
            Tentar de novo
          </button>
        </p>
      )}
      {!poema.motorDisponivel && estado !== 'erro' && (
        <p className="aviso">
          O motor de PLN está fora do ar. O texto continua sendo salvo; os versos sem análise são analisados na
          próxima alteração do poema, depois que o motor voltar.
        </p>
      )}

      <div className="editor">
        <div className="folha">
          <textarea
            ref={caixa}
            className="versos"
            aria-label="Versos do poema"
            placeholder={'Escreva um verso por linha.\nDeixe uma linha em branco entre as estrofes.'}
            value={texto}
            wrap="off"
            spellCheck="true"
            onChange={aoDigitar}
            onKeyUp={(evento) => atualizarLinha(evento.target)}
            onClick={(evento) => atualizarLinha(evento.target)}
            onScroll={(evento) => {
              margem.current.scrollTop = evento.target.scrollTop
            }}
          />
          {/* Margem de análise: uma linha para cada linha da caixa de texto, com a mesma altura. */}
          <div className="margem" ref={margem} aria-hidden="true">
            <div className="margem-titulo">
              <span>síl.</span>
              <span>rima</span>
            </div>
            {linhas.map((linha, indice) => (
              <div key={indice} className={indice === linhaAtual ? 'margem-linha margem-atual' : 'margem-linha'}>
                {linha.vazia ? null : linha.pendente ? (
                  <span className="margem-pendente">…</span>
                ) : (
                  <>
                    <span className="margem-silabas">{linha.verso.metrica ? linha.verso.metrica.totalSilabas : '–'}</span>
                    <span className={linha.verso.letraRima ? `margem-letra ${corDaLetra(linha.verso.letraRima)}` : 'margem-letra'}>
                      {linha.verso.letraRima ?? '·'}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="painel" aria-label="Análise estrutural">
          <section className="cartao">
            <h2>Verso selecionado</h2>
            {!selecionada || selecionada.vazia ? (
              <p className="vazio">Posicione o cursor em um verso para ver a análise.</p>
            ) : selecionada.pendente ? (
              <p className="vazio">Aguardando a análise deste verso…</p>
            ) : (
              <>
                {verso.metrica ? (
                  <>
                    <p className="escansao">{verso.metrica.separacaoPoetica}</p>
                    <p>
                      <strong>{verso.metrica.totalSilabas}</strong> sílabas poéticas · {verso.metrica.classificacao}
                    </p>
                    <p className="legenda">Separação gramatical: {verso.metrica.separacaoGramatical}</p>
                  </>
                ) : (
                  <p className="vazio">Sem análise métrica para este verso.</p>
                )}
                {verso.rima && (
                  <dl className="ficha-da-rima">
                    <dt>Palavra final</dt>
                    <dd>{verso.rima.palavraFinal}</dd>
                    <dt>Terminação</dt>
                    <dd>-{verso.rima.fonemaTonico}</dd>
                    <dt>Classe gramatical</dt>
                    <dd>{verso.rima.classeGramatical}</dd>
                  </dl>
                )}
                {rimasDoVerso.length > 0 ? (
                  <ul className="lista-de-rimas">
                    {rimasDoVerso.map((rima) => (
                      <li key={rima.linha}>
                        Rima com o verso {rima.linha} (“{rima.palavra}”):{' '}
                        <span className={`selo selo-${rima.riqueza}`}>rima {rima.riqueza}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  verso.rima && <p className="legenda">Este verso não rima com nenhum outro do poema.</p>
                )}
                {verso.avisos.map((aviso) => (
                  <p key={aviso} className="aviso">
                    {aviso}
                  </p>
                ))}
              </>
            )}
          </section>

          <section className="cartao">
            <h2>Esquema de rimas</h2>
            {poema.estrofes.length === 0 ? (
              <p className="vazio">O esquema aparece quando houver versos.</p>
            ) : (
              <>
                <ol className="esquemas">
                  {poema.estrofes.map((estrofe) => (
                    <li key={estrofe.ordem}>
                      <span className="legenda">Estrofe {estrofe.ordem}</span>
                      <code>{estrofe.esquemaRimas}</code>
                    </li>
                  ))}
                </ol>
                <p className="legenda">
                  {poema.rimas.length === 0
                    ? 'Nenhum par de rima identificado.'
                    : `${poema.rimas.length} pares de rima: ${ricas} ricas e ${poema.rimas.length - ricas} pobres.`}
                </p>
                <p className="legenda">
                  Rica: palavras finais de classes gramaticais diferentes. Pobre: mesma classe. O traço indica verso
                  sem rima.
                </p>
              </>
            )}
          </section>

          <section className="cartao">
            <h2>Dicionário de rimas</h2>
            <BuscaDeRimas sugestao={verso?.rima?.palavraFinal ?? ''} />
          </section>
        </aside>
      </div>
    </section>
  )
}

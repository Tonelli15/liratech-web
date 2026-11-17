import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import CampoRapido from '../componentes/CampoRapido.jsx'

/** Estrutura de uma obra: atos e poemas, com criação, renomeação e exclusão (RF01). */
export default function Obra() {
  const { idObra } = useParams()
  const navegar = useNavigate()
  const [obra, setObra] = useState(null)
  const [erro, setErro] = useState('')
  const [editando, setEditando] = useState(null) // 'obra' ou o id do ato em renomeação
  const [campos, setCampos] = useState({ titulo: '', sinopse: '' })

  const carregar = useCallback(
    () => api.consultarObra(idObra).then(setObra, (falha) => setErro(falha.message)),
    [idObra],
  )
  useEffect(() => {
    carregar()
  }, [carregar])

  // Executa uma alteração na API, mostra o erro se houver e recarrega a obra.
  async function executar(acao) {
    setErro('')
    try {
      await acao()
      await carregar()
    } catch (falha) {
      setErro(falha.message)
    }
  }

  if (!obra) {
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

  return (
    <section className="pagina">
      <p className="trilha">
        <Link to="/">Obras</Link> / {obra.titulo}
      </p>

      {editando === 'obra' ? (
        <form
          className="cartao formulario-obra"
          onSubmit={(evento) => {
            evento.preventDefault()
            executar(async () => {
              await api.alterarObra(obra.id, { titulo: campos.titulo, sinopse: campos.sinopse || null })
              setEditando(null)
            })
          }}
        >
          <label>
            Título
            <input
              value={campos.titulo}
              maxLength={200}
              required
              autoFocus
              onChange={(evento) => setCampos({ ...campos, titulo: evento.target.value })}
            />
          </label>
          <label>
            Sinopse
            <textarea
              rows={3}
              value={campos.sinopse}
              maxLength={2000}
              onChange={(evento) => setCampos({ ...campos, sinopse: evento.target.value })}
            />
          </label>
          <div className="acoes">
            <button type="submit" className="botao botao-principal">
              Salvar
            </button>
            <button type="button" className="botao botao-discreto" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <header className="cabecalho-da-obra">
          <div>
            <h1>{obra.titulo}</h1>
            {obra.sinopse && <p className="legenda">{obra.sinopse}</p>}
          </div>
          <div className="acoes">
            <button
              type="button"
              className="botao"
              onClick={() => {
                setCampos({ titulo: obra.titulo, sinopse: obra.sinopse ?? '' })
                setEditando('obra')
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="botao botao-perigo"
              onClick={() => {
                if (window.confirm(`Excluir a obra “${obra.titulo}” com todos os atos e poemas?`)) {
                  executar(async () => {
                    await api.excluirObra(obra.id)
                    navegar('/')
                  })
                }
              }}
            >
              Excluir obra
            </button>
          </div>
        </header>
      )}

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {obra.atos.length === 0 && (
        <p className="vazio">Esta obra ainda não tem atos. Crie o primeiro abaixo para começar a escrever.</p>
      )}

      {obra.atos.map((ato) => (
        <article key={ato.id} className="cartao ato">
          {editando === ato.id ? (
            <CampoRapido
              rotulo="Título do ato"
              botao="Salvar"
              valorInicial={ato.titulo}
              aoCancelar={() => setEditando(null)}
              aoEnviar={(titulo) =>
                executar(async () => {
                  await api.alterarAto(ato.id, titulo)
                  setEditando(null)
                })
              }
            />
          ) : (
            <header className="cabecalho-do-ato">
              <h2>{ato.titulo}</h2>
              <div className="acoes">
                <button type="button" className="botao botao-discreto" onClick={() => setEditando(ato.id)}>
                  Renomear
                </button>
                <button
                  type="button"
                  className="botao botao-discreto botao-perigo"
                  onClick={() => {
                    if (window.confirm(`Excluir o ato “${ato.titulo}” e os seus poemas?`)) {
                      executar(() => api.excluirAto(ato.id))
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </header>
          )}

          <ul className="lista-de-poemas">
            {ato.poemas.map((poema) => (
              <li key={poema.id}>
                <Link to={`/poemas/${poema.id}`}>{poema.titulo}</Link>
                <button
                  type="button"
                  className="botao botao-discreto botao-perigo"
                  aria-label={`Excluir o poema ${poema.titulo}`}
                  onClick={() => {
                    if (window.confirm(`Excluir o poema “${poema.titulo}”?`)) {
                      executar(() => api.excluirPoema(poema.id))
                    }
                  }}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
          <CampoRapido
            rotulo="Título do novo poema"
            botao="Novo poema"
            aoEnviar={async (titulo) => {
              setErro('')
              try {
                const poema = await api.criarPoema(ato.id, titulo)
                navegar(`/poemas/${poema.id}`)
              } catch (falha) {
                setErro(falha.message)
              }
            }}
          />
        </article>
      ))}

      <div className="cartao cartao-novo-ato">
        <CampoRapido
          rotulo="Título do novo ato (ex.: Ato I)"
          botao="Novo ato"
          aoEnviar={(titulo) => executar(() => api.criarAto(obra.id, titulo))}
        />
      </div>
    </section>
  )
}

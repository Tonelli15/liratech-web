import { useEffect, useState } from 'react'
import { api } from '../api.js'

/**
 * Consulta ao dicionário de rimas. "sugestao" é a palavra final do verso em
 * edição: aparece como atalho, mas a busca só acontece quando o usuário pede.
 */
export default function BuscaDeRimas({ sugestao = '' }) {
  const [palavra, setPalavra] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function buscar(termo) {
    const limpo = termo.trim()
    if (!limpo) return
    setPalavra(limpo)
    setErro('')
    setBuscando(true)
    try {
      setResultado(await api.consultarRimas(limpo))
    } catch (falha) {
      setResultado(null)
      setErro(falha.message)
    } finally {
      setBuscando(false)
    }
  }

  // Ao mudar de verso, o resultado antigo deixa de fazer sentido se o campo estiver vazio.
  useEffect(() => {
    if (!palavra) setResultado(null)
  }, [sugestao, palavra])

  return (
    <div className="rimas">
      <form
        className="linha-de-campo"
        onSubmit={(evento) => {
          evento.preventDefault()
          buscar(palavra)
        }}
      >
        <input
          aria-label="Palavra para rimar"
          placeholder="Digite uma palavra"
          value={palavra}
          maxLength={60}
          onChange={(evento) => setPalavra(evento.target.value)}
        />
        <button type="submit" className="botao" disabled={buscando || !palavra.trim()}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {sugestao && sugestao !== palavra && (
        <button type="button" className="botao botao-texto" onClick={() => buscar(sugestao)}>
          Buscar rimas para “{sugestao}”
        </button>
      )}
      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}
      {resultado && (
        <div className="rimas-resultado">
          <p className="legenda">
            “{resultado.palavra}” ({resultado.classeGramatical}) termina em <strong>-{resultado.terminacao}</strong>
          </p>
          {resultado.rimas.length === 0 ? (
            <p className="vazio">Nenhuma palavra com essa terminação foi usada na plataforma até agora.</p>
          ) : (
            <>
              <ul className="fichas">
                {resultado.rimas.map((rima) => {
                  const rica = rima.classeGramatical !== resultado.classeGramatical
                  return (
                    <li key={rima.palavra + rima.classeGramatical} className={rica ? 'ficha-rica' : undefined}>
                      {rima.palavra} <small>{rima.classeGramatical}</small>
                      {rica && <span className="ficha-selo">rica</span>}
                    </li>
                  )
                })}
              </ul>
              <p className="legenda">
                Marcadas como “rica”: palavras de classe gramatical diferente de “{resultado.palavra}”, que formariam
                rima rica com ela.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

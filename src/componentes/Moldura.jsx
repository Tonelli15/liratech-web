import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

/** Cabeçalho comum às telas internas: navegação, estado do motor e saída. */
export default function Moldura({ children }) {
  const { sessao, encerrar } = useSessao()
  const [motor, setMotor] = useState(null)

  // Consulta o estado do motor ao abrir e a cada 30 segundos.
  useEffect(() => {
    let ativo = true
    const consultar = () =>
      api.estadoDoMotor().then(
        (estado) => ativo && setMotor(estado),
        () => ativo && setMotor({ disponivel: false }),
      )
    consultar()
    const intervalo = setInterval(consultar, 30000)
    return () => {
      ativo = false
      clearInterval(intervalo)
    }
  }, [])

  return (
    <div className="moldura">
      <header className="topo">
        <Link to="/" className="marca">
          Lira<span>Tech</span>
        </Link>
        <nav className="navegacao" aria-label="Principal">
          <NavLink to="/" end>
            Obras
          </NavLink>
          <NavLink to="/rimas">Dicionário de rimas</NavLink>
        </nav>
        <div className="topo-direita">
          {motor && (
            <span
              className={motor.disponivel ? 'sinal sinal-ok' : 'sinal sinal-falha'}
              title={motor.disponivel ? `Motor ${motor.versaoMotor} (${motor.modeloSpacy})` : 'Os versos são salvos sem análise'}
            >
              {motor.disponivel ? 'Motor de PLN ativo' : 'Motor de PLN fora do ar'}
            </span>
          )}
          <NavLink to="/conta" className="usuario" title="Minha conta">
            <span className="usuario-nome">{sessao.nome}</span>
            <span className="usuario-curto">Minha conta</span>
          </NavLink>
          <button type="button" className="botao botao-discreto" onClick={() => encerrar()}>
            Sair
          </button>
        </div>
      </header>
      <main className="conteudo">{children}</main>
    </div>
  )
}

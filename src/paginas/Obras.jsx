import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/** Lista das obras do usuário e criação de uma nova obra (RF01). */
export default function Obras() {
  const navegar = useNavigate()
  const [obras, setObras] = useState(null)
  const [erro, setErro] = useState('')
  const [campos, setCampos] = useState({ titulo: '', sinopse: '' })
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    api.listarObras().then(setObras, (falha) => setErro(falha.message))
  }, [])

  async function criar(evento) {
    evento.preventDefault()
    setErro('')
    setCriando(true)
    try {
      const obra = await api.criarObra({ titulo: campos.titulo, sinopse: campos.sinopse || null })
      navegar(`/obras/${obra.id}`)
    } catch (falha) {
      setErro(falha.message)
      setCriando(false)
    }
  }

  return (
    <section className="pagina">
      <h1>Suas obras</h1>
      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="grade-de-obras">
        {obras === null && !erro && <p className="vazio">Carregando…</p>}
        {obras?.length === 0 && (
          <p className="vazio">Você ainda não tem obras. Crie a primeira no formulário ao lado.</p>
        )}
        {obras?.map((obra) => (
          <Link key={obra.id} to={`/obras/${obra.id}`} className="cartao cartao-obra">
            <h2>{obra.titulo}</h2>
            {obra.sinopse && <p>{obra.sinopse}</p>}
            <small>
              {plural(obra.atos, 'ato', 'atos')} · {plural(obra.poemas, 'poema', 'poemas')}
            </small>
          </Link>
        ))}

        <form className="cartao cartao-nova-obra" onSubmit={criar}>
          <h2>Nova obra</h2>
          <label>
            Título
            <input
              value={campos.titulo}
              maxLength={200}
              required
              onChange={(evento) => setCampos({ ...campos, titulo: evento.target.value })}
            />
          </label>
          <label>
            Sinopse <small>(opcional)</small>
            <textarea
              rows={3}
              value={campos.sinopse}
              maxLength={2000}
              onChange={(evento) => setCampos({ ...campos, sinopse: evento.target.value })}
            />
          </label>
          <button type="submit" className="botao botao-principal" disabled={criando || !campos.titulo.trim()}>
            Criar obra
          </button>
        </form>
      </div>
    </section>
  )
}

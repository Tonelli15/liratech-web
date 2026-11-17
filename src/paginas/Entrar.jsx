import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

/** Tela de login e de cadastro (RNF04): as duas usam o mesmo formulário. */
export default function Entrar() {
  const { sessao, expirou, aviso, iniciar } = useSessao()
  const local = useLocation()
  const [modo, setModo] = useState('login') // 'login' ou 'cadastro'
  const [campos, setCampos] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (sessao) return <Navigate to={local.state?.destino ?? '/'} replace />

  const alterar = (evento) => setCampos({ ...campos, [evento.target.name]: evento.target.value })

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const resposta =
        modo === 'login'
          ? await api.entrar({ email: campos.email, senha: campos.senha })
          : await api.cadastrar(campos)
      iniciar(resposta)
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  const cadastro = modo === 'cadastro'
  return (
    <div className="entrada">
      <section className="entrada-apresentacao">
        <p className="marca marca-grande">
          Lira<span>Tech</span>
        </p>
        <p className="entrada-lema">Escreva o verso. A métrica e a rima aparecem ao lado.</p>
        <pre className="entrada-exemplo" aria-hidden="true">
          {'A-mor é fo-go que ar-de sem se ver   10  A\n'}
          {'É fe-ri-da que dói e não se sen-te   10  B'}
        </pre>
      </section>

      <form className="cartao entrada-formulario" onSubmit={enviar}>
        <h1>{cadastro ? 'Criar conta' : 'Entrar'}</h1>
        {expirou && !erro && <p className="aviso">Sua sessão expirou. Entre novamente.</p>}
        {aviso && !erro && <p className="aviso aviso-ok">{aviso}</p>}
        {erro && (
          <p className="aviso aviso-erro" role="alert">
            {erro}
          </p>
        )}
        {cadastro && (
          <label>
            Nome
            <input name="nome" value={campos.nome} onChange={alterar} required maxLength={120} autoComplete="name" />
          </label>
        )}
        <label>
          E-mail
          <input name="email" type="email" value={campos.email} onChange={alterar} required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            name="senha"
            type="password"
            value={campos.senha}
            onChange={alterar}
            required
            minLength={cadastro ? 8 : undefined}
            maxLength={72}
            autoComplete={cadastro ? 'new-password' : 'current-password'}
          />
          {cadastro && <small>Mínimo de 8 caracteres.</small>}
        </label>
        <button type="submit" className="botao botao-principal" disabled={enviando}>
          {enviando ? 'Aguarde…' : cadastro ? 'Criar conta' : 'Entrar'}
        </button>
        <button
          type="button"
          className="botao botao-texto"
          onClick={() => {
            setModo(cadastro ? 'login' : 'cadastro')
            setErro('')
          }}
        >
          {cadastro ? 'Já tenho conta' : 'Criar uma conta'}
        </button>
      </form>
    </div>
  )
}

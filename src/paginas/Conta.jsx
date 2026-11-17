import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useSessao } from '../sessao.jsx'

const dataPorExtenso = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Caso de uso "Gerenciar Conta": dados pessoais, troca de senha e exclusão da conta. */
export default function Conta() {
  const { sessao, iniciar, encerrar } = useSessao()
  const [conta, setConta] = useState(null)
  const [dados, setDados] = useState({ nome: '', email: '' })
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmacao: '' })
  const [senhaDaExclusao, setSenhaDaExclusao] = useState('')
  const [retorno, setRetorno] = useState({}) // mensagem de cada formulário: { dados, senha, exclusao }
  const [enviando, setEnviando] = useState('')

  useEffect(() => {
    api.consultarConta().then(
      (resposta) => {
        setConta(resposta)
        setDados({ nome: resposta.nome, email: resposta.email })
      },
      (falha) => setRetorno({ dados: { erro: falha.message } }),
    )
  }, [])

  // Executa a ação de um formulário e guarda a mensagem de sucesso ou de erro desse formulário.
  async function executar(formulario, acao, sucesso) {
    setRetorno((anterior) => ({ ...anterior, [formulario]: null }))
    setEnviando(formulario)
    try {
      await acao()
      setRetorno((anterior) => ({ ...anterior, [formulario]: { ok: sucesso } }))
    } catch (falha) {
      setRetorno((anterior) => ({ ...anterior, [formulario]: { erro: falha.message } }))
    } finally {
      setEnviando('')
    }
  }

  function salvarDados(evento) {
    evento.preventDefault()
    executar(
      'dados',
      async () => {
        const resposta = await api.alterarConta(dados)
        setConta(resposta)
        iniciar({ ...sessao, nome: resposta.nome, email: resposta.email }) // atualiza o nome no cabeçalho
      },
      'Dados atualizados.',
    )
  }

  function trocarSenha(evento) {
    evento.preventDefault()
    if (senhas.novaSenha !== senhas.confirmacao) {
      setRetorno((anterior) => ({ ...anterior, senha: { erro: 'A confirmação não coincide com a nova senha.' } }))
      return
    }
    executar(
      'senha',
      async () => {
        await api.trocarSenha({ senhaAtual: senhas.senhaAtual, novaSenha: senhas.novaSenha })
        setSenhas({ senhaAtual: '', novaSenha: '', confirmacao: '' })
      },
      'Senha alterada.',
    )
  }

  function excluir(evento) {
    evento.preventDefault()
    const certeza = window.confirm(
      'Excluir a conta apaga, de forma definitiva, todas as suas obras, atos, poemas e análises. Continuar?',
    )
    if (!certeza) return
    executar(
      'exclusao',
      async () => {
        await api.excluirConta(senhaDaExclusao)
        encerrar('Sua conta e todas as suas obras foram excluídas.')
      },
      '',
    )
  }

  const mensagem = (formulario) => {
    const item = retorno[formulario]
    if (!item) return null
    if (item.erro) {
      return (
        <p className="aviso aviso-erro" role="alert">
          {item.erro}
        </p>
      )
    }
    return item.ok ? (
      <p className="aviso aviso-ok" role="status">
        {item.ok}
      </p>
    ) : null
  }

  return (
    <section className="pagina pagina-estreita">
      <div>
        <h1>Minha conta</h1>
        {conta && <p className="legenda">Conta criada em {dataPorExtenso(conta.dataCadastro)}.</p>}
      </div>

      <form className="cartao formulario" onSubmit={salvarDados}>
        <h2>Dados pessoais</h2>
        {mensagem('dados')}
        <label>
          Nome
          <input
            value={dados.nome}
            required
            maxLength={120}
            autoComplete="name"
            onChange={(evento) => setDados({ ...dados, nome: evento.target.value })}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={dados.email}
            required
            maxLength={254}
            autoComplete="email"
            onChange={(evento) => setDados({ ...dados, email: evento.target.value })}
          />
        </label>
        <div className="acoes">
          <button type="submit" className="botao botao-principal" disabled={!conta || enviando === 'dados'}>
            Salvar dados
          </button>
        </div>
      </form>

      <form className="cartao formulario" onSubmit={trocarSenha}>
        <h2>Trocar a senha</h2>
        {mensagem('senha')}
        <label>
          Senha atual
          <input
            type="password"
            value={senhas.senhaAtual}
            required
            autoComplete="current-password"
            onChange={(evento) => setSenhas({ ...senhas, senhaAtual: evento.target.value })}
          />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            value={senhas.novaSenha}
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            onChange={(evento) => setSenhas({ ...senhas, novaSenha: evento.target.value })}
          />
          <small>Mínimo de 8 caracteres.</small>
        </label>
        <label>
          Confirme a nova senha
          <input
            type="password"
            value={senhas.confirmacao}
            required
            maxLength={72}
            autoComplete="new-password"
            onChange={(evento) => setSenhas({ ...senhas, confirmacao: evento.target.value })}
          />
        </label>
        <div className="acoes">
          <button type="submit" className="botao botao-principal" disabled={enviando === 'senha'}>
            Trocar senha
          </button>
        </div>
      </form>

      <form className="cartao formulario cartao-perigo" onSubmit={excluir}>
        <h2>Excluir a conta</h2>
        <p className="legenda">
          A exclusão é definitiva: todas as obras, atos, poemas, versos e análises da conta são apagados junto com
          ela.
        </p>
        {mensagem('exclusao')}
        <label>
          Digite a sua senha para confirmar
          <input
            type="password"
            value={senhaDaExclusao}
            required
            autoComplete="current-password"
            onChange={(evento) => setSenhaDaExclusao(evento.target.value)}
          />
        </label>
        <div className="acoes">
          <button type="submit" className="botao botao-perigo-cheio" disabled={enviando === 'exclusao'}>
            Excluir minha conta
          </button>
        </div>
      </form>
    </section>
  )
}

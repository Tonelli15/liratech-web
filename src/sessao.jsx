import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { definirAoExpirar, gravarSessao, lerSessao } from './api.js'

// Contexto: deixa a sessão (usuário logado) disponível para qualquer tela.
const ContextoDaSessao = createContext(null)

export function ProvedorDaSessao({ children }) {
  const [sessao, setSessao] = useState(lerSessao)
  const [expirou, setExpirou] = useState(false)

  const iniciar = useCallback((nova) => {
    gravarSessao(nova)
    setExpirou(false)
    setAviso('')
    setSessao(nova)
  }, [])

  const [aviso, setAviso] = useState('')

  // "mensagem" aparece na tela de login (ex.: depois de excluir a conta).
  const encerrar = useCallback((mensagem = '') => {
    gravarSessao(null)
    setAviso(typeof mensagem === 'string' ? mensagem : '')
    setSessao(null)
  }, [])

  // Quando a API recusa o token (401), a sessão é encerrada e a tela de login avisa o motivo.
  useEffect(() => {
    definirAoExpirar(() => {
      gravarSessao(null)
      setExpirou(true)
      setSessao(null)
    })
  }, [])

  const valor = useMemo(
    () => ({ sessao, expirou, aviso, iniciar, encerrar }),
    [sessao, expirou, aviso, iniciar, encerrar],
  )
  return <ContextoDaSessao.Provider value={valor}>{children}</ContextoDaSessao.Provider>
}

export function useSessao() {
  return useContext(ContextoDaSessao)
}

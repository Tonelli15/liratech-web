import { useState } from 'react'

/** Campo de uma linha com botão: usado para criar e renomear atos e poemas. */
export default function CampoRapido({ rotulo, botao, valorInicial = '', aoEnviar, aoCancelar }) {
  const [valor, setValor] = useState(valorInicial)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    if (!valor.trim()) return
    setEnviando(true)
    try {
      await aoEnviar(valor.trim())
      if (!aoCancelar) setValor('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="linha-de-campo" onSubmit={enviar}>
      <input
        aria-label={rotulo}
        placeholder={rotulo}
        value={valor}
        maxLength={200}
        autoFocus={Boolean(aoCancelar)}
        onChange={(evento) => setValor(evento.target.value)}
      />
      <button type="submit" className="botao" disabled={enviando || !valor.trim()}>
        {botao}
      </button>
      {aoCancelar && (
        <button type="button" className="botao botao-discreto" onClick={aoCancelar}>
          Cancelar
        </button>
      )}
    </form>
  )
}

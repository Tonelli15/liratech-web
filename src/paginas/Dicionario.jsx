import BuscaDeRimas from '../componentes/BuscaDeRimas.jsx'

export default function Dicionario() {
  return (
    <section className="pagina pagina-estreita">
      <h1>Dicionário de rimas</h1>
      <p className="legenda">
        O dicionário reúne as palavras finais dos versos já analisados na plataforma e as agrupa pela terminação
        sonora. Ele mostra apenas palavras isoladas, nunca os versos de outras pessoas.
      </p>
      <div className="cartao">
        <BuscaDeRimas />
      </div>
    </section>
  )
}

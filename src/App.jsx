import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Moldura from './componentes/Moldura.jsx'
import Conta from './paginas/Conta.jsx'
import Dicionario from './paginas/Dicionario.jsx'
import Editor from './paginas/Editor.jsx'
import Entrar from './paginas/Entrar.jsx'
import Obra from './paginas/Obra.jsx'
import Obras from './paginas/Obras.jsx'
import { useSessao } from './sessao.jsx'

/** Rotas protegidas: sem sessão, o usuário é levado à tela de login. */
function Protegida() {
  const { sessao } = useSessao()
  const local = useLocation()
  if (!sessao) return <Navigate to="/entrar" replace state={{ destino: local.pathname }} />
  return (
    <Moldura>
      <Outlet />
    </Moldura>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<Entrar />} />
      <Route element={<Protegida />}>
        <Route path="/" element={<Obras />} />
        <Route path="/obras/:idObra" element={<Obra />} />
        <Route path="/poemas/:idPoema" element={<Editor />} />
        <Route path="/rimas" element={<Dicionario />} />
        <Route path="/conta" element={<Conta />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

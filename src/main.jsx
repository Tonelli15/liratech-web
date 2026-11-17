import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ProvedorDaSessao } from './sessao.jsx'
import './estilos.css'

ReactDOM.createRoot(document.getElementById('raiz')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProvedorDaSessao>
        <App />
      </ProvedorDaSessao>
    </BrowserRouter>
  </React.StrictMode>,
)

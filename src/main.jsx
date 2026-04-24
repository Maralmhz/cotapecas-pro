import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Erro ao renderizar a aplicação:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: 560, background: '#fff', border: '1px solid #dbeafe', borderRadius: 16, padding: 24 }}>
            <h1 style={{ margin: 0, color: '#1e3a8a' }}>Ocorreu um erro ao carregar a página</h1>
            <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.5 }}>
              Tente atualizar o navegador. Se o problema continuar, limpe os dados salvos do site
              (localStorage) e abra novamente.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
)

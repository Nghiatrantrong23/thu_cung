import {ThemeProvider} from './data/khoGiaoDien.jsx'
import './theme-components.css'
import './theme.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './data/khoXacThuc.jsx'
import { PetProvider } from './data/khoThuCung.jsx'
import { BookingProvider } from './data/khoLichHen.jsx'
import {ToastProvider} from './components/ui/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider><HashRouter>
      <AuthProvider>
        <PetProvider>
          <BookingProvider>
            <ToastProvider><App /></ToastProvider>
          </BookingProvider>
        </PetProvider>
      </AuthProvider>
    </HashRouter></ThemeProvider>
  </StrictMode>,
)

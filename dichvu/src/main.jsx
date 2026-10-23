import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './data/khoXacThuc.jsx'
import { PetProvider } from './data/khoThuCung.jsx'
import { BookingProvider } from './data/khoLichHen.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <PetProvider>
          <BookingProvider>
            <App />
          </BookingProvider>
        </PetProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Appbis from './Appbis'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Appbis />
  </StrictMode>,
)

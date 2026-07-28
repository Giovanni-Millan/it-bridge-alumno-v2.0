import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'

import './App.css'
import Dashboard from './pages/Dashboard/Dashboard'
import ConsultarCalificaciones from './pages/ConsultarCalificaciones/ConsultarCalificaciones'
import HistorialAcademico from './pages/HistorialAcademico/HistorialAcademico'
import Perfiles from './pages/Perfiles/Perfiles'
import RealizarSeguimientoEmocional from './pages/RealizarSeguimientoEmocional/RealizarSeguimientoEmocional'
import Login from './pages/Login/Login'
import ListarAlumno from './pages/Perfiles/ListarPerfil'

function App() {
  

  return (
    <Router>
	      <Routes>
          <Route path='/' Component={Login}/>
	        <Route path='/dashboard' Component={Dashboard}/> 
          <Route path='/ConsultarCalificaciones' Component={ConsultarCalificaciones}/>
          <Route path='/HistorialAcademico' Component={HistorialAcademico}/>
          <Route path='/ConsultarPerfiles' Component={Perfiles}/> 
          <Route path='/RealizarSeguimientoEmocional' Component={RealizarSeguimientoEmocional}/>  
          <Route path='/ListarAlumno/:id' Component={ListarAlumno}/>  
	        
	      </Routes>
	    </Router>
  )
}

export default App

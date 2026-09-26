import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'

import './App.css'
import Dashboard from './pages/Dashboard/Dashboard'
import ConsultarCalificaciones from './pages/ConsultarCalificaciones/ConsultarCalificaciones'
import HistorialAcademico from './pages/HistorialAcademico/HistorialAcademico'
import Perfiles from './pages/Perfiles/Perfiles'
import RealizarSeguimientoEmocional from './pages/RealizarSeguimientoEmocional/RealizarSeguimientoEmocional'
import Login from './pages/Login/Login'
import ListarAlumno from './pages/Perfiles/ListarPerfil'
import RutaProtegida from './components/RutaProtegida.jsx'

function App() {
  

  return (
    <Router>
	      <Routes>
          <Route path='/' Component={Login}/>

          {/* Todo lo de abajo requiere sesión real con rol "alumno" — si no,
              RutaProtegida regresa al Login en vez de dejar montar la pantalla. */}
          <Route element={<RutaProtegida rol="alumno" />}>

	        <Route path='/dashboard' Component={Dashboard}/>
          <Route path='/ConsultarCalificaciones' Component={ConsultarCalificaciones}/>
          <Route path='/HistorialAcademico' Component={HistorialAcademico}/>
          <Route path='/ConsultarPerfiles' Component={Perfiles}/>
          <Route path='/RealizarSeguimientoEmocional' Component={RealizarSeguimientoEmocional}/>
          <Route path='/ListarAlumno/:id' Component={ListarAlumno}/>

          </Route>
          {/* fin de las rutas protegidas */}

	      </Routes>
	    </Router>
  )
}

export default App

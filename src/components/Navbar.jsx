import React from 'react'
import './navbar.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import logo from '../assets/logo.png'

export default function Navbar(props) {
  return (
    <nav className='bg-purple-950 flex justify-between items-center gap-3 py-3 px-3'>
        <div className='shrink-0'>
            <img src={logo} className='logo-sm bg-white rounded-full p-1' />
        </div>

        <div className='text-white font-thin text-lg sm:text-2xl md:text-3xl truncate min-w-0 text-center'>
            {props.titulo}
        </div>

        <div className='shrink-0 w-10 sm:w-12'>

        </div>
    </nav>
  )
}


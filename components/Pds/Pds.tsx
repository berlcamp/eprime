'use client'
import React, { useState } from 'react'
import PersonalInfo from './PersonalInfo'
import FamilyBackground from './FamilyBackground'
import EducationalBackground from './EducationalBackground'
import Eligibility from './Eligibility'
import WorkExperience from './WorkExperience'
import VoluntaryWork from './VoluntaryWork'
import Trainings from './Trainings'
import Other from './Other'
import References from './References'

interface PageProps {
  userId: string
}

const Pds = ({ userId }: PageProps) => {
  const [activeMenu, setActiveMenu] = useState('personal')
  return (
    <>
      <div className='border-t'>
        {/* Modal Content */}
        <div className='flex flex-col md:flex-row items-start justify-start'>
          <div className='app__modal_menu'>
            <ul>
              <li onClick={() => setActiveMenu('personal')} className={`${activeMenu === 'personal' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Personnal Information</li>
              <li onClick={() => setActiveMenu('family')} className={`${activeMenu === 'family' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Family Background</li>
              <li onClick={() => setActiveMenu('educational')} className={`${activeMenu === 'educational' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Educational Background</li>
              <li onClick={() => setActiveMenu('eligibility')} className={`${activeMenu === 'eligibility' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Civil Service Eligibility</li>
              <li onClick={() => setActiveMenu('work')} className={`${activeMenu === 'work' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Work Experience</li>
              <li onClick={() => setActiveMenu('voluntary')} className={`${activeMenu === 'voluntary' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Voluntary Work</li>
              <li onClick={() => setActiveMenu('trainings')} className={`${activeMenu === 'trainings' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>L&D Interventions/Trainings</li>
              <li onClick={() => setActiveMenu('other')} className={`${activeMenu === 'other' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Other Information</li>
              {/* <li onClick={() => setActiveMenu('question')} className={`${activeMenu === 'question' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Questionaires</li> */}
              <li onClick={() => setActiveMenu('references')} className={`${activeMenu === 'references' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>References</li>
            </ul>
          </div>
          <div className='p-2 flex-1 overflow-x-scroll'>
            {
              activeMenu === 'personal' && <PersonalInfo userId={userId}/>
            }
            {
              activeMenu === 'family' && <FamilyBackground userId={userId}/>
            }
            {
              activeMenu === 'educational' && <EducationalBackground userId={userId}/>
            }
            {
              activeMenu === 'eligibility' && <Eligibility userId={userId}/>
            }
            {
              activeMenu === 'work' && <WorkExperience userId={userId}/>
            }
            {
              activeMenu === 'voluntary' && <VoluntaryWork userId={userId}/>
            }
            {
              activeMenu === 'trainings' && <Trainings userId={userId}/>
            }
            {
              activeMenu === 'other' && <Other userId={userId}/>
            }
            {/* {
              activeMenu === 'question' && <PersonalInfo userId={userId}/>
            } */}
            {
              activeMenu === 'references' && <References userId={userId}/>
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default Pds

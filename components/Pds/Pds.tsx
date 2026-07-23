'use client'
import { useState } from 'react'
import { PdsDirtyContext, usePdsDirtyRegistry } from './pdsDirty'
import EducationalBackground from './EducationalBackground'
import Eligibility from './Eligibility'
import FamilyBackground from './FamilyBackground'
import Other from './Other'
import PersonalInfo from './PersonalInfo'
import References from './References'
import Trainings from './Trainings'
import VoluntaryWork from './VoluntaryWork'
import WorkExperience from './WorkExperience'

interface PageProps {
  userId: string
}

const Pds = ({ userId }: PageProps) => {
  const [activeMenu, setActiveMenu] = useState('personal')
  const { contextValue, isActiveTabDirty } = usePdsDirtyRegistry()

  // Every tab saves separately and is unmounted the moment another one is
  // opened, so leaving with unsaved work silently discards it.
  const handleMenuClick = (menu: string) => {
    if (menu === activeMenu) return

    if (
      isActiveTabDirty() &&
      !window.confirm(
        'You have unsaved changes on this tab. Leaving will discard them. Leave without saving?'
      )
    ) {
      return
    }

    setActiveMenu(menu)
  }

  return (
    <PdsDirtyContext.Provider value={contextValue}>
      <div className="border-t">
        {/* Modal Content */}
        <div className="flex flex-col md:flex-row items-start justify-start">
          <div className="app__modal_menu">
            <ul>
              <li
                onClick={() => handleMenuClick('personal')}
                className={`${
                  activeMenu === 'personal'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Personal Information
              </li>
              <li
                onClick={() => handleMenuClick('family')}
                className={`${
                  activeMenu === 'family'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Family Background
              </li>
              <li
                onClick={() => handleMenuClick('educational')}
                className={`${
                  activeMenu === 'educational'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Educational Background
              </li>
              <li
                onClick={() => handleMenuClick('eligibility')}
                className={`${
                  activeMenu === 'eligibility'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Civil Service Eligibility
              </li>
              <li
                onClick={() => handleMenuClick('work')}
                className={`${
                  activeMenu === 'work'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Work Experience
              </li>
              <li
                onClick={() => handleMenuClick('voluntary')}
                className={`${
                  activeMenu === 'voluntary'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Voluntary Work
              </li>
              <li
                onClick={() => handleMenuClick('trainings')}
                className={`${
                  activeMenu === 'trainings'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                L&D Interventions/Trainings
              </li>
              <li
                onClick={() => handleMenuClick('other')}
                className={`${
                  activeMenu === 'other'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                Other Information
              </li>
              {/* <li onClick={() => handleMenuClick('question')} className={`${activeMenu === 'question' ? 'app__modal_menu_link_active' : 'app__modal_menu_link'}`}>Questionaires</li> */}
              <li
                onClick={() => handleMenuClick('references')}
                className={`${
                  activeMenu === 'references'
                    ? 'app__modal_menu_link_active'
                    : 'app__modal_menu_link'
                }`}
              >
                References
              </li>
            </ul>
          </div>
          <div className="p-2 flex-1 overflow-x-scroll">
            {activeMenu === 'personal' && <PersonalInfo userId={userId} />}
            {activeMenu === 'family' && <FamilyBackground userId={userId} />}
            {activeMenu === 'educational' && (
              <EducationalBackground userId={userId} />
            )}
            {activeMenu === 'eligibility' && <Eligibility userId={userId} />}
            {activeMenu === 'work' && <WorkExperience userId={userId} />}
            {activeMenu === 'voluntary' && <VoluntaryWork userId={userId} />}
            {activeMenu === 'trainings' && <Trainings userId={userId} />}
            {activeMenu === 'other' && <Other userId={userId} />}
            {/* {
              activeMenu === 'question' && <PersonalInfo userId={userId}/>
            } */}
            {activeMenu === 'references' && <References userId={userId} />}
          </div>
        </div>
      </div>
    </PdsDirtyContext.Provider>
  )
}

export default Pds

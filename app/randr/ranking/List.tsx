'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem } from '@/GlobalRedux/Features/listSlice'
import { RootState } from '@/types' // Import the RootState type
import { RrRanking } from '@/types/rrTypes'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDown,
  ListCheck,
  PencilIcon,
  TrashIcon,
  User2Icon
} from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { AddRankingModal } from './AddRankingModal'
import { ModalCriteria } from './ModalCriteria'
import { ModalEmployees } from './ModalEmployees'
import { ModalRaters } from './ModalRaters'

// Always update this on other pages
type ItemType = RrRanking
const table = 'rr_rankings'

export const List = () => {
  // Redux staff
  const dispatch = useDispatch()
  const list = useSelector((state: RootState) => state.list.value)

  const { supabase } = useSupabase()

  const [modalRatersOpen, setModalRatersOpen] = useState(false)
  const [modalEmployeeOpen, setModalEmployeeOpen] = useState(false)
  const [modalCriteriaOpen, setModalCriteriaOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }
  const handleManageCandidate = (item: ItemType) => {
    setSelectedItem(item)
    setModalEmployeeOpen(true)
  }
  const handleManageRaters = (item: ItemType) => {
    setSelectedItem(item)
    setModalRatersOpen(true)
  }
  const handleManageCriteria = (item: ItemType) => {
    setSelectedItem(item)
    setModalCriteriaOpen(true)
  }

  // Delete
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        if (error.code === '23503') {
          toast.error('This template cannot be deleted as it is used')
        }
        console.error('Error deleting:', error.message)
      } else {
        toast.success('Successfully deleted!')

        // delete item to Redux
        dispatch(deleteItem({ id: selectedItem.id }))
        setIsModalOpen(false)
      }
    }
  }
  return (
    <div className="overflow-x-none">
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Title</th>
            <th className="app__th">Description</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <tr key={item.id} className="app__tr">
              <td className="w-6 pl-4 app__td">
                <Menu as="div" className="app__menu_container">
                  <div>
                    <Menu.Button className="app__dropdown_btn">
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="app__dropdown_items">
                      <div className="py-1">
                        <Menu.Item>
                          <div
                            onClick={() => handleManageCandidate(item)}
                            className="app__dropdown_item"
                          >
                            <User2Icon className="w-4 h-4" />
                            <span>Manage Candidates</span>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div
                            onClick={() => handleManageRaters(item)}
                            className="app__dropdown_item"
                          >
                            <User2Icon className="w-4 h-4" />
                            <span>Manage Raters</span>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div
                            onClick={() => handleManageCriteria(item)}
                            className="app__dropdown_item"
                          >
                            <ListCheck className="w-4 h-4" />
                            <span>Manage Ranking Criteria</span>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div
                            onClick={() => handleEdit(item)}
                            className="app__dropdown_item"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit Details</span>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div
                            onClick={() => handleDeleteConfirmation(item)}
                            className="app__dropdown_item"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </div>
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div>{item.title}</div>
              </td>
              <td className="app__td">
                <div>{item.description}</div>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr className="app__tr">
              <td className="app__td" colSpan={3}>
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this?"
      />
      <AddRankingModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      <ModalEmployees
        isOpen={modalEmployeeOpen}
        editData={selectedItem}
        onClose={() => setModalEmployeeOpen(false)}
      />
      <ModalRaters
        isOpen={modalRatersOpen}
        editData={selectedItem}
        onClose={() => setModalRatersOpen(false)}
      />
      <ModalCriteria
        isOpen={modalCriteriaOpen}
        editData={selectedItem}
        onClose={() => setModalCriteriaOpen(false)}
      />
    </div>
  )
}

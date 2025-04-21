'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem } from '@/GlobalRedux/Features/list2Slice'
import { RootState } from '@/types' // Import the RootState type
import { CompetencyItemTypes, CompetencyTypes } from '@/types/pmsTypes'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, PencilIcon, TrashIcon } from 'lucide-react'
import React, { Fragment, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AddObjectiveModal } from './AddObjectiveModal'

// Always update this on other pages
type ItemType = CompetencyItemTypes

export const ObjectivesList = ({ editData }: { editData: CompetencyTypes }) => {
  const dispatch = useDispatch()
  const { supabase } = useSupabase()

  const list = useSelector((state: RootState) => state.list2.value)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedItem(null)
    setModalAddOpen(true)
  }
  const handleEdit = (item: ItemType) => {
    setSelectedItem(item)
    setModalAddOpen(true)
  }

  // Delete
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from('pms_competency_items')
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting:', error.message)
      } else {
        // delete item to Redux
        dispatch(deleteItem({ id: selectedItem.id }))
        setIsModalOpen(false)
      }
    }
  }

  return (
    <div className="overflow-x-none pb-20">
      <div className="app__title">
        <h1 className="capitalize flex-1"></h1>

        <Button onClick={handleAdd} className="ml-auto">
          Add Item
        </Button>
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Competency Item</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <React.Fragment key={item.id}>
              {/* Quality Row */}
              <tr key={`${item.id}-quality`} className="app__tr">
                <td className="w-6 pl-4 app__td">
                  <Menu as="div" className="app__menu_container">
                    <div>
                      <Menu.Button className="app__dropdown_btn">
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
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
                              onClick={() => handleEdit(item)}
                              className="app__dropdown_item"
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit</span>
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
                <td className="app__td">{item.title}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this?"
      />

      <AddObjectiveModal
        compId={editData.id}
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
    </div>
  )
}

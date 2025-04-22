'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem } from '@/GlobalRedux/Features/list2Slice'
import { RootState } from '@/types' // Import the RootState type
import { IpcrfTemplatesObjectives, IpcrfTemplatesTypes } from '@/types/pmsTypes'
import { Menu, Transition } from '@headlessui/react'
import {
  CheckIcon,
  ChevronDown,
  PencilIcon,
  TrashIcon,
  XIcon
} from 'lucide-react'
import React, { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { AddObjectiveModal } from './AddObjectiveModal'

// Always update this on other pages
type ItemType = IpcrfTemplatesObjectives

export const ObjectivesList = ({
  editData
}: {
  editData: IpcrfTemplatesTypes
}) => {
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
        .from('pms_ipcrf_template_objectives')
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting:', error.message)
      } else {
        toast.success('Successfully deleted!')

        // delete item to Redux
        dispatch(deleteItem({ id: selectedItem.id }))
        setIsModalOpen(false)
      }
    }
  }

  const totalWeight = (list as ItemType[]).reduce(
    (total, item) => total + item.weight,
    0
  )

  return (
    <div className="overflow-x-none pb-20">
      <div className="app__title">
        <h1 className="capitalize flex-1">Total Weight: {totalWeight}</h1>
        {editData.status !== 'Published' && (
          <Button onClick={handleAdd} className="ml-auto">
            Add Objective
          </Button>
        )}
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Objective</th>
            <th className="app__th">QET</th>
            <th className="app__th">Outstanding</th>
            <th className="app__th">Very Satisfactory</th>
            <th className="app__th">Satisfactory</th>
            <th className="app__th">Unsatisfactory</th>
            <th className="app__th">Poor</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item: ItemType) => (
            <React.Fragment key={item.id}>
              {/* Quality Row */}
              <tr key={`${item.id}-quality`} className="app__tr">
                <td className="w-6 pl-4 app__td" rowSpan={3}>
                  {editData.status !== 'Published' && (
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
                  )}
                </td>
                <td className="app__td" rowSpan={3}>
                  <div className="space-y-2">
                    <div>{item.objective?.title}</div>
                    <div className="space-x-2">
                      <Badge>Timeline: {item.timeline}</Badge>
                      <Badge>Weight: {item.weight}</Badge>
                    </div>
                    {item.target && (
                      <div className="space-x-2">
                        <Badge>Target: {item.target ?? ''}</Badge>
                      </div>
                    )}
                  </div>
                </td>
                <td className="app__td">
                  <div className="flex space-x-1">
                    <span>Quality </span>
                    <CheckIcon className="text-green-500 w-4 h-4" />
                  </div>
                </td>
                <td className="app__td">{item.quality_outstanding}</td>
                <td className="app__td">{item.quality_very_satisfactory}</td>
                <td className="app__td">{item.quality_satisfactory}</td>
                <td className="app__td">{item.quality_unsatisfactory}</td>
                <td className="app__td">{item.quality_poor}</td>
              </tr>

              {/* Efficiency Row */}
              <tr key={`${item.id}-efficiency`} className="app__tr">
                <td className="app__td">
                  <div className="flex space-x-1">
                    <span>Efficiency </span>
                    {item.efficiency ? (
                      <CheckIcon className="text-green-500 w-4 h-4" />
                    ) : (
                      <XIcon className="text-red-500 w-4 h-4" />
                    )}
                  </div>
                </td>
                <td className="app__td">{item.efficiency_outstanding}</td>
                <td className="app__td">{item.efficiency_very_satisfactory}</td>
                <td className="app__td">{item.efficiency_satisfactory}</td>
                <td className="app__td">{item.efficiency_unsatisfactory}</td>
                <td className="app__td">{item.efficiency_poor}</td>
              </tr>

              {/* Timeliness Row */}
              <tr key={`${item.id}-timeliness`} className="app__tr">
                <td className="app__td">
                  <div className="flex space-x-1">
                    <span>Timeliness </span>
                    {item.timeliness ? (
                      <CheckIcon className="text-green-500 w-4 h-4" />
                    ) : (
                      <XIcon className="text-red-500 w-4 h-4" />
                    )}
                  </div>
                </td>
                <td className="app__td">{item.timeliness_outstanding}</td>
                <td className="app__td">{item.timeliness_very_satisfactory}</td>
                <td className="app__td">{item.timeliness_satisfactory}</td>
                <td className="app__td">{item.timeliness_unsatisfactory}</td>
                <td className="app__td">{item.timeliness_poor}</td>
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
        templateId={editData.id}
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
    </div>
  )
}

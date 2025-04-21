'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem, editList } from '@/GlobalRedux/Features/listSlice'
import { RootState } from '@/types' // Import the RootState type
import { IpcrfTemplatesTypes } from '@/types/pmsTypes'
import { Menu, Transition } from '@headlessui/react'
import { CheckBadgeIcon } from '@heroicons/react/20/solid'
import { ChevronDown, EyeIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { AddIpcrfModal } from './AddIpcrfModal'
import { CompetenciesModal } from './CompetenciesModal'
import { ObjectivesModal } from './ObjectivesModal'

// Always update this on other pages
type ItemType = IpcrfTemplatesTypes
const table = 'pms_ipcrf_templates'

export const List = () => {
  // Redux staff
  const dispatch = useDispatch()
  const list = useSelector((state: RootState) => state.list.value)

  const { supabase } = useSupabase()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [modalObjOpen, setModalObjOpen] = useState(false)
  const [modalCompetencyOpen, setModalCompetencyOpen] = useState(false)
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
  const handlePublishConfirmation = async (item: ItemType, period: string) => {
    const { error } = await supabase
      .from(table)
      .update({ status: period })
      .eq('id', item.id)

    if (error) {
      console.error('Error publishing:', error.message)
    } else {
      toast.success('Successfully saved!')

      // updated item to Redux
      dispatch(
        editList({
          ...item,
          status: period,
          id: item.id
        })
      )
    }
  }
  const handleManageObjectives = (item: ItemType) => {
    setSelectedItem(item)
    setModalObjOpen(true)
  }
  const handleManageCompetencies = (item: ItemType) => {
    setSelectedItem(item)
    setModalCompetencyOpen(true)
  }

  // Delete
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
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
  return (
    <div className="overflow-x-none">
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Description</th>
            <th className="app__th">Type</th>
            <th className="app__th">Positions</th>
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
                        {item.status === 'Published' && (
                          <>
                            <Menu.Item>
                              <div
                                onClick={() => handleManageObjectives(item)}
                                className="app__dropdown_item"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>View Objectives and Indicators</span>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div
                                onClick={() => handleManageObjectives(item)}
                                className="app__dropdown_item"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>View Competencies</span>
                              </div>
                            </Menu.Item>
                          </>
                        )}
                        {item.status !== 'Published' && (
                          <>
                            <Menu.Item>
                              <div
                                onClick={() => handleManageObjectives(item)}
                                className="app__dropdown_item"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span>Manage Objectives and Indicators</span>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div
                                onClick={() => handleManageCompetencies(item)}
                                className="app__dropdown_item"
                              >
                                <PencilIcon className="w-4 h-4" />
                                <span>Manage Competencies</span>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div
                                onClick={() =>
                                  handlePublishConfirmation(item, '1st')
                                }
                                className="app__dropdown_item"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span>Enable 1st Rating Period</span>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div
                                onClick={() =>
                                  handlePublishConfirmation(item, '2nd')
                                }
                                className="app__dropdown_item"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span>Enable 2nd Rating Period</span>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div
                                onClick={() =>
                                  handlePublishConfirmation(item, 'Disabled')
                                }
                                className="app__dropdown_item"
                              >
                                <CheckBadgeIcon className="w-4 h-4" />
                                <span>Disable Rating</span>
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
                          </>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div>
                  #{item.id} {item.description}
                </div>
                <div className="mt-2">
                  {item.status === 'Disabled' ? (
                    <Badge variant="outline">Rating Disabled</Badge>
                  ) : (
                    <Badge variant="green">{item.status} Period</Badge>
                  )}
                </div>
              </td>
              <td className="app__td">{item.type}</td>
              <td className="app__td">
                <div className="space-x-2">
                  {item.positions?.map((p) => (
                    <Badge key={p.position_id}>{p.position?.name}</Badge>
                  ))}
                </div>
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
      <AddIpcrfModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
      {selectedItem && modalObjOpen && (
        <ObjectivesModal
          isOpen={modalObjOpen}
          editData={selectedItem}
          onClose={() => setModalObjOpen(false)}
        />
      )}
      {selectedItem && modalCompetencyOpen && (
        <CompetenciesModal
          isOpen={modalCompetencyOpen}
          editData={selectedItem}
          onClose={() => setModalCompetencyOpen(false)}
        />
      )}
    </div>
  )
}

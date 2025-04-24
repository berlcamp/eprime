'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem } from '@/GlobalRedux/Features/listSlice'
import { RootState } from '@/types' // Import the RootState type
import { Idp, IpcrfCompetencyRating } from '@/types/pmsTypes'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, PencilIcon, TrashIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { AddCompModal } from './AddCompModal'

// Always update this on other pages
type ItemType = Idp
const table = 'pms_idp'

export const ListComp = ({
  ipcrfId,
  compRatings
}: {
  ipcrfId: number
  compRatings: IpcrfCompetencyRating[]
}) => {
  // Redux staff
  const dispatch = useDispatch()
  const list = useSelector((state: RootState) => state.list2.value)

  const [modalAdd, setModalAdd] = useState(false)
  const [type, setType] = useState('')

  const { supabase } = useSupabase()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleEdit = (item: ItemType, type: string) => {
    setSelectedItem(item)
    setModalAdd(true)
    if (type === 'weak') {
      setType(type)
    } else {
      setType(type)
    }
  }

  const handleAdd = (type: string) => {
    setSelectedItem(null)
    setModalAdd(true)
    setType(type)
  }

  // Delete Supplier
  const handleDelete = async () => {
    if (selectedItem) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error deleting supplier:', error.message)
      } else {
        toast.success('Successfully deleted!')

        // delete item to Redux
        dispatch(deleteItem({ id: selectedItem.id }))
        setIsModalOpen(false)
      }
    }
  }

  return (
    <div className="overflow-x-none mt-10">
      <div className="flex space-x-2 mb-2">
        <div className="flex-1 text-xl font-medium">Compentencies</div>
        <Button onClick={() => handleAdd('strength')} className="ml-auto">
          Add Strength
        </Button>
        <Button onClick={() => handleAdd('weak')} className="ml-auto">
          Add Weakness
        </Button>
      </div>
      <table className="app__table">
        <thead className="app__thead">
          <tr>
            <th className="app__th"></th>
            <th className="app__th">Strength</th>
            <th className="app__th">Development Needs</th>
            <th className="app__th">Learning Objective</th>
            <th className="app__th">Intervention</th>
            <th className="app__th">Timeline</th>
            <th className="app__th">Resources Needed</th>
          </tr>
        </thead>
        <tbody>
          {list?.map((item: ItemType) => (
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
                            onClick={() => handleEdit(item, item.type)}
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
              <td className="app__td">
                {item.type === 'strength' && (
                  <div>
                    {item.is_custom_competency ? (
                      item.custom_competency
                    ) : (
                      <span>
                        {item.competency_item?.competency?.title} -{' '}
                        {item.competency_item?.title}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="app__td">
                {item.type === 'weak' && (
                  <div>
                    {item.is_custom_competency ? (
                      item.custom_competency
                    ) : (
                      <span>
                        {item.competency_item?.competency?.title} -{' '}
                        {item.competency_item?.title}
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className="app__td">{item.learning_objective}</td>
              <td className="app__td">
                {item.is_custom_intervention
                  ? item.custom_intervention
                  : item.intervention}
              </td>
              <td className="app__td">{item.timeline}</td>
              <td className="app__td">{item.resources}</td>
            </tr>
          ))}
          {(!list || list?.length === 0) && (
            <tr className="app__tr">
              <td className="app__td" colSpan={7}>
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
      <AddCompModal
        type={type}
        ipcrfId={ipcrfId}
        compRatings={compRatings}
        isOpen={modalAdd}
        editData={selectedItem}
        onClose={() => setModalAdd(false)}
      />
    </div>
  )
}

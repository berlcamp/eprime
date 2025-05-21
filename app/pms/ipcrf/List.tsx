'use client'

import { ConfirmationModal } from '@/components/ConfirmationModal'
import { UserBlock } from '@/components/index'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/context/SupabaseProvider'
import { deleteItem } from '@/GlobalRedux/Features/listSlice'
import { RootState } from '@/types' // Import the RootState type
import { IpcrfTypes } from '@/types/pmsTypes'
import { Menu, Transition } from '@headlessui/react'
import {
  ChevronDown,
  EyeIcon,
  Lightbulb,
  PencilIcon,
  TrashIcon
} from 'lucide-react'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { AddModal } from './AddModal'

// Always update this on other pages
type ItemType = IpcrfTypes
const table = 'pms_ipcrf'

export const List = () => {
  // Redux staff

  const dispatch = useDispatch()
  const list = useSelector((state: RootState) => state.list.value)

  const { supabase, session } = useSupabase()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAddOpen, setModalAddOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)

  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  // Delete Supplier
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
            <th className="app__th">Ratee</th>
            <th className="app__th">Rater</th>
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
                        {(session?.user.id === item.user_id ||
                          session?.user.id === item.rater_id) && (
                          <Menu.Item>
                            <Link
                              href={`/pms/ipcrf/${item.id}/rates`}
                              target="_blank"
                              className="app__dropdown_item"
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit Ratings</span>
                            </Link>
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          <Link
                            href={`/pms/ipcrf/${item.id}/summary?period=1st`}
                            target="_blank"
                            className="app__dropdown_item"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>1st Period Ratings Summary</span>
                          </Link>
                        </Menu.Item>
                        <Menu.Item>
                          <Link
                            href={`/pms/ipcrf/${item.id}/summary?period=2nd`}
                            target="_blank"
                            className="app__dropdown_item"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>2nd Period Ratings Summary</span>
                          </Link>
                        </Menu.Item>
                        <Menu.Item>
                          <Link
                            href={`/pms/ipcrf/${item.id}/idp`}
                            target="_blank"
                            className="app__dropdown_item"
                          >
                            <Lightbulb className="w-4 h-4" />
                            <span>Individual Development Plan</span>
                          </Link>
                        </Menu.Item>
                        {session?.user.id === item.user_id && (
                          <Menu.Item>
                            <div
                              onClick={() => handleDeleteConfirmation(item)}
                              className="app__dropdown_item"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </div>
                          </Menu.Item>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </td>
              <td className="app__td">
                <div>{item.description}</div>
                <div className="mt-2">
                  {item.template?.status === 'Disabled' ? (
                    <Badge variant="outline">Rating Disabled</Badge>
                  ) : (
                    <Badge variant="green">
                      {item.template?.status} Period
                    </Badge>
                  )}
                </div>
              </td>
              <td className="app__td">
                <UserBlock user={item.ratee} />
              </td>
              <td className="app__td">
                <UserBlock user={item.rater} />
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr className="app__tr">
              <td className="app__td" colSpan={4}>
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
      <AddModal
        isOpen={modalAddOpen}
        editData={selectedItem}
        onClose={() => setModalAddOpen(false)}
      />
    </div>
  )
}

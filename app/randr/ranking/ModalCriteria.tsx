'use client'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/context/SupabaseProvider'
import {
  addItem,
  deleteItem,
  updateList
} from '@/GlobalRedux/Features/list2Slice'
import { RootState } from '@/types'
import { RrCriterion, RrRanking } from '@/types/rrTypes'
import { Dialog, Menu, Transition } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, TrashIcon } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = RrCriterion
const table = 'rr_criteria'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: RrRanking | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  weight: z.coerce.number().min(1, 'Weight is required'),
  name: z.string().min(1, 'Criteria name is required')
})
type FormType = z.infer<typeof FormSchema>

export const ModalCriteria = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const dispatch = useDispatch()
  const list = useSelector((state: RootState) => state.list2.value)

  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      weight: 0,
      name: ''
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (!editData) return

    if (isSubmitting) return // 🚫 Prevent double-submit

    setIsSubmitting(true)

    try {
      const newData = {
        weight: formdata.weight,
        name: formdata.name,
        ranking_id: editData.id
      }

      // Add new one
      const { data, error } = await supabase
        .from(table)
        .insert([newData])
        .select()

      if (error) {
        console.error('Error adding:', error)
      } else {
        // Insert new item to Redux
        dispatch(
          addItem({
            ...newData,
            id: data[0].id
          })
        )
        toast.success('Successfully saved!')
        form.reset({
          weight: 0,
          name: ''
        })
      }
    } catch (err) {
      console.error(err)
      toast.error(`Submission error: ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  // Handle opening the confirmation modal for deleting a supplier
  const handleDeleteConfirmation = (item: ItemType) => {
    setSelectedItem(item)
    setIsModalOpen(true)
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

  // Fetch on page load
  useEffect(() => {
    dispatch(updateList([]))

    const fetchData = async () => {
      const { data, error } = await supabase.from(table).select()

      if (error) {
        console.error(error)
      } else {
        // Update the list of suppliers in Redux store
        dispatch(updateList(data))
      }
    }

    void fetchData()
  }, [isOpen])

  useEffect(() => {
    form.reset({
      weight: 0,
      name: ''
    })
  }, [isOpen])

  const totalWeight = (list as ItemType[]).reduce(
    (total, item) => total + item.weight,
    0
  )

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none"
      onClose={() => {}}
    >
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-600 opacity-80"
        aria-hidden="true"
      />

      {/* Centered panel container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="app__modal_dialog_panel_sm">
          {/* Sticky Header */}
          <div className="app__modal_dialog_title_container">
            <Dialog.Title as="h3" className="text-base font-medium">
              Critiaria
            </Dialog.Title>
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Criteria
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Criteria"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            weight
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Title"
                              min={0}
                              max={100}
                              type="number"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <Button type="submit">Add Criteria</Button>
                </div>
              </form>
            </Form>
            <div className="pb-10">
              <div className="app__title">
                <h1 className="capitalize flex-1">
                  Total Weight: {totalWeight}
                </h1>
              </div>
              <table className="app__table">
                <thead className="app__thead">
                  <tr>
                    <th className="app__th"></th>
                    <th className="app__th">Criteria</th>
                    <th className="app__th">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item: ItemType) => (
                    <tr key={item.id} className="app__tr">
                      <td className="w-6 pl-4 app__td">
                        <Menu as="div" className="app__menu_container">
                          <div>
                            <Menu.Button className="app__dropdown_btn">
                              <ChevronDown
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
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
                                    onClick={() =>
                                      handleDeleteConfirmation(item)
                                    }
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
                      <td className="app__td">{item.name}</td>
                      <td className="app__td">{item.weight}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr className="app__tr">
                      <td className="app__td" colSpan={2}>
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <ConfirmationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onConfirm={handleDelete}
              message="Are you sure you want to delete this?"
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

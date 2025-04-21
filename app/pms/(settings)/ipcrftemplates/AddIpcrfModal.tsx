'use client'
import { Button } from '@/components/ui/button'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger
} from '@/components/ui/extension/multi-select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem, editList } from '@/GlobalRedux/Features/listSlice'
import { PositionTypes } from '@/types'
import { IpcrfTemplatesTypes } from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = IpcrfTemplatesTypes
const table = 'pms_ipcrf_templates'
const title = 'Template'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  positions: z.array(z.string()).nonempty('Please at least one position')
})
type FormType = z.infer<typeof FormSchema>

export const AddIpcrfModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [positions, setPositions] = useState<PositionTypes[]>([])

  const dispatch = useDispatch()

  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
      positions: []
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        description: formdata.description,
        type: 'IPCRF'
      }

      // If exists (editing), update it
      if (editData?.id) {
        const { error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)

        if (error) {
          console.error('Error updating:', error)
        } else {
          // Remove old province associations
          const { error: errorDelete } = await supabase
            .from('pms_ipcrf_positions')
            .delete()
            .eq('ipcrf_template_id', editData.id)
          if (errorDelete) {
            console.error('Error deleting positions:', errorDelete)
          }

          // Insert selected positions into 'pms_ipcrf_positions' table
          const positionsData: Array<{
            ipcrf_template_id: any
            position_id: string
          }> = []
          const positionsData2: Array<{
            ipcrf_template_id: any
            position_id: string
            position: PositionTypes | undefined
          }> = []
          formdata.positions.forEach((positionName) => {
            positionsData.push({
              ipcrf_template_id: editData.id,
              position_id:
                positions.find((p) => p.name === positionName)?.id ?? ''
            })
            positionsData2.push({
              ipcrf_template_id: editData.id,
              position_id:
                positions.find((p) => p.name === positionName)?.id ?? '',
              position: positions.find((p) => p.name === positionName)
            })
          })

          const { error: errorPositions } = await supabase
            .from('pms_ipcrf_positions')
            .insert(positionsData)
          if (errorPositions) {
            console.error('Error adding positions:', errorPositions)
          }

          // Update list on redux
          dispatch(
            editList({
              ...newData,
              positions: positionsData2,
              id: editData.id
            })
          ) // ✅ Update Redux with new data
          onClose()
        }
      } else {
        // Add new one
        const { data, error } = await supabase
          .from(table)
          .insert([newData])
          .select()

        if (error) {
          console.error('Error adding:', error)
        } else {
          // Insert selected positions into 'pms_ipcrf_positions' table
          const positionsData: Array<{
            ipcrf_template_id: any
            position_id: string
          }> = []
          const positionsData2: Array<{
            ipcrf_template_id: any
            position_id: string
            position: PositionTypes | undefined
          }> = []
          formdata.positions.forEach((positionName) => {
            positionsData.push({
              ipcrf_template_id: data[0].id,
              position_id:
                positions.find((p) => p.name === positionName)?.id ?? ''
            })
            positionsData2.push({
              ipcrf_template_id: data[0].id,
              position_id:
                positions.find((p) => p.name === positionName)?.id ?? '',
              position: positions.find((p) => p.name === positionName)
            })
          })

          const { error: errorPositions } = await supabase
            .from('pms_ipcrf_positions')
            .insert(positionsData)
          if (errorPositions) {
            console.error('Error adding positions:', errorPositions)
          }

          // Insert new item to Redux
          dispatch(
            addItem({
              ...newData,
              positions: positionsData2,
              id: data[0].id
            })
          )
          onClose()
        }
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error(err)
      toast.error(`Submission error: ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('hrm_positions')
        .select()
        .order('name', { ascending: true })

      setPositions(data)
    }

    void fetchData()
  }, [])

  useEffect(() => {
    form.reset({
      description: editData?.description ?? '',
      positions: editData
        ? editData.positions.map((p) => p.position.name) // Extract Names
        : []
    })
  }, [form, editData, isOpen])

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
              {editData ? 'Edit' : 'Add'} {title}
            </Dialog.Title>
          </div>
          {/* Scrollable Form Content */}
          <div className="app__modal_dialog_content">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Title"
                              type="text"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="positions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Positions
                          </FormLabel>
                          <FormControl>
                            <MultiSelector
                              values={field.value}
                              onValuesChange={field.onChange}
                              loop
                              className="max-h-20"
                            >
                              <MultiSelectorTrigger className="border !shadow-none">
                                <MultiSelectorInput placeholder="Select Position" />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList className="overflow-y-auto max-h-[6rem]">
                                  {positions?.map((i) => (
                                    <MultiSelectorItem
                                      value={i.name}
                                      key={i.id}
                                    >
                                      {i.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="app__modal_dialog_footer">
                  <Button type="button" onClick={onClose} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editData ? (
                      'Update'
                    ) : (
                      <span>{isSubmitting ? 'Saving..' : 'Save'}</span>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

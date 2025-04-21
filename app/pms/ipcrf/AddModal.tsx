'use client'
import { SearchUserInput, UserBlock } from '@/components/index'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem } from '@/GlobalRedux/Features/listSlice'
import { cn } from '@/lib/utils'
import { Employee } from '@/types'
import {
  IpcrfTemplatesObjectives,
  IpcrfTemplatesPositionsTypes,
  IpcrfTemplatesTypes,
  IpcrfTypes
} from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = IpcrfTypes
const table = 'pms_ipcrf'
const title = 'IPCRF'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  ipcrf_template_id: z.coerce.number().min(1, 'IPCRF template is required'),
  rater_id: z.string().min(1, 'Rater is required')
})
type FormType = z.infer<typeof FormSchema>

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ipcrfs, setIpcrfs] = useState<IpcrfTemplatesTypes[]>([])

  // Rater Dropdown
  const [open, setOpen] = useState(false)

  const dispatch = useDispatch()

  const { supabase, session, systemUsers: users } = useSupabase()
  const systemUsers: Employee[] = users

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ipcrf_template_id: 0,
      rater_id: ''
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit

    const isValid = await form.trigger(['rater_id']) // Validate specific fields

    if (!isValid) return

    setIsSubmitting(true)

    try {
      const newData = {
        ipcrf_template_id: formdata.ipcrf_template_id,
        rater_id: formdata.rater_id,
        user_id: session.user.id,
        description: ipcrfs.find(
          (i) => i.id.toString() === formdata.ipcrf_template_id.toString()
        )?.description
      }

      // Add new one
      const { data, error } = await supabase
        .from(table)
        .insert([newData])
        .select()

      if (error) {
        console.error('Error adding:', error)
      } else {
        // Copy all objects from templates
        const insertData: any[] = []

        ipcrfs
          .find(
            (i) => i.id.toString() === formdata.ipcrf_template_id.toString()
          )
          ?.objectives.forEach((obj: IpcrfTemplatesObjectives) => {
            insertData.push({
              ipcrf_id: data[0].id,
              objective_id: obj.objective_id,
              timeline: obj.timeline,
              weight: obj.weight,
              quality: obj.quality,
              efficiency: obj.efficiency,
              timeliness: obj.timeliness,
              quality_outstanding: obj.quality_outstanding,
              quality_very_satisfactory: obj.quality_very_satisfactory,
              quality_satisfactory: obj.quality_satisfactory,
              quality_unsatisfactory: obj.quality_unsatisfactory,
              quality_poor: obj.quality_poor,
              efficiency_outstanding: obj.efficiency_outstanding,
              efficiency_very_satisfactory: obj.efficiency_very_satisfactory,
              efficiency_satisfactory: obj.efficiency_satisfactory,
              efficiency_unsatisfactory: obj.efficiency_unsatisfactory,
              efficiency_poor: obj.efficiency_poor,
              timeliness_outstanding: obj.timeliness_outstanding,
              timeliness_very_satisfactory: obj.timeliness_very_satisfactory,
              timeliness_satisfactory: obj.timeliness_satisfactory,
              timeliness_unsatisfactory: obj.timeliness_unsatisfactory,
              timeliness_poor: obj.timeliness_poor
            })
          })

        console.log(insertData)

        // Add new one
        const { error: errorObj } = await supabase
          .from('pms_ipcrf_ratings')
          .insert(insertData)

        if (errorObj) {
          console.error('Error adding:', errorObj)
        }

        // Insert new item to Redux
        dispatch(
          addItem({
            ...newData,
            rater: systemUsers.find(
              (i) => i.id.toString() === formdata.rater_id.toString()
            ),
            ratee: systemUsers.find((i) => i.id.toString() === session.user.id),
            ipcrf: ipcrfs.find(
              (i) => i.id.toString() === formdata.ipcrf_template_id.toString()
            ),
            id: data[0].id
          })
        )
        onClose()
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error(err)
      toast.error(`Submission error: ${err}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectedUsers = async (selectedUsers: Employee[]) => {
    if (selectedUsers.length > 0) {
      const selectedUser = selectedUsers[0]
      form.setValue('rater_id', selectedUser.id)
    } else {
      form.clearErrors('rater_id')
    }
  }

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the position ID of the logged-in user
        const user = systemUsers.find((u) => u.id === session.user.id)
        if (!user?.position_id) return

        // Fetch related template-position mappings
        const { data: positionMappings } = await supabase
          .from('pms_ipcrf_positions')
          .select()
          .eq('position_id', user.position_id)

        if (!positionMappings?.length) return

        // Extract unique template IDs
        const templateIds = positionMappings.map(
          (p: IpcrfTemplatesPositionsTypes) => p.ipcrf_template_id
        )

        if (!templateIds.length) return

        // Fetch the templates with objectives
        const { data: templates } = await supabase
          .from('pms_ipcrf_templates')
          .select('*,objectives:pms_ipcrf_template_objectives(*)')
          .eq('status', 'Published')
          .in('id', templateIds)

        console.log('templates', templates)
        setIpcrfs(templates)
      } catch (error) {
        // Optionally handle errors
        console.error('Error fetching IPCRF templates:', error)
      }
    }

    void fetchData()
  }, [])

  useEffect(() => {
    form.reset({
      ipcrf_template_id: editData?.ipcrf_template_id ?? 0,
      rater_id: editData?.rater_id ?? ''
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
                      name="ipcrf_template_id"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="app__formlabel_standard">
                            IPCRF Template
                          </FormLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    'w-full justify-between hover:bg-white',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value
                                    ? ipcrfs?.find(
                                        (i) =>
                                          i.id.toString() ===
                                          field.value.toString()
                                      )?.description
                                    : 'Select'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="p-0 w-[var(--radix-popover-trigger-width)]"
                            >
                              <Command>
                                <CommandInput placeholder="Search..." />
                                <CommandList>
                                  <CommandEmpty>No results found.</CommandEmpty>
                                  <CommandGroup>
                                    {ipcrfs?.map((i) => (
                                      <CommandItem
                                        value={i.description}
                                        key={i.id}
                                        onSelect={(selectedName) => {
                                          const selectedItem = ipcrfs.find(
                                            (k) =>
                                              k.description.toLowerCase() ===
                                              selectedName.toLowerCase()
                                          )
                                          if (selectedItem) {
                                            field.onChange(selectedItem.id) // store category.id in form
                                          }
                                          setOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            i.id.toString() ===
                                              field.value?.toString()
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {i.description}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <div className="app__label_standard">Rater:</div>
                    {editData?.rater ? (
                      <UserBlock user={editData.rater} />
                    ) : (
                      <>
                        <SearchUserInput
                          isMultiple={false}
                          handleSelectedUsers={handleSelectedUsers}
                        />
                        {form.formState.errors.rater_id && (
                          <div className="app__error_message">
                            {form.formState.errors.rater_id.message}
                          </div>
                        )}
                      </>
                    )}
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

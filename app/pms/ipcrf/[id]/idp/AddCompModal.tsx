// components/AddItemTypeModal.tsx
'use client'

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
  FormLabel
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { interventions } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem, editList } from '@/GlobalRedux/Features/list2Slice'
import { cn } from '@/lib/utils'
import { Idp, IpcrfCompetencyRating } from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = Idp
const table = 'pms_idp'

interface ModalProps {
  ipcrfId: number
  isOpen: boolean
  type: string
  compRatings: IpcrfCompetencyRating[]
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  competency_id: z.union([z.string(), z.number()]),
  custom_competency: z.string().optional(),
  intervention: z.string().min(1, 'Intervention is required'),
  custom_intervention: z.string().optional(),
  learning_objective: z.string().min(1, 'Learning Objective is required'),
  timeline: z.string().min(1, 'Timeline is required'),
  resources: z.string().min(1, 'Resources needed is required')
})
type FormType = z.infer<typeof FormSchema>

export const AddCompModal = ({
  ipcrfId,
  isOpen,
  type,
  compRatings,
  onClose,
  editData
}: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useDispatch()

  // Obj Dropdown
  const [open, setOpen] = useState(false)
  const [openIntervention, setOpenIntervention] = useState(false)

  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      competency_id: undefined,
      custom_competency: '',
      intervention: '',
      custom_intervention: '',
      learning_objective: '',
      timeline: '',
      resources: ''
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      // If exists (editing), update it
      if (editData?.id) {
        const newData = {
          competency_item_id:
            formdata.competency_id !== 'others' ? formdata.competency_id : null,
          custom_competency: formdata.custom_competency,
          learning_objective: formdata.learning_objective,
          intervention: formdata.intervention,
          custom_intervention: formdata.custom_intervention,
          timeline: formdata.timeline,
          resources: formdata.resources,
          is_custom_competency:
            formdata.competency_id === 'others' ? true : false,
          is_custom_intervention:
            formdata.intervention === 'others' ? true : false
        }

        const { error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)

        if (error) {
          console.error('Error updating:', error)
        } else {
          // Update list on redux
          dispatch(
            editList({
              ...editData,
              competency_item: compRatings.find(
                (i) =>
                  i.competency_item_id.toString() ===
                  formdata.competency_id.toString()
              ),
              ...newData,
              id: editData.id
            })
          ) // ✅ Update Redux with new data
          onClose()
        }
      } else {
        // Add new one
        const newData = {
          ipcrf_id: ipcrfId,
          type,
          comp_type: 'competency',
          competency_item_id:
            formdata.competency_id !== 'others' ? formdata.competency_id : null,
          custom_competency: formdata.custom_competency,
          learning_objective: formdata.learning_objective,
          intervention: formdata.intervention,
          custom_intervention: formdata.custom_intervention,
          timeline: formdata.timeline,
          resources: formdata.resources,
          is_custom_competency:
            formdata.competency_id === 'others' ? true : false,
          is_custom_intervention:
            formdata.intervention === 'others' ? true : false
        }

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
              competency_item: compRatings.find(
                (i) =>
                  i.competency_item_id.toString() ===
                  formdata.competency_id.toString()
              ),
              id: data[0].id
            })
          )
          onClose()
        }
      }

      toast.success('Successfully saved!')
    } catch (err) {
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    form.reset({
      competency_id: editData?.custom_competency
        ? 'others'
        : editData?.objective_id ?? '',
      custom_competency: editData?.custom_competency ?? '',
      learning_objective: editData?.learning_objective ?? '',
      intervention: editData?.intervention ?? '',
      custom_intervention: editData?.custom_intervention ?? '',
      timeline: editData?.timeline ?? '',
      resources: editData?.resources ?? ''
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
              IDP Details <span className="capitalize">({type})</span>
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
                      name="competency_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Competency
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
                                  {field.value === 'others'
                                    ? 'Others, I want to specifiy below'
                                    : compRatings
                                        ?.find(
                                          (i) =>
                                            i.competency_item_id.toString() ===
                                            field.value?.toString()
                                        )
                                        ?.competency_item?.title?.slice(
                                          0,
                                          100
                                        ) ?? 'Select'}
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
                                    {/* Others option */}
                                    <CommandItem
                                      value="Others"
                                      onSelect={() => {
                                        field.onChange('others')
                                        setOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === 'others'
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                      Others, I want to specifiy below
                                    </CommandItem>
                                    {compRatings?.map((i) => (
                                      <CommandItem
                                        key={i.id}
                                        value={i.competency_item?.title}
                                        onSelect={() => {
                                          field.onChange(i.competency_item_id)
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
                                        {i.competency_item?.competency?.title} -{' '}
                                        {i.competency_item?.title}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {/* Show input when "Others" is selected */}
                          {field.value === 'others' && (
                            <FormField
                              control={form.control}
                              name="custom_competency"
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormLabel className="app__formlabel_standard">
                                    Specify Objective
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter custom objective"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="learning_objective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Learning Objective
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Learning Objective"
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
                      name="intervention"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Intervention
                          </FormLabel>
                          <Popover
                            open={openIntervention}
                            onOpenChange={setOpenIntervention}
                          >
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
                                  {field.value === 'others'
                                    ? 'Others, I want to specifiy below'
                                    : field.value !== ''
                                    ? field.value
                                    : 'Select intervention'}
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
                                    {/* Others option */}
                                    <CommandItem
                                      value="Others"
                                      onSelect={() => {
                                        field.onChange('others')
                                        setOpenIntervention(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === 'others'
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                        )}
                                      />
                                      Others, I want to specifiy below
                                    </CommandItem>
                                    {interventions?.map((intervention) => (
                                      <CommandItem
                                        key={intervention}
                                        value={intervention}
                                        onSelect={() => {
                                          field.onChange(intervention)
                                          setOpenIntervention(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            intervention === field.value
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {intervention}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {/* Show input when "Others" is selected */}
                          {field.value === 'others' && (
                            <FormField
                              control={form.control}
                              name="custom_intervention"
                              render={({ field }) => (
                                <FormItem className="mt-2">
                                  <FormLabel className="app__formlabel_standard">
                                    Specify Intervention
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter other Intervention"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Timeline
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Timeline"
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
                      name="resources"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Resources Needed
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Resources Needed"
                              type="text"
                              {...field}
                            />
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

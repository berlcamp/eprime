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
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem, editList } from '@/GlobalRedux/Features/list2Slice'
import { cn } from '@/lib/utils'
import {
  CompetencyTypes,
  IpcrfTemplatesCompetencyTypes
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
type ItemType = IpcrfTemplatesCompetencyTypes

const table = 'pms_ipcrf_template_competencies'
const title = 'Competency'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
  templateId: number
}

const FormSchema = z.object({
  competency_id: z.coerce.number().min(1, 'Objective is required')
})
type FormType = z.infer<typeof FormSchema>

export const AddCompetencyModal = ({
  isOpen,
  onClose,
  editData,
  templateId
}: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [competencies, setCompetencies] = useState<CompetencyTypes[]>([])

  // objectives Dropdown
  const [open, setOpen] = useState(false)

  const dispatch = useDispatch()
  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      competency_id: 0
    }
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        ipcrf_template_id: templateId,
        competency_id: formdata.competency_id
      }

      // If exists (editing), update it
      if (editData?.id) {
        const { error } = await supabase
          .from(table)
          .update(newData)
          .eq('id', editData.id)

        if (error) {
          console.error('Error updating ItemType:', error)
        } else {
          // Update list on redux
          dispatch(
            editList({
              ...newData,
              competency: competencies.find(
                (o) => o.id.toString() === formdata.competency_id.toString()
              ),
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
          console.error('Error adding stock:', error)
        } else {
          // Insert new item to Redux
          dispatch(
            addItem({
              ...newData,
              competency: competencies.find(
                (o) => o.id.toString() === formdata.competency_id.toString()
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

  // Fetch on page load
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('pms_competencies')
        .select('*, compentency_items:pms_competency_items(*)')
        .order('title', { ascending: true })

      setCompetencies(data ?? [])
    }

    void fetchData()
  }, [])

  useEffect(() => {
    form.reset({
      competency_id: editData?.competency_id ?? 0
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="competency_id"
                      render={({ field }) => (
                        <FormItem className="">
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
                                  {field.value
                                    ? competencies?.find(
                                        (i) =>
                                          i.id.toString() ===
                                          field.value.toString()
                                      )?.title
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
                                    {competencies?.map((i) => (
                                      <CommandItem
                                        value={i.id.toString()} // 🔑 use ID as the value
                                        key={i.id}
                                        onSelect={(selectedId) => {
                                          field.onChange(Number(selectedId)) // Store ID in form
                                          setOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            i.id === field.value
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          )}
                                        />
                                        {i.title}
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

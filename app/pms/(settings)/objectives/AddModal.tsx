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
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem, editList } from '@/GlobalRedux/Features/listSlice'
import { cn } from '@/lib/utils'
import { KraObjectiveTypes, KraTypes } from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = KraObjectiveTypes
type FormType = {
  kra_id: number
  title: string
}
const table = 'pms_objectives'
const title = 'Objective'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
}

const FormSchema = z.object({
  kra_id: z.coerce.number().min(1, 'KRA is required'),
  title: z.string().min(1, 'Title is required')
})

export const AddModal = ({ isOpen, onClose, editData }: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kras, setKras] = useState<KraTypes[]>([])

  // Kras Dropdown
  const [open, setOpen] = useState(false)

  const dispatch = useDispatch()

  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      kra_id: 0,
      title: ''
    }
  })

  // Submit handler
  const onSubmit = async (data: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        title: data.title,
        kra_id: data.kra_id
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
          // Update list on redux
          dispatch(
            editList({
              ...newData,
              kra: kras?.find(
                (i) => i.id.toString() === newData.kra_id.toString()
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
          console.error('Error adding:', error)
        } else {
          // Insert new item to Redux
          dispatch(
            addItem({
              ...newData,
              kra: kras?.find(
                (i) => i.id.toString() === newData.kra_id.toString()
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
        .from('pms_kras')
        .select()
        .order('title', { ascending: true })

      setKras(data ?? [])
    }

    void fetchData()
  }, [])

  useEffect(() => {
    form.reset({
      kra_id: editData ? editData.kra_id : 0,
      title: editData?.title ?? ''
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
                      name="kra_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Domain
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
                                    ? kras?.find(
                                        (i) =>
                                          i.id.toString() ===
                                          field.value?.toString()
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
                                    {kras?.map((i) => (
                                      <CommandItem
                                        key={i.id}
                                        value={i.title} // for search
                                        onSelect={() => {
                                          field.onChange(i.id) // store the id
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
                  <div>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Objective Title
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

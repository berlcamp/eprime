// components/AddItemTypeModal.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Textarea } from '@/components/ui/textarea'
import { useSupabase } from '@/context/SupabaseProvider'
import { addItem, editList } from '@/GlobalRedux/Features/list2Slice'
import { cn } from '@/lib/utils'
import { IpcrfTemplatesObjectives, KraObjectiveTypes } from '@/types/pmsTypes'
import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

// Always update this on other pages
type ItemType = IpcrfTemplatesObjectives

const table = 'pms_ipcrf_template_objectives'
const title = 'Objectives'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  editData?: ItemType | null // Optional prop for editing existing item
  templateId: number
}

const FormSchema = z.object({
  objective_id: z.coerce.number().min(1, 'Objective is required'),
  weight: z.coerce.number().min(1, 'Weight is required'),
  timeline: z.string().min(1, 'Timeline is required'),
  quality: z.boolean().default(false).optional(),
  efficiency: z.boolean().default(false).optional(),
  timeliness: z.boolean().default(false).optional(),
  quality_outstanding: z.string().min(1, 'Indicator is required').optional(),
  quality_very_satisfactory: z
    .string()
    .min(1, 'Indicator is required')
    .optional(),
  quality_satisfactory: z.string().optional(),
  quality_unsatisfactory: z.string().optional(),
  quality_poor: z.string().optional(),
  efficiency_outstanding: z.string().optional(),
  efficiency_very_satisfactory: z.string().optional(),
  efficiency_satisfactory: z.string().optional(),
  efficiency_unsatisfactory: z.string().optional(),
  efficiency_poor: z.string().optional(),
  timeliness_outstanding: z.string().optional(),
  timeliness_very_satisfactory: z.string().optional(),
  timeliness_satisfactory: z.string().optional(),
  timeliness_unsatisfactory: z.string().optional(),
  timeliness_poor: z.string().optional()
})
type FormType = z.infer<typeof FormSchema>

export const AddObjectiveModal = ({
  isOpen,
  onClose,
  editData,
  templateId
}: ModalProps) => {
  //
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [objectives, setObjectives] = useState<KraObjectiveTypes[]>([])

  // objectives Dropdown
  const [open, setOpen] = useState(false)

  const dispatch = useDispatch()
  const { supabase } = useSupabase()

  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      objective_id: 0,
      weight: 0,
      timeline: '',
      quality: true,
      efficiency: false,
      timeliness: false,
      quality_outstanding: '',
      quality_very_satisfactory: '',
      quality_satisfactory: '',
      quality_unsatisfactory: '',
      quality_poor: '',
      efficiency_outstanding: '',
      efficiency_very_satisfactory: '',
      efficiency_satisfactory: '',
      efficiency_unsatisfactory: '',
      efficiency_poor: '',
      timeliness_outstanding: '',
      timeliness_very_satisfactory: '',
      timeliness_satisfactory: '',
      timeliness_unsatisfactory: '',
      timeliness_poor: ''
    },
    shouldUnregister: true // 👈 Important
  })

  // Submit handler
  const onSubmit = async (formdata: FormType) => {
    if (isSubmitting) return // 🚫 Prevent double-submit
    setIsSubmitting(true)

    try {
      const newData = {
        ipcrf_template_id: templateId,
        objective_id: formdata.objective_id,
        timeline: formdata.timeline,
        weight: formdata.weight,
        quality: formdata.quality,
        efficiency: formdata.efficiency,
        timeliness: formdata.timeliness,
        quality_outstanding: formdata.quality_outstanding,
        quality_very_satisfactory: formdata.quality_very_satisfactory,
        quality_satisfactory: formdata.quality_satisfactory,
        quality_unsatisfactory: formdata.quality_unsatisfactory,
        quality_poor: formdata.quality_poor,
        efficiency_outstanding: formdata.efficiency_outstanding,
        efficiency_very_satisfactory: formdata.efficiency_very_satisfactory,
        efficiency_satisfactory: formdata.efficiency_satisfactory,
        efficiency_unsatisfactory: formdata.efficiency_unsatisfactory,
        efficiency_poor: formdata.efficiency_poor,
        timeliness_outstanding: formdata.timeliness_outstanding,
        timeliness_very_satisfactory: formdata.timeliness_very_satisfactory,
        timeliness_satisfactory: formdata.timeliness_satisfactory,
        timeliness_unsatisfactory: formdata.timeliness_unsatisfactory,
        timeliness_poor: formdata.timeliness_poor
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
              objective: objectives.find(
                (o) => o.id.toString() === formdata.objective_id.toString()
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
              objective: objectives.find(
                (o) => o.id.toString() === formdata.objective_id.toString()
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
        .from('pms_objectives')
        .select()
        .order('title', { ascending: true })

      setObjectives(data)
    }

    void fetchData()
  }, [])

  useEffect(() => {
    form.reset({
      objective_id: editData?.objective_id ?? 0,
      timeline: editData?.timeline ?? '',
      weight: editData?.weight ?? 0,
      quality: editData?.quality ?? true,
      efficiency: editData?.efficiency ?? false,
      timeliness: editData?.timeliness ?? false,
      quality_outstanding: editData?.quality_outstanding ?? '',
      quality_very_satisfactory: editData?.quality_very_satisfactory ?? '',
      quality_satisfactory: editData?.quality_satisfactory ?? '',
      quality_unsatisfactory: editData?.quality_unsatisfactory ?? '',
      quality_poor: editData?.quality_poor ?? '',
      efficiency_outstanding: editData?.efficiency_outstanding ?? '',
      efficiency_very_satisfactory:
        editData?.efficiency_very_satisfactory ?? '',
      efficiency_satisfactory: editData?.efficiency_satisfactory ?? '',
      efficiency_unsatisfactory: editData?.efficiency_unsatisfactory ?? '',
      efficiency_poor: editData?.efficiency_poor ?? '',
      timeliness_outstanding: editData?.timeliness_outstanding ?? '',
      timeliness_very_satisfactory:
        editData?.timeliness_very_satisfactory ?? '',
      timeliness_satisfactory: editData?.timeliness_satisfactory ?? '',
      timeliness_unsatisfactory: editData?.timeliness_unsatisfactory ?? '',
      timeliness_poor: editData?.timeliness_poor ?? ''
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
        <Dialog.Panel className="app__modal_dialog_panel_lg">
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
                      name="objective_id"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="app__formlabel_standard">
                            Objective
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
                                    ? objectives?.find(
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
                                    {objectives?.map((i) => (
                                      <CommandItem
                                        value={i.title}
                                        key={i.id}
                                        onSelect={(selectedName) => {
                                          const selectedItem = objectives.find(
                                            (k) =>
                                              k.title.toLowerCase() ===
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
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="app__formlabel_standard">
                            Weight
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="app__input_standard"
                              placeholder="Weight"
                              type="number"
                              step="any"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 flex space-x-2">
                    <FormField
                      control={form.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Quality</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="efficiency"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Efficiency</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeliness"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Timeliness</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                {form.watch('quality') && (
                  <div className="mt-4 col-span-2 bg-gray-100 p-2">
                    <h2 className="text-lg mb-4">
                      Quality Performance Indicators
                    </h2>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <FormField
                          control={form.control}
                          name="quality_outstanding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outstanding</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="quality_very_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="quality_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="quality_unsatisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unsatisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="quality_poor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poor</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {form.watch('efficiency') && (
                  <div className="mt-4 col-span-2 bg-gray-100 p-2">
                    <h2 className="text-lg mb-4">
                      Efficiency Performance Indicators
                    </h2>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <FormField
                          control={form.control}
                          name="efficiency_outstanding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outstanding</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="efficiency_very_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="efficiency_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="efficiency_unsatisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unsatisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="efficiency_poor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poor</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {form.watch('timeliness') && (
                  <div className="mt-4 col-span-2 bg-gray-100 p-2">
                    <h2 className="text-lg mb-4">
                      Timeliness Performance Indicators
                    </h2>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <FormField
                          control={form.control}
                          name="timeliness_outstanding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outstanding</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="timeliness_very_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="timeliness_satisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Very Satisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="timeliness_unsatisfactory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unsatisfactory</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
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
                          name="timeliness_poor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Poor</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="resize-none bg-white"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
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

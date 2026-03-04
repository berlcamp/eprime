'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PrintModal } from '@/components/Rsp/PrintModal'
import { useEffect, useState } from 'react'

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    date: string,
    employmentStatus: string,
    natureOfAppointment: string,
    assignment: string,
    vice: string,
    reasonOfVacancy: string,
    plantillaNumber: string,
    plantillaType?: string,
    publicationPosting?: {
      publishedAt: string
      publishedFrom: string
      publishedTo: string
      postedIn: string
      postedFrom: string
      postedTo: string
      hrmpsbAssessmentStartedOn: string
    }
  ) => void
  defaultVice?: string
  defaultPlantillaNumber?: string
}

export default function AppointmentFormModal({
  open,
  onOpenChange,
  onConfirm,
  defaultVice = '',
  defaultPlantillaNumber = '',
}: AppointmentFormModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState('Permanent')
  const [natureOfAppointment, setNatureOfAppointment] = useState('Original')
  const [assignment, setAssignment] = useState(
    'Schools Division Office of Bayugan City'
  )
  const [vice, setVice] = useState(defaultVice)
  const [reasonOfVacancy, setReasonOfVacancy] = useState('')
  const [plantillaNumber, setPlantillaNumber] = useState(defaultPlantillaNumber)
  const [plantillaType, setPlantillaType] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [publishedFrom, setPublishedFrom] = useState('')
  const [publishedTo, setPublishedTo] = useState('')
  const [postedIn, setPostedIn] = useState('')
  const [postedFrom, setPostedFrom] = useState('')
  const [postedTo, setPostedTo] = useState('')
  const [hrmpsbAssessmentStartedOn, setHrmpsbAssessmentStartedOn] = useState('')

  useEffect(() => {
    setVice(defaultVice)
    setPlantillaNumber(defaultPlantillaNumber)
  }, [defaultVice, defaultPlantillaNumber])

  const handleConfirm = () => {
    if (!selectedDate) return
    onConfirm(
      selectedDate,
      employmentStatus,
      natureOfAppointment,
      assignment,
      vice,
      reasonOfVacancy,
      plantillaNumber,
      plantillaType,
      {
        publishedAt,
        publishedFrom,
        publishedTo,
        postedIn,
        postedFrom,
        postedTo,
        hrmpsbAssessmentStartedOn,
      }
    )
    onOpenChange(false)
  }

  return (
    <PrintModal
      open={open}
      onOpenChange={onOpenChange}
      title="Print Appointment Form"
      description="Complete the appointment details for printing"
      onConfirm={handleConfirm}
      confirmDisabled={!selectedDate}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appt-date">Date of Appointment</Label>
            <Input
              id="appt-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appt-plantilla">Plantilla Item No.</Label>
            <Input
              id="appt-plantilla"
              value={plantillaNumber}
              onChange={(e) => setPlantillaNumber(e.target.value)}
              placeholder="Plantilla item number"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appt-status">Employment Status</Label>
            <Select
              value={employmentStatus}
              onValueChange={setEmploymentStatus}
            >
              <SelectTrigger id="appt-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Permanent">Permanent</SelectItem>
                <SelectItem value="Temporary">Temporary</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appt-nature">Nature of Appointment</Label>
            <Select
              value={natureOfAppointment}
              onValueChange={setNatureOfAppointment}
            >
              <SelectTrigger id="appt-nature">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Original">Original</SelectItem>
                <SelectItem value="Promotion">Promotion</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Reemployment">Reemployment</SelectItem>
                <SelectItem value="Reappointment">Reappointment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="appt-assignment">Place of Assignment</Label>
          <Input
            id="appt-assignment"
            value={assignment}
            onChange={(e) => setAssignment(e.target.value)}
            placeholder="Place of assignment"
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-600">
            Vacancy details
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appt-vice">Vice (person being replaced)</Label>
              <Input
                id="appt-vice"
                value={vice}
                onChange={(e) => setVice(e.target.value)}
                placeholder="Name of person being replaced"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-reason">Reason of Vacancy</Label>
              <Input
                id="appt-reason"
                value={reasonOfVacancy}
                onChange={(e) => setReasonOfVacancy(e.target.value)}
                placeholder="e.g., retired, resigned, transferred"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-plantilla-type">
                Plantilla Type (optional)
              </Label>
              <Input
                id="appt-plantilla-type"
                value={plantillaType}
                onChange={(e) => setPlantillaType(e.target.value)}
                placeholder="e.g., Elementary, Secondary"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-sm font-medium text-slate-600">
            Publication & Posting (RA 7041)
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appt-published-at">Published at (location)</Label>
              <Input
                id="appt-published-at"
                type="text"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                placeholder="e.g., DepEd website, newspaper"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appt-published-from">Published from</Label>
                <Input
                  id="appt-published-from"
                  type="date"
                  value={publishedFrom}
                  onChange={(e) => setPublishedFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-published-to">Published to</Label>
                <Input
                  id="appt-published-to"
                  type="date"
                  value={publishedTo}
                  onChange={(e) => setPublishedTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-posted-in">Posted in (location)</Label>
              <Input
                id="appt-posted-in"
                type="text"
                value={postedIn}
                onChange={(e) => setPostedIn(e.target.value)}
                placeholder="e.g., division bulletin board"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appt-posted-from">Posted from</Label>
                <Input
                  id="appt-posted-from"
                  type="date"
                  value={postedFrom}
                  onChange={(e) => setPostedFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-posted-to">Posted to</Label>
                <Input
                  id="appt-posted-to"
                  type="date"
                  value={postedTo}
                  onChange={(e) => setPostedTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-hrmpsb-started">HRMPSB assessment started on</Label>
              <Input
                id="appt-hrmpsb-started"
                type="date"
                value={hrmpsbAssessmentStartedOn}
                onChange={(e) => setHrmpsbAssessmentStartedOn(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </PrintModal>
  )
}

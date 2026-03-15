"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { eventFormSchema } from "@/lib/validator"
import * as z from 'zod'
import { eventDefaultValues } from "@/constants"
import Dropdown from "./Dropdown"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "./FileUploader"
import { useState } from "react"
import Image from "next/image"
import DatePicker from "react-datepicker"
import { useUploadThing } from '@/lib/uploadthing'
import { toast } from "sonner"

import "react-datepicker/dist/react-datepicker.css"
import { useRouter } from "next/navigation"
import { createEvent, updateEvent } from "@/lib/actions/event.actions"
import { IEvent } from "@/lib/database/models/event.model"

type EventFormProps = {
  userId: string
  type: "Create" | "Update"
  event?: IEvent
  eventId?: string
}

// ── UI helpers ───────────────────────────────────────────────────────────────
const SectionCard = ({ number, label, children }: {
  number: number; label: string; children: React.ReactNode
}) => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6
                  shadow-[0_2px_20px_rgba(0,0,0,0.3)] space-y-4">
    <div className="flex items-center gap-3 mb-1">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg
                       bg-violet-500/20 text-[11px] font-bold text-violet-300">
        {number}
      </span>
      <span className="text-xs font-medium text-white/40 tracking-wider uppercase">{label}</span>
    </div>
    {children}
  </div>
)

const inputCls =
  "h-12 rounded-xl border border-white/10 bg-white/5 text-white " +
  "placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-violet-500/50 " +
  "focus-visible:border-violet-500/50 transition-all duration-200"
// ─────────────────────────────────────────────────────────────────────────────

const EventForm = ({ userId, type, event, eventId }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([])
  const initialValues = event && type === 'Update'
    ? {
        ...event,
        startDateTime: new Date(event.startDateTime),
        endDateTime:   new Date(event.endDateTime),
      }
    : eventDefaultValues
  const router = useRouter()

  const { startUpload } = useUploadThing('imageUploader')

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
  })

  // ── current postedBy value (reactive) ──
  const postedBy = form.watch('postedBy')
  const showContactFields = postedBy === 'organizer' || postedBy === 'student'

  async function onSubmit(values: z.infer<typeof eventFormSchema>) {
    let uploadedImageUrl = values.imageUrl

    if (files.length > 0) {
      const file = files[0]
      const fileSizeMB = file.size / 1024 / 1024

      if (fileSizeMB > 4) {
        toast.error("Image too large", {
          description: `Your image is ${fileSizeMB.toFixed(1)}MB. Please re-upload one under 4MB.`,
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", {
          description: "Please upload a valid image (JPG, PNG, WEBP, etc.)",
        })
        return
      }

      try {
        const uploadedImages = await startUpload(files)

        if (!uploadedImages || uploadedImages.length === 0) {
          toast.error("Image upload failed", {
            description: "Could not upload your image. Please try again.",
          })
          return
        }

        uploadedImageUrl = uploadedImages[0].url

      } catch (uploadError: any) {
        const msg: string = uploadError?.message ?? ""

        if (msg.includes("size") || msg.includes("FileSizeMismatch")) {
          toast.error("Image too large", { description: "Please re-upload an image under 4MB." })
        } else if (msg.includes("500") || msg.includes("Internal")) {
          toast.error("Server error during upload", { description: "Please try again later." })
        } else if (msg.includes("Invalid config") || msg.includes("presigned")) {
          toast.error("Upload configuration error", { description: "Please contact support." })
        } else {
          toast.error("Upload failed", { description: msg || "Unknown error during image upload." })
        }
        return
      }
    }

    if (type === 'Create') {
      try {
        const newEvent = await createEvent({
          event: { ...values, imageUrl: uploadedImageUrl },
          userId,
          path: '/profile',
        })

        if (newEvent) {
          form.reset()
          toast.success("Event created successfully!", {
            description: "Your event is now live and visible to others.",
          })
          router.push(`/events/${newEvent._id}`)
        }
      } catch (error: any) {
        const msg: string = error?.message ?? ""

        if (msg.includes("500") || msg.includes("Internal")) {
          toast.error("Internal server error", { description: "Please try again later." })
        } else if (msg.includes("401") || msg.includes("Unauthorized")) {
          toast.error("Unauthorized", { description: "You must be logged in to create an event." })
        } else if (msg.includes("400") || msg.includes("validation")) {
          toast.error("Invalid form data", { description: "Please check all fields and try again." })
        } else {
          toast.error("Failed to create event", { description: msg || "Please try again." })
        }
        console.log(error)
      }
    }

    if (type === 'Update') {
      if (!eventId) { router.back(); return }

      try {
        const updatedEvent = await updateEvent({
          userId,
          event: { ...values, imageUrl: uploadedImageUrl, _id: eventId },
          path: `/events/${eventId}`,
        })

        if (updatedEvent) {
          form.reset()
          toast.success("Event updated successfully!", { description: "Your changes have been saved." })
          router.push(`/events/${updatedEvent._id}`)
        }
      } catch (error: any) {
        const msg: string = error?.message ?? ""

        if (msg.includes("500") || msg.includes("Internal")) {
          toast.error("Internal server error", { description: "Please try again later." })
        } else if (msg.includes("401") || msg.includes("Unauthorized")) {
          toast.error("Unauthorized", { description: "You don't have permission to update this event." })
        } else {
          toast.error("Failed to update event", { description: msg || "Please try again." })
        }
        console.log(error)
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-[900px] flex flex-col gap-5 px-4 pb-16"
      >

        {/* ── 1. Basic Info ── */}
        <SectionCard number={1} label="Basic Info">
          <div className="flex flex-col gap-4 md:flex-row">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input placeholder="Event title" {...field} className={inputCls} />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Dropdown onChangeHandler={field.onChange} value={field.value} />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* ── 2. Description & Banner ── */}
        <SectionCard number={2} label="Description & Banner">
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl className="h-72">
                    <Textarea
                      placeholder="Tell attendees what your event is about…"
                      {...field}
                      className="min-h-[180px] resize-none rounded-xl border border-white/10
                                 bg-white/5 text-white placeholder:text-white/30
                                 focus-visible:ring-2 focus-visible:ring-violet-500/50
                                 focus-visible:border-violet-500/50 transition-all duration-200 p-4"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl className="h-72">
                    <FileUploader
                      onFieldChange={field.onChange}
                      imageUrl={field.value}
                      setFiles={setFiles}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* ── 3. Location ── */}
        <SectionCard number={3} label="Location">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="relative">
                    <Image
                      src="/assets/icons/location-grey.svg"
                      alt="location"
                      width={20}
                      height={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
                    />
                    <Input
                      placeholder="Enter campus or venue (e.g. IIIT Lucknow)"
                      {...field}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </FormControl>
                <p className="text-xs text-white/25 pl-1 mt-1">
                  Enter a campus name or full address — we'll pin it on the map
                </p>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />
        </SectionCard>

        {/* ── 4. Date & Time ── */}
        <SectionCard number={4} label="Date & Time">
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <p className="text-xs text-white/40 mb-1.5 pl-1">Starts</p>
                  <FormControl>
                    <div className="flex items-center h-12 w-full overflow-hidden rounded-xl
                                    border border-white/10 bg-white/5 px-4 gap-3">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={18}
                        height={18}
                        className="filter-grey shrink-0"
                      />
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <p className="text-xs text-white/40 mb-1.5 pl-1">Ends</p>
                  <FormControl>
                    <div className="flex items-center h-12 w-full overflow-hidden rounded-xl
                                    border border-white/10 bg-white/5 px-4 gap-3">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={18}
                        height={18}
                        className="filter-grey shrink-0"
                      />
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>
        </SectionCard>

        {/* ── 5. Optional Link ── */}
        <SectionCard number={5} label="Optional Link">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="relative">
                    <Image
                      src="/assets/icons/link.svg"
                      alt="link"
                      width={18}
                      height={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
                    />
                    <Input
                      placeholder="https://your-event-link.com"
                      {...field}
                      className={`${inputCls} pl-11`}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />
        </SectionCard>

        {/* ── 6. Posted By ── */}
        <SectionCard number={6} label="Posted By">
          <FormField
            control={form.control}
            name="postedBy"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex gap-3">
                    {/* Admin */}
                    <button
                      type="button"
                      onClick={() => field.onChange('admin')}
                      className={`flex-1 h-12 rounded-xl border text-sm font-medium transition-all duration-200
                        ${field.value === 'admin'
                          ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                        }`}
                    >
                      Admin
                    </button>
                    {/* Event Organizer */}
                    <button
                      type="button"
                      onClick={() => field.onChange('organizer')}
                      className={`flex-1 h-12 rounded-xl border text-sm font-medium transition-all duration-200
                        ${field.value === 'organizer'
                          ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                        }`}
                    >
                      Event Organizer
                    </button>
                    {/* Student */}
                    <button
                      type="button"
                      onClick={() => field.onChange('student')}
                      className={`flex-1 h-12 rounded-xl border text-sm font-medium transition-all duration-200
                        ${field.value === 'student'
                          ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                        }`}
                    >
                      Student
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          {/* Contact fields — shown for organizer and student */}
          {showContactFields && (
            <div className="flex flex-col gap-4 mt-2">
              <p className="text-xs text-white/40 uppercase tracking-wider">
                {postedBy === 'student' ? 'Student Details' : 'Organizer Details'}
              </p>

              {/* Name + Email */}
              <div className="flex flex-col gap-4 md:flex-row">
                <FormField
                  control={form.control}
                  name="organizerInfo.name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder={postedBy === 'student' ? 'Your full name' : 'Organizer full name'}
                          {...field}
                          className={inputCls}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizerInfo.email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder={postedBy === 'student' ? 'Your college email' : 'Organizer email'}
                          type="email"
                          {...field}
                          className={inputCls}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Instagram + LinkedIn */}
              <div className="flex flex-col gap-4 md:flex-row">
                <FormField
                  control={form.control}
                  name="organizerInfo.instagram"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                            @
                          </span>
                          <Input
                            placeholder="instagram_handle"
                            {...field}
                            className={`${inputCls} pl-8`}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizerInfo.linkedin"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/yourprofile"
                          {...field}
                          className={inputCls}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Submit ── */}
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="w-full h-14 rounded-2xl text-base font-semibold tracking-wide
                     bg-gradient-to-r from-violet-600 to-indigo-600
                     hover:from-violet-500 hover:to-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-[0_4px_32px_rgba(124,58,237,0.35)]
                     hover:shadow-[0_4px_40px_rgba(124,58,237,0.55)]
                     transition-all duration-300 text-white border-0"
        >
          {form.formState.isSubmitting ? 'Submitting...' : `${type} Event`}
        </Button>

      </form>
    </Form>
  )
}

export default EventForm
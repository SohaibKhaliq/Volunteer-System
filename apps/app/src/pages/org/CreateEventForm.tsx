import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MagicDescriptionInput } from "@/components/MagicDescriptionInput" // Reusing the AI component
import api from "@/lib/api"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  title: z.string().min(3),
  location: z.string().min(3),
  date: z.string(),
  description: z.string().optional(),
  tags: z.array(z.number()).optional()
})

export function CreateEventForm() {
  const [loading, setLoading] = useState(false)

  const { data: availableTags } = useQuery({
      queryKey: ['admin-tags'], // Using the same key/endpoint as admin for simplicity
      queryFn: async () => (await api.get('/admin/tags')).data
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      date: "",
      tags: []
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
        await api.post('/events', values)
        toast.success("Event created!")
        form.reset()
    } catch (e) {
        toast.error("Failed to create event")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Community Cleanup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Central Park" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="space-y-2">
            <FormLabel>Description (AI Assisted)</FormLabel>
            {/* We integrate the Magic Input separately but sync it to the form?
                For prototype, let's keep MagicInput separate and user copies text,
                OR we assume MagicInput updates a hidden field.
                Simplest: MagicInput is a standalone tool, user copies text.
            */}
            <MagicDescriptionInput />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Paste generated description here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="space-y-2">
            <FormLabel>Tags</FormLabel>
            <div className="flex flex-wrap gap-2">
                {availableTags?.map((tag: any) => (
                    <FormField
                        key={tag.id}
                        control={form.control}
                        name="tags"
                        render={({ field }) => {
                            return (
                                <FormItem
                                    key={tag.id}
                                    className="flex flex-row items-start space-x-1 space-y-0"
                                >
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(tag.id)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), tag.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                            (value) => value !== tag.id
                                                        )
                                                    )
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">
                                        {tag.name}
                                    </FormLabel>
                                </FormItem>
                            )
                        }}
                    />
                ))}
            </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          Create Event
        </Button>
      </form>
    </Form>
  )
}

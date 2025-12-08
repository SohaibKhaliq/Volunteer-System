import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"

export function GlobalSettings() {
  const [newTag, setNewTag] = useState("")
  const queryClient = useQueryClient()

  const { data: tags } = useQuery({
      queryKey: ['admin-tags'],
      queryFn: async () => (await api.get('/admin/tags')).data
  })

  const addMutation = useMutation({
      mutationFn: async (name: string) => {
          await api.post('/admin/tags', { name, type: 'general' })
      },
      onSuccess: () => {
          setNewTag("")
          queryClient.invalidateQueries(['admin-tags'])
          toast.success("Tag added")
      }
  })

  const deleteMutation = useMutation({
      mutationFn: async (id: number) => {
          await api.delete(\`/admin/tags/\${id}\`)
      },
      onSuccess: () => {
          queryClient.invalidateQueries(['admin-tags'])
          toast.success("Tag deleted")
      }
  })

  return (
    <div className="space-y-4">
        <h3 className="text-sm font-medium">Manage System Tags</h3>
        <div className="flex gap-2">
            <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="New Tag Name"
            />
            <Button size="icon" onClick={() => addMutation.mutate(newTag)}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex flex-wrap gap-2">
            {tags?.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                    {tag.name}
                    <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => deleteMutation.mutate(tag.id)}
                    />
                </Badge>
            ))}
        </div>
    </div>
  )
}

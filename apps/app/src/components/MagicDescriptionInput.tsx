import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Copy, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export function MagicDescriptionInput() {
  const [notes, setNotes] = useState("")
  const [generated, setGenerated] = useState<{description: string, captions: string[]} | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!notes.trim()) return
    setLoading(true)
    try {
        const res = await api.post('/ai/generate-description', { roughNotes: notes })
        setGenerated(res.data)
        toast.success("Magic content generated!")
    } catch (e) {
        toast.error("Failed to generate content")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
      <div className="space-y-2">
        <Label>Rough Notes</Label>
        <Textarea
            placeholder="e.g. Park cleanup, Sat 9am, need gloves, free pizza..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate with Magic Wand
        </Button>
      </div>

      {generated && (
        <div className="space-y-4 mt-4 animate-in fade-in">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-primary font-bold">Polished Description</Label>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(generated.description)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                <div className="p-3 bg-white rounded border text-sm min-h-[100px] whitespace-pre-wrap">
                    {generated.description}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Social Captions</Label>
                <div className="grid gap-2">
                    {generated.captions.map((cap, i) => (
                        <div key={i} className="p-2 bg-white rounded border text-xs text-muted-foreground italic">
                            {cap}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

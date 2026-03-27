"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updatePortfolioNotes } from "@/app/(app)/portfolio/actions"
import { NotebookPen } from "lucide-react"

interface Props {
  portfolioId: string
  initialNotes?: string | null
  initialGoal?: number | null
}

export function PortfolioNotesDialog({ portfolioId, initialNotes, initialGoal }: Props) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? "")
  const [goal, setGoal] = useState(initialGoal ? String(initialGoal) : "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updatePortfolioNotes(portfolioId, notes, goal ? parseFloat(goal) : null)
    setSaving(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <NotebookPen className="h-4 w-4 mr-2" />
          Notas & Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notas e Meta Patrimonial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Meta de patrimônio (R$)</Label>
            <Input
              type="number"
              placeholder="ex: 500000"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Notas pessoais</Label>
            <Textarea
              placeholder="Estratégia, objetivos, lembretes..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={5}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

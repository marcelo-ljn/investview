import type { Metadata } from "next"
import { FIRESimulator } from "@/components/features/simulador/fire-simulator"

export const metadata: Metadata = { title: "Simulador FIRE" }

export default function SimuladorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Simulador de Independência Financeira</h1>
        <p className="text-muted-foreground">Calcule quando você pode se aposentar e viver de renda passiva</p>
      </div>
      <FIRESimulator />
    </div>
  )
}

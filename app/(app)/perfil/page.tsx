import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Perfil" }

export default async function PerfilPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = session.user!

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Meu Perfil</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="text-lg">{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">Google</Badge>
                <Badge variant="outline">Perfil moderado</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm">Editar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurações da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium">Notificações de preço</p>
              <p className="text-xs text-muted-foreground">Alertas quando ativo atingir seu alvo</p>
            </div>
            <Button variant="outline" size="sm">Configurar</Button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-medium">Exportar dados</p>
              <p className="text-xs text-muted-foreground">Baixar seu portfolio em CSV</p>
            </div>
            <Button variant="outline" size="sm">Exportar</Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-destructive">Excluir conta</p>
              <p className="text-xs text-muted-foreground">Remove todos os seus dados permanentemente</p>
            </div>
            <Button variant="destructive" size="sm">Excluir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

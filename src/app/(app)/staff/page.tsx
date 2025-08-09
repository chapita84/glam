import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const staffMembers = [
  { name: "Jessica Miller", email: "jessica@glamdash.com", role: "Estilista Principal", avatar: "JM" },
  { name: "Monica Evans", email: "monica@glamdash.com", role: "Estilista", avatar: "ME" },
  { name: "Sophie Chen", email: "sophie@glamdash.com", role: "Artista de Uñas", avatar: "SC" },
  { name: "Usuario Admin", email: "admin@glamdash.com", role: "Propietario", avatar: "AU" },
]

const roles = [
  { name: "Estilista Principal" },
  { name: "Estilista" },
  { name: "Artista de Uñas" },
  { name: "Recepcionista" },
  { name: "Propietario" },
]


export default function StaffPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Invitar Personal
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invitar Nuevo Miembro del Personal</DialogTitle>
                        <DialogDescription>
                            Introduce el correo electrónico y asigna un rol a la persona que quieres invitar a tu equipo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Correo Electrónico</Label>
                            <Input id="email" type="email" placeholder="staff@example.com" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Rol</Label>
                             <Select>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => <SelectItem key={role.name} value={role.name.toLowerCase()}>{role.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Enviar Invitación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Tu Equipo</CardTitle>
          <CardDescription>
            Gestiona los miembros de tu personal y sus roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${staff.avatar}`} data-ai-hint="foto de perfil"/>
                        <AvatarFallback>{staff.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>{staff.name}</div>
                        <div className="text-sm text-muted-foreground">{staff.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.role === "Propietario" ? "default" : "secondary"}>{staff.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Eliminar del Equipo</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

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
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const roles = [
  { name: "Estilista Principal", permissions: 5 },
  { name: "Estilista", permissions: 4 },
  { name: "Artista de Uñas", permissions: 3 },
  { name: "Recepcionista", permissions: 2 },
  { name: "Propietario", permissions: 5 },
]

const permissions = [
    { id: "agenda_view", label: "Ver Agenda" },
    { id: "agenda_manage", label: "Gestionar Agenda" },
    { id: "services_manage", label: "Gestionar Servicios" },
    { id: "staff_manage", label: "Gestionar Personal" },
    { id: "reports_view", label: "Ver Reportes" },
]


export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Rol
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crear Nuevo Rol</DialogTitle>
                        <DialogDescription>
                            Define un nuevo rol y asígnale permisos específicos para tu equipo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role-name" className="text-right">Nombre</Label>
                            <Input id="role-name" placeholder="p. ej. Asistente" className="col-span-3" />
                        </div>
                        <div className="space-y-2">
                            <Label>Permisos</Label>
                            <div className="grid gap-2">
                                {permissions.map(p => (
                                    <div key={p.id} className="flex items-center gap-2">
                                        <Checkbox id={`perm-${p.id}`} />
                                        <Label htmlFor={`perm-${p.id}`} className="font-normal">{p.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Guardar Rol</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Tus Roles</CardTitle>
          <CardDescription>
            Gestiona los roles de tu personal y los permisos asociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos Activos</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.name}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant={role.name === "Propietario" ? "default" : "secondary"}>{role.permissions} de {permissions.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={role.name === 'Propietario'}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
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

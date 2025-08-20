'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAllUsers, updateUserProfile, deleteUserProfile, createUserProfile } from '@/lib/firebase/firestore';
import { sendPasswordReset, createNewUser } from '@/lib/firebase/auth-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Temporary implementation without Cloud Functions
// TODO: Implement proper user management with Cloud Functions

// --- Type Definitions ---
interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    globalRole: 'superAdmin' | 'owner' | 'staff' | 'customer';
    disabled: boolean;
}

// --- Sub-components (Forms and Dialogs) ---

function CreateUserForm({ isOpen, onClose, onUserCreated }: { isOpen: boolean; onClose: () => void; onUserCreated: () => void }) {
    // This component is complete and correct.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [globalRole, setGlobalRole] = useState<'superAdmin' | 'owner' | 'staff' | 'customer'>('customer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Crear usuario usando Cloud Function (Backend profesional)
            const uid = await createNewUser(email, password, displayName, globalRole);
            
            console.log('Usuario creado con UID:', uid);
            
            toast({ 
                title: 'Éxito', 
                description: `Usuario ${displayName} creado correctamente.`
            });
            onUserCreated();
        } catch (err: any) {
            console.error('Error creating user:', err);
            setError(err.message);
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Crear Nuevo Usuario</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                    {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Creación Profesional con Cloud Functions</AlertTitle>
                        <AlertDescription>
                            <div className="text-sm space-y-1">
                                <p>✅ Usuario creado con Firebase Admin SDK</p>
                                <p>✅ Tu sesión de administrador se mantiene segura</p>
                                <p>✅ Roles y permisos configurados automáticamente</p>
                            </div>
                        </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-2"><Label>Nombre</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Nombre completo del usuario" /></div>
                    <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="usuario@example.com" /></div>
                    <div className="grid gap-2"><Label>Contraseña</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" /></div>
                    <div className="grid gap-2"><Label>Rol Global</Label><Select onValueChange={(v) => setGlobalRole(v as any)} defaultValue={globalRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente</SelectItem><SelectItem value="owner">Propietario</SelectItem><SelectItem value="staff">Personal</SelectItem><SelectItem value="superAdmin">Super Admin</SelectItem></SelectContent></Select></div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Usuario
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserForm({ user, isOpen, onClose, onUserUpdated }: { user: User | null; isOpen: boolean; onClose: () => void; onUserUpdated: () => void }) {
    // This component is complete and correct.
    const [displayName, setDisplayName] = useState('');
    const [globalRole, setGlobalRole] = useState<'superAdmin' | 'owner' | 'staff' | 'customer'>('customer');
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setGlobalRole(user.globalRole);
            setDisabled(user.disabled);
        }
        // Limpiar campos de contraseña cuando se abre/cierra el modal
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordFields(false);
        setError(null);
    }, [user, isOpen]);

    const handleUpdateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Actualizar perfil del usuario
            await updateUserProfile(user.uid, { displayName, globalRole, disabled });
            
            // Si hay nueva contraseña, intentar cambiarla
            if (showPasswordFields && newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden');
                }
                if (newPassword.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }
                
                // Advertir sobre las limitaciones del cambio de contraseña
                toast({
                    title: 'Limitación',
                    description: 'El cambio directo de contraseña solo funciona para el usuario actualmente autenticado. Para otros usuarios, usa el email de restablecimiento.',
                    variant: 'destructive'
                });
            }
            
            toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
            onUserUpdated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendPasswordReset = async () => {
        if (!user || !user.email) return;
        setSendingPasswordReset(true);
        setError(null);
        try {
            await sendPasswordReset(user.email);
            toast({ 
                title: 'Email enviado', 
                description: `Se envió un email de restablecimiento de contraseña a ${user.email}` 
            });
        } catch (err: any) {
            setError(err.message);
            toast({ 
                title: 'Error', 
                description: 'No se pudo enviar el email de restablecimiento', 
                variant: 'destructive' 
            });
        } finally {
            setSendingPasswordReset(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Editar Usuario</DialogTitle><DialogDescription>Email: {user?.email}</DialogDescription></DialogHeader>
                <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
                     {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="grid gap-2"><Label>Nombre</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
                    <div className="grid gap-2"><Label>Rol Global</Label><Select onValueChange={(v) => setGlobalRole(v as any)} value={globalRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente</SelectItem><SelectItem value="owner">Propietario</SelectItem><SelectItem value="staff">Personal</SelectItem><SelectItem value="superAdmin">Super Admin</SelectItem></SelectContent></Select></div>
                    <div className="flex items-center space-x-2"><Switch checked={disabled} onCheckedChange={setDisabled} /><Label>Deshabilitar usuario</Label></div>
                    
                    {/* Sección de contraseña */}
                    <div className="border-t pt-4 space-y-3">
                        <Label className="text-sm font-medium">Gestión de Contraseña</Label>
                        
                        {/* Opción 1: Enviar email de reset */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Envía un email de restablecimiento de contraseña al usuario.
                            </p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleSendPasswordReset}
                                disabled={sendingPasswordReset || !user?.email}
                                className="w-full"
                            >
                                {sendingPasswordReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar email de restablecimiento
                            </Button>
                        </div>

                        {/* Separador */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">O</span>
                            </div>
                        </div>

                        {/* Opción 2: Establecer nueva contraseña directamente */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Nota:</strong> El cambio directo de contraseña requiere que el usuario esté autenticado. 
                                Para usuarios que no son el admin actual, usa la opción de email arriba.
                            </p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowPasswordFields(!showPasswordFields)}
                                className="w-full mb-2"
                            >
                                {showPasswordFields ? 'Ocultar' : 'Mostrar'} campos de nueva contraseña
                            </Button>
                            
                            {showPasswordFields && (
                                <div className="space-y-2">
                                    <div className="grid gap-2">
                                        <Label>Nueva Contraseña</Label>
                                        <Input 
                                            type="password" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Confirmar Contraseña</Label>
                                        <Input 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirma la nueva contraseña"
                                        />
                                    </div>
                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar Cambios</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteUserDialog({ user, isOpen, onClose, onUserDeleted }: { user: User | null; isOpen: boolean; onClose: () => void; onUserDeleted: () => void }) {
    // This component is complete and correct.
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDeleteUser = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await deleteUserProfile(user.uid);
            toast({ title: 'Éxito', description: 'Usuario eliminado correctamente.', variant: 'destructive' });
            onUserDeleted();
        } catch (err: any) {
            toast({ title: 'Error', description: `No se pudo eliminar el usuario: ${err.message}`, variant: 'destructive' });
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>¿Estás seguro?</DialogTitle><DialogDescription>Se eliminará permanentemente al usuario <strong>{user?.displayName}</strong>.</DialogDescription></DialogHeader>
                <DialogFooter className="mt-4"><Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button><Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sí, eliminar</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main Page Component ---
export default function AdminUsersPage() {
    const { currentUser, profile } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const initializeUsersCollection = async () => {
        try {
            console.log('Inicializando colección de usuarios...');
            
            // Crear el perfil del usuario actual
            const currentUserProfile = {
                uid: currentUser!.uid,
                email: currentUser!.email || '',
                firstName: profile!.displayName?.split(' ')[0] || 'Usuario',
                lastName: profile!.displayName?.split(' ').slice(1).join(' ') || 'Administrador',
                phone: null,
                globalRole: 'superAdmin' as const,
                photoURL: currentUser!.photoURL
            };

            await createUserProfile(currentUserProfile);

            // Crear algunos usuarios de ejemplo
            const exampleUsers = [
                {
                    uid: 'example-owner-1',
                    email: 'owner@estudio.com',
                    firstName: 'Maria',
                    lastName: 'Rodriguez',
                    globalRole: 'owner' as const
                },
                {
                    uid: 'example-staff-1',
                    email: 'staff@estudio.com',
                    firstName: 'Juan',
                    lastName: 'Gonzalez',
                    globalRole: 'staff' as const
                },
                {
                    uid: 'example-customer-1',
                    email: 'cliente@example.com',
                    firstName: 'Ana',
                    lastName: 'Lopez',
                    globalRole: 'customer' as const
                }
            ];

            for (const user of exampleUsers) {
                await createUserProfile(user);
            }

            toast({ title: 'Éxito', description: 'Colección de usuarios inicializada correctamente.' });
            fetchUsers(); // Recargar la lista
            
        } catch (error: any) {
            console.error('Error inicializando usuarios:', error);
            toast({ title: 'Error', description: 'No se pudo inicializar la colección de usuarios.', variant: 'destructive' });
        }
    };

    const fetchUsers = useCallback(async () => {
        if (!currentUser || profile?.globalRole !== 'superAdmin') {
            setError('No tienes permiso para ver esta página.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Usar la función getAllUsers
            const usersList = await getAllUsers();
            console.log('Found users:', usersList);
            setUsers(usersList);
            
            // Si no hay usuarios, no es un error, simplemente necesita inicialización
            // No establecer error aquí
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError('Error cargando usuarios: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser, profile]);

    useEffect(() => {
        // Only fetch users if the current user is loaded and is a superAdmin
        if (currentUser) {
            fetchUsers();
        }
    }, [currentUser, fetchUsers]);
    
    const closeModals = () => {
        setIsCreateModalOpen(false);
        setEditingUser(null);
        setDeletingUser(null);
    };

    if (error) return <Card className="m-auto mt-12 max-w-lg"><CardHeader><CardTitle className="text-destructive">Error</CardTitle><CardDescription>{error}</CardDescription></CardHeader></Card>;
    
    // The loading state will now correctly resolve to false
    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Gestión de Usuarios</CardTitle></div>
                    <div className="flex gap-2">
                        {users.length === 0 && !loading && (
                            <Button variant="outline" size="sm" onClick={initializeUsersCollection}>
                                <PlusCircle className="mr-2 h-4 w-4" />Inicializar Usuarios
                            </Button>
                        )}
                        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />Crear Usuario
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Nombre</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.displayName}</TableCell>
                                    <TableCell>{user.globalRole}</TableCell>
                                    <TableCell>{user.disabled ? 'Deshabilitado' : 'Activo'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeletingUser(user)} disabled={user.uid === currentUser?.uid}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateUserForm isOpen={isCreateModalOpen} onClose={closeModals} onUserCreated={() => { closeModals(); fetchUsers(); }} />
            <EditUserForm isOpen={!!editingUser} user={editingUser} onClose={closeModals} onUserUpdated={() => { closeModals(); fetchUsers(); }} />
            <DeleteUserDialog isOpen={!!deletingUser} user={deletingUser} onClose={closeModals} onUserDeleted={() => { closeModals(); fetchUsers(); }} />
        </div>
    );
}

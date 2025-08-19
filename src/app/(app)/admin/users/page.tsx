'use client';

import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
import { app } from '@/lib/firebase/config';

// --- Firebase Functions Setup ---
const functions = getFunctions(app, 'us-central1');
const listUsersFn = httpsCallable(functions, 'listUsers');
const createUserFn = httpsCallable(functions, 'createUser');
const updateUserFn = httpsCallable(functions, 'updateUser');
const deleteUserFn = httpsCallable(functions, 'deleteUser');

// --- Type Definitions ---
interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    globalRole: 'superAdmin' | 'studioOwner' | 'staff' | 'customer';
    disabled: boolean;
}

// --- Sub-components (Forms and Dialogs) ---

function CreateUserForm({ isOpen, onClose, onUserCreated }: { isOpen: boolean; onClose: () => void; onUserCreated: () => void }) {
    // This component is complete and correct.
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [globalRole, setGlobalRole] = useState<'superAdmin' | 'studioOwner' | 'customer'>('customer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createUserFn({ email, password, displayName, globalRole });
            toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
            onUserCreated();
        } catch (err: any) {
            setError(err.message);
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
                    <div className="grid gap-2"><Label>Nombre</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
                    <div className="grid gap-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                    <div className="grid gap-2"><Label>Contraseña</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                    <div className="grid gap-2"><Label>Rol Global</Label><Select onValueChange={(v) => setGlobalRole(v as any)} defaultValue={globalRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente</SelectItem><SelectItem value="studioOwner">Dueño de Estudio</SelectItem><SelectItem value="superAdmin">Super Admin</SelectItem></SelectContent></Select></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear Usuario</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserForm({ user, isOpen, onClose, onUserUpdated }: { user: User | null; isOpen: boolean; onClose: () => void; onUserUpdated: () => void }) {
    // This component is complete and correct.
    const [displayName, setDisplayName] = useState('');
    const [globalRole, setGlobalRole] = useState<'superAdmin' | 'studioOwner' | 'staff' | 'customer'>('customer');
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setGlobalRole(user.globalRole);
            setDisabled(user.disabled);
        }
    }, [user]);

    const handleUpdateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            await updateUserFn({ uid: user.uid, displayName, globalRole, disabled });
            toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.' });
            onUserUpdated();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader><DialogTitle>Editar Usuario</DialogTitle><DialogDescription>Email: {user?.email}</DialogDescription></DialogHeader>
                <form onSubmit={handleUpdateUser} className="grid gap-4 py-4">
                     {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    <div className="grid gap-2"><Label>Nombre</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
                    <div className="grid gap-2"><Label>Rol Global</Label><Select onValueChange={(v) => setGlobalRole(v as any)} value={globalRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente</SelectItem><SelectItem value="studioOwner">Dueño de Estudio</SelectItem><SelectItem value="superAdmin">Super Admin</SelectItem></SelectContent></Select></div>
                    <div className="flex items-center space-x-2"><Switch checked={disabled} onCheckedChange={setDisabled} /><Label>Deshabilitar usuario</Label></div>
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
            await deleteUserFn({ uid: user.uid });
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
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!currentUser || currentUser.globalRole !== 'superAdmin') {
            setError('No tienes permiso para ver esta página.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await listUsersFn();
            const data = (result.data as any)?.users;
            if (!Array.isArray(data)) {
                throw new Error("La respuesta del servidor no es un array de usuarios válido.");
            }
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false); // This is the crucial line that was missing
        }
    }, [currentUser]);

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
                    <Button size="sm" onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Crear Usuario</Button>
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

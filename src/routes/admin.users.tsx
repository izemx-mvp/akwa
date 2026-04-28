import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Shield, KeyRound, Grid3x3, Activity, Plus, Pencil, Trash2, PowerOff,
  Check, X, AlertTriangle, Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

// ---------- Types ----------
type Status = "Actif" | "Inactif";
type RoleId =
  | "responsable_achat"
  | "client"
  | "responsable_logistique"
  | "responsable_export"
  | "agent"
  | "responsable_commercial"
  | "admin";

type User = {
  id: string;
  name: string;
  email: string;
  roles: RoleId[];
  status: Status;
  lastLogin: string;
};

type Permission = { id: string; label: string };
type PermissionGroup = { id: string; label: string; icon: string; perms: Permission[] };

type Role = {
  id: RoleId;
  name: string;
  description: string;
  permissions: Set<string>; // permission ids
};

// ---------- Données initiales ----------
const PERMISSION_GROUPS: PermissionGroup[] = [
  { id: "orders", label: "Commandes", icon: "📦", perms: [
    { id: "orders.view", label: "Voir" },
    { id: "orders.create", label: "Créer" },
    { id: "orders.edit", label: "Modifier" },
    { id: "orders.validate", label: "Valider" },
  ]},
  { id: "pricing", label: "Pricing", icon: "💰", perms: [
    { id: "pricing.view", label: "Voir" },
    { id: "pricing.edit", label: "Modifier" },
    { id: "pricing.apply", label: "Appliquer recommandations" },
    { id: "pricing.simulate", label: "Lancer simulation" },
  ]},
  { id: "container", label: "Conteneur", icon: "🚛", perms: [
    { id: "container.view", label: "Voir" },
    { id: "container.optimize", label: "Optimiser" },
    { id: "container.apply", label: "Appliquer scénario" },
  ]},
  { id: "export", label: "Export", icon: "📄", perms: [
    { id: "export.view", label: "Voir expéditions" },
    { id: "export.docs.add", label: "Ajouter documents" },
    { id: "export.docs.validate", label: "Valider documents" },
    { id: "export.delays", label: "Gérer retards" },
  ]},
  { id: "margins", label: "Marges", icon: "📊", perms: [
    { id: "margins.view", label: "Voir" },
    { id: "margins.analyze", label: "Analyser" },
  ]},
  { id: "agents", label: "Agents IA", icon: "🤖", perms: [
    { id: "agents.use", label: "Utiliser" },
    { id: "agents.configure", label: "Configurer" },
  ]},
  { id: "settings", label: "Paramètres", icon: "⚙️", perms: [
    { id: "settings.full", label: "Accès complet" },
    { id: "settings.users", label: "Gestion utilisateurs" },
  ]},
];

const ALL_PERMS = PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => p.id));

const INITIAL_ROLES: Role[] = [
  { id: "responsable_achat", name: "Responsable Achat", description: "Gère les commandes et consulte le pricing.",
    permissions: new Set(["orders.view","orders.create","orders.edit","orders.validate","pricing.view"]) },
  { id: "client", name: "Client", description: "Accès au portail client uniquement.",
    permissions: new Set(["orders.view","orders.create"]) },
  { id: "responsable_logistique", name: "Responsable Logistique", description: "Optimisation et suivi conteneur.",
    permissions: new Set(["container.view","container.optimize","container.apply","export.view"]) },
  { id: "responsable_export", name: "Responsable Export", description: "Suivi des expéditions et validation des documents.",
    permissions: new Set(["export.view","export.docs.add","export.docs.validate","export.delays"]) },
  { id: "agent", name: "Agent", description: "Accès opérationnel limité.",
    permissions: new Set(["orders.view","export.view"]) },
  { id: "responsable_commercial", name: "Responsable Commercial", description: "Pilotage du pricing et des marges.",
    permissions: new Set(["pricing.view","pricing.edit","pricing.apply","pricing.simulate","margins.view","margins.analyze"]) },
  { id: "admin", name: "Administrateur", description: "Accès complet à la plateforme.",
    permissions: new Set(ALL_PERMS) },
];

const INITIAL_USERS: User[] = [
  { id: "u1", name: "Ahmed El Khalfi", email: "ahmed@akwa.com", roles: ["responsable_logistique"], status: "Actif", lastLogin: "Il y a 2h" },
  { id: "u2", name: "Fatima Bennani", email: "fatima@akwa.com", roles: ["responsable_export"], status: "Actif", lastLogin: "Il y a 30 min" },
  { id: "u3", name: "Youssef Amrani", email: "youssef@akwa.com", roles: ["responsable_commercial"], status: "Actif", lastLogin: "Hier" },
  { id: "u4", name: "Sara Idrissi", email: "sara@akwa.com", roles: ["responsable_achat"], status: "Actif", lastLogin: "Il y a 4h" },
  { id: "u5", name: "Karim Tazi", email: "karim@akwa.com", roles: ["agent"], status: "Inactif", lastLogin: "Il y a 12 jours" },
  { id: "u6", name: "Client AKWA Senegal", email: "contact@akwa-sn.com", roles: ["client"], status: "Actif", lastLogin: "Il y a 1h" },
];

const INITIAL_LOGS = [
  { ts: "2026-04-28 10:24", user: "Fatima Bennani", action: "Validation document BL #BL-2841" },
  { ts: "2026-04-28 09:58", user: "Ahmed El Khalfi", action: "Optimisation conteneur scénario B appliqué" },
  { ts: "2026-04-28 09:15", user: "Youssef Amrani", action: "Modification prix produit Lubricant Pack XL" },
  { ts: "2026-04-28 08:42", user: "Admin", action: "Rôle attribué à Fatima : Responsable Export" },
  { ts: "2026-04-28 08:30", user: "Sara Idrissi", action: "Connexion détectée" },
];

// ---------- Composant ----------
function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [logs] = useState(INITIAL_LOGS);

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== "all" && !u.roles.includes(filterRole as RoleId)) return false;
      if (filterStatus !== "all" && u.status !== filterStatus) return false;
      if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [users, filterRole, filterStatus, search]);

  const roleName = (id: RoleId) => roles.find((r) => r.id === id)?.name ?? id;

  const openNewUser = () => { setEditingUser(null); setUserDialogOpen(true); };
  const openEditUser = (u: User) => { setEditingUser(u); setUserDialogOpen(true); };

  const saveUser = (u: User) => {
    setUsers((prev) => {
      const exists = prev.find((x) => x.id === u.id);
      if (exists) return prev.map((x) => (x.id === u.id ? u : x));
      return [...prev, { ...u, id: `u${Date.now()}`, lastLogin: "—" }];
    });
    toast.success(editingUser ? "Utilisateur modifié" : "Utilisateur créé");
    setUserDialogOpen(false);
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === "Actif" ? "Inactif" : "Actif" } : u));
    toast.success("Statut mis à jour");
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("Utilisateur supprimé");
  };

  const openNewRole = () => { setEditingRole(null); setRoleDialogOpen(true); };
  const openEditRole = (r: Role) => { setEditingRole({ ...r, permissions: new Set(r.permissions) }); setRoleDialogOpen(true); };

  const saveRole = (r: Role) => {
    setRoles((prev) => {
      const exists = prev.find((x) => x.id === r.id);
      if (exists) return prev.map((x) => (x.id === r.id ? r : x));
      return [...prev, r];
    });
    toast.success(editingRole ? "Rôle modifié" : "Rôle créé");
    setRoleDialogOpen(false);
  };

  const deleteRole = (id: RoleId) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rôle supprimé");
  };

  // Matrice : agréger les permissions d'un rôle par module
  const moduleAccess = (role: Role, groupId: string): "full" | "partial" | "none" => {
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId)!;
    const owned = group.perms.filter((p) => role.permissions.has(p.id)).length;
    if (owned === 0) return "none";
    if (owned === group.perms.length) return "full";
    return "partial";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs & Accès</h1>
        <p className="text-sm text-muted-foreground">
          Gouvernance des utilisateurs, rôles et permissions de la plateforme AKWA AI.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-2" />Rôles</TabsTrigger>
          <TabsTrigger value="permissions"><KeyRound className="h-4 w-4 mr-2" />Permissions</TabsTrigger>
          <TabsTrigger value="matrix"><Grid3x3 className="h-4 w-4 mr-2" />Matrice des accès</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="h-4 w-4 mr-2" />Activité & logs</TabsTrigger>
        </TabsList>

        {/* ---- Utilisateurs ---- */}
        <TabsContent value="users" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input placeholder="Rechercher un utilisateur..." className="pl-8"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={openNewUser}><Plus className="h-4 w-4" />Ajouter un utilisateur</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 pr-3">Nom</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Rôle(s)</th>
                    <th className="py-2 pr-3">Statut</th>
                    <th className="py-2 pr-3">Dernière connexion</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-3 font-medium">{u.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => <Badge key={r} variant="secondary">{roleName(r)}</Badge>)}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={u.status === "Actif" ? "default" : "outline"}>{u.status}</Badge>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{u.lastLogin}</td>
                      <td className="py-3 pr-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleStatus(u.id)}><PowerOff className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Aucun utilisateur trouvé.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ---- Rôles ---- */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Rôles disponibles</h3>
            <Button onClick={openNewRole}><Plus className="h-4 w-4" />Ajouter un rôle</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card shadow-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditRole(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteRole(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(r.permissions).slice(0, 6).map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                  ))}
                  {r.permissions.size > 6 && (
                    <Badge variant="outline" className="text-[10px]">+{r.permissions.size - 6}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---- Permissions ---- */}
        <TabsContent value="permissions" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Définissez les permissions disponibles. Les permissions s'attribuent ensuite aux rôles.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.id} className="rounded-xl border border-border bg-card shadow-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{g.icon}</span>
                  <h4 className="font-semibold">{g.label}</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  {g.perms.map((p) => (
                    <li key={p.id} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-2 last:pb-0">
                      <div>
                        <div>{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.id}</div>
                      </div>
                      <Badge variant="outline">Disponible</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---- Matrice ---- */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card p-5 overflow-x-auto">
            <h3 className="font-semibold mb-3">Matrice des accès</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Rôle</th>
                  {PERMISSION_GROUPS.map((g) => (
                    <th key={g.id} className="py-2 px-2 text-center">{g.icon} {g.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 pr-3 font-medium">{r.name}</td>
                    {PERMISSION_GROUPS.map((g) => {
                      const a = moduleAccess(r, g.id);
                      return (
                        <td key={g.id} className="py-3 px-2 text-center">
                          {a === "full" && <Check className="h-5 w-5 mx-auto text-emerald-500" />}
                          {a === "partial" && <AlertTriangle className="h-5 w-5 mx-auto text-amber-500" />}
                          {a === "none" && <X className="h-5 w-5 mx-auto text-rose-500" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Check className="h-4 w-4 text-emerald-500" /> Accès complet</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-500" /> Accès partiel</span>
              <span className="flex items-center gap-1"><X className="h-4 w-4 text-rose-500" /> Pas d'accès</span>
            </div>
          </div>
        </TabsContent>

        {/* ---- Logs ---- */}
        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-card p-5">
            <h3 className="font-semibold mb-4">Historique des actions utilisateurs</h3>
            <ul className="divide-y divide-border">
              {logs.map((l, i) => (
                <li key={i} className="py-3 flex items-start gap-3">
                  <Activity className="h-4 w-4 mt-0.5 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm">{l.action}</div>
                    <div className="text-xs text-muted-foreground">{l.user} · {l.ts}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* ---- Dialog Utilisateur ---- */}
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        roles={roles}
        onSave={saveUser}
      />

      {/* ---- Dialog Rôle ---- */}
      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        onSave={saveRole}
      />
    </div>
  );
}

// ---------- Dialog Utilisateur ----------
function UserDialog({
  open, onOpenChange, user, roles, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: User | null;
  roles: Role[];
  onSave: (u: User) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(user?.status ?? "Actif");
  const [selectedRoles, setSelectedRoles] = useState<Set<RoleId>>(new Set(user?.roles ?? []));

  // Reset when user changes
  useMemo(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setStatus(user?.status ?? "Actif");
    setSelectedRoles(new Set(user?.roles ?? []));
  }, [user, open]);

  const toggleRole = (id: RoleId) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!name || !email) { toast.error("Nom et email obligatoires"); return; }
    onSave({
      id: user?.id ?? "",
      name, email,
      roles: Array.from(selectedRoles),
      status,
      lastLogin: user?.lastLogin ?? "—",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Nom complet</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Mot de passe</Label><Input type="password" placeholder={user ? "Laisser vide pour ne pas changer" : ""} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div>
            <Label>Rôles (multi-sélection)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm border border-border rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted/40">
                  <input type="checkbox" checked={selectedRoles.has(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Dialog Rôle ----------
function RoleDialog({
  open, onOpenChange, role, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: Role | null;
  onSave: (r: Role) => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role?.permissions ?? []));

  useMemo(() => {
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setPermissions(new Set(role?.permissions ?? []));
  }, [role, open]);

  const togglePerm = (id: string, v: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (v) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSave = () => {
    if (!name) { toast.error("Nom obligatoire"); return; }
    onSave({
      id: role?.id ?? (`custom_${Date.now()}` as RoleId),
      name, description,
      permissions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Modifier le rôle" : "Ajouter un rôle"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Nom du rôle</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-3">
            <Label>Permissions</Label>
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.id} className="border border-border rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>{g.icon}</span><span className="font-medium text-sm">{g.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {g.perms.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.label}</span>
                      <Switch checked={permissions.has(p.id)} onCheckedChange={(v) => togglePerm(p.id, v)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

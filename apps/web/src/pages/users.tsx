import { useState } from "react";
import { useListUsers, useCreateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Settings, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", email: "", password: "", role: "patient", phone: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users, isLoading } = useListUsers({}, { query: { queryKey: getListUsersQueryKey({}) } });
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const filtered = users?.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  function handleCreate() {
    if (!form.username || !form.name || !form.email || !form.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createUser.mutate({ data: { username: form.username, name: form.name, email: form.email, password: form.password, role: form.role as "admin" | "caretaker" | "patient", phone: form.phone || null, avatarUrl: null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey({}) });
        setOpen(false);
        setForm({ username: "", name: "", email: "", password: "", role: "patient", phone: "" });
        toast({ title: "User created" });
      },
      onError: () => toast({ title: "Failed to create user", variant: "destructive" }),
    });
  }

  const roleColors: Record<string, string> = {
    admin: "bg-yellow-100 text-yellow-800",
    caretaker: "bg-blue-100 text-blue-800",
    patient: "bg-green-100 text-green-800",
  };

  return (
    <AppLayout title="User Management">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-users" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user"><Plus className="w-4 h-4 mr-2" />Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Username</Label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1" data-testid="input-username" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="caretaker">Caretaker</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" data-testid="input-name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" data-testid="input-email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" data-testid="input-password" />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" data-testid="input-phone" />
              </div>
              <Button onClick={handleCreate} disabled={createUser.isPending} className="w-full" data-testid="button-save-user">
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl border">
        {isLoading ? (
          <div className="divide-y">{[...Array(6)].map((_, i) => <div key={i} className="p-5 animate-pulse flex gap-4"><div className="w-10 h-10 bg-gray-100 rounded-full" /><div className="flex-1 h-10 bg-gray-100 rounded" /></div>)}</div>
        ) : filtered && filtered.length > 0 ? (
          <div className="divide-y">
            {filtered.map((u) => (
              <div key={u.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-4 sm:p-5" data-testid={`user-row-${u.id}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "hsl(185 75% 40%)" }}>{u.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] ?? "bg-gray-100 text-gray-800"}`}>{u.role}</span>
                    {!u.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">@{u.username} &bull; {u.email}</div>
                </div>
                <button onClick={() => deleteUser.mutate({ id: u.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListUsersQueryKey({}) }); toast({ title: "User deleted" }); } })} className="self-start rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 sm:self-auto" data-testid={`delete-user-${u.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Settings className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

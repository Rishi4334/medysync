import { useState } from "react";
import { useListMedicines, useCreateMedicine, useDeleteMedicine, useListUsers, getListMedicinesQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Pill, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

const MEDICINE_COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function MedicinesPage() {
  const user = getCurrentUser();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: user?.role === "patient" ? String(user.id) : "", name: "", dosage: "", unit: "mg", description: "", color: MEDICINE_COLORS[0] });
  const { toast } = useToast();
  const qc = useQueryClient();

  const queryParams = user?.role === "patient" ? { patientId: user.id } : {};
  const { data: medicines, isLoading } = useListMedicines(queryParams, { query: { queryKey: getListMedicinesQueryKey(queryParams) } });
  const { data: patients } = useListUsers({ role: "patient" }, { query: { enabled: user?.role !== "patient", queryKey: getListUsersQueryKey({ role: "patient" }) } });

  const createMedicine = useCreateMedicine();
  const deleteMedicine = useDeleteMedicine();

  const filtered = medicines?.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  function handleCreate() {
    if (!form.patientId || !form.name || !form.dosage) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMedicine.mutate({ data: { patientId: parseInt(form.patientId), name: form.name, dosage: form.dosage, unit: form.unit, description: form.description || null, color: form.color || null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMedicinesQueryKey({}) });
        setOpen(false);
        setForm({ patientId: user?.role === "patient" ? String(user.id) : "", name: "", dosage: "", unit: "mg", description: "", color: MEDICINE_COLORS[0] });
        toast({ title: "Medicine added" });
      },
      onError: () => toast({ title: "Failed to add medicine", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteMedicine.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListMedicinesQueryKey({}) }); toast({ title: "Medicine removed" }); } });
  }

  return (
    <AppLayout title="Medicines">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-medicines" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-medicine"><Plus className="w-4 h-4 mr-2" />Add Medicine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Medicine</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {user?.role !== "patient" && (
                <div>
                  <Label>Patient</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Medicine Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Metformin" className="mt-1" data-testid="input-medicine-name" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Dosage</Label>
                  <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="500" className="mt-1" data-testid="input-dosage" />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="mcg">mcg</SelectItem>
                      <SelectItem value="tablets">tablets</SelectItem>
                      <SelectItem value="drops">drops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Purpose of this medicine" className="mt-1" data-testid="input-description" />
              </div>
              <div>
                <Label>Color Label</Label>
                <div className="flex gap-2 mt-1">
                  {MEDICINE_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: form.color === c ? "#1e293b" : "transparent" }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMedicine.isPending} className="w-full" data-testid="button-save-medicine">
                {createMedicine.isPending ? "Adding..." : "Add Medicine"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border p-5 card-hover" data-testid={`medicine-card-${m.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.color ?? "#3B82F6" }}>
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-muted-foreground" data-testid={`delete-medicine-${m.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{m.name}</h3>
              <div className="text-lg font-bold" style={{ color: m.color ?? "#3B82F6" }}>{m.dosage} {m.unit}</div>
              {m.description && <p className="text-xs text-muted-foreground mt-2">{m.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Pill className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No medicines found</p>
        </div>
      )}
    </AppLayout>
  );
}

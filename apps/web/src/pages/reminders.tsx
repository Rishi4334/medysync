import { useState } from "react";
import { useListReminders, useCreateReminder, useDeleteReminder, useToggleReminder, useListUsers, useListMedicines, getListRemindersQueryKey, getListUsersQueryKey, getListMedicinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

export default function RemindersPage() {
  const user = getCurrentUser();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: "", medicineId: "", scheduledTime: "08:00", daysOfWeek: "daily", dosage: "", notes: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const queryParams = user?.role === "patient" ? { patientId: user.id } : {};
  const { data: reminders, isLoading } = useListReminders(queryParams, { query: { queryKey: getListRemindersQueryKey(queryParams) } });
  const { data: patients } = useListUsers({ role: "patient" }, { query: { queryKey: getListUsersQueryKey({ role: "patient" }) } });
  const { data: medicines } = useListMedicines(form.patientId ? { patientId: parseInt(form.patientId) } : {}, { query: { enabled: !!form.patientId, queryKey: getListMedicinesQueryKey(form.patientId ? { patientId: parseInt(form.patientId) } : {}) } });

  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();
  const toggleReminder = useToggleReminder();

  const filtered = reminders?.filter((r) => r.medicineName.toLowerCase().includes(search.toLowerCase()) || r.patient?.name?.toLowerCase().includes(search.toLowerCase()));

  function handleCreate() {
    if (!form.patientId || !form.medicineId || !form.dosage) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const med = medicines?.find((m) => m.id === parseInt(form.medicineId));
    createReminder.mutate({ data: { patientId: parseInt(form.patientId), medicineId: parseInt(form.medicineId), scheduledTime: form.scheduledTime, daysOfWeek: form.daysOfWeek, dosage: form.dosage, notes: form.notes || null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListRemindersQueryKey({}) });
        setOpen(false);
        setForm({ patientId: "", medicineId: "", scheduledTime: "08:00", daysOfWeek: "daily", dosage: "", notes: "" });
        toast({ title: "Reminder created successfully" });
      },
      onError: () => toast({ title: "Failed to create reminder", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    deleteReminder.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRemindersQueryKey({}) }); toast({ title: "Reminder deleted" }); } });
  }

  function handleToggle(id: number) {
    toggleReminder.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListRemindersQueryKey({}) }); } });
  }

  return (
    <AppLayout title="Medicine Reminders">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search reminders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-reminders" />
        </div>
        {(user?.role === "admin" || user?.role === "caretaker") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="button-add-reminder"><Plus className="w-4 h-4 mr-2" />Add Reminder</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Medicine Reminder</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Patient</Label>
                  <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v, medicineId: "" })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Medicine</Label>
                  <Select value={form.medicineId} onValueChange={(v) => setForm({ ...form, medicineId: v })} disabled={!form.patientId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                    <SelectContent>
                      {medicines?.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.dosage}{m.unit})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Scheduled Time</Label>
                    <Input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} className="mt-1" data-testid="input-time" />
                  </div>
                  <div>
                    <Label>Days</Label>
                    <Select value={form.daysOfWeek} onValueChange={(v) => setForm({ ...form, daysOfWeek: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="1,2,3,4,5">Weekdays</SelectItem>
                        <SelectItem value="0,6">Weekends</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 500mg after breakfast" className="mt-1" data-testid="input-dosage" />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional instructions" className="mt-1" data-testid="input-notes" />
                </div>
                <Button onClick={handleCreate} disabled={createReminder.isPending} className="w-full" data-testid="button-save-reminder">
                  {createReminder.isPending ? "Creating..." : "Create Reminder"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border divide-y">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5" data-testid={`reminder-row-${r.id}`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${r.isActive ? "bg-green-500" : "bg-gray-300"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium">{r.medicineName}</span>
                  <Badge variant={r.isActive ? "default" : "secondary"}>{r.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{r.dosage} &bull; {r.scheduledTime} &bull; {r.daysOfWeek === "daily" ? "Daily" : r.daysOfWeek}{r.patient && <span> &bull; {r.patient.name}</span>}</div>
                {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
              </div>
              {(user?.role === "admin" || user?.role === "caretaker") && (
                <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
                  <button onClick={() => handleToggle(r.id)} className="p-2 hover:bg-muted rounded-lg transition-colors" data-testid={`toggle-reminder-${r.id}`}>
                    {r.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-muted-foreground" data-testid={`delete-reminder-${r.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No reminders found</p>
        </div>
      )}
    </AppLayout>
  );
}

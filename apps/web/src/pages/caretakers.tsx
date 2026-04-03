import { useState } from "react";
import { useListUsers, useListAssignments, useCreateAssignment, useDeleteAssignment, getListUsersQueryKey, getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserCheck, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CaretakersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ caretakerId: "", patientId: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: caretakers, isLoading: loadingCaretakers } = useListUsers({ role: "caretaker" }, { query: { queryKey: getListUsersQueryKey({ role: "caretaker" }) } });
  const { data: patients } = useListUsers({ role: "patient" }, { query: { queryKey: getListUsersQueryKey({ role: "patient" }) } });
  const { data: assignments } = useListAssignments({}, { query: { queryKey: getListAssignmentsQueryKey() } });

  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  function handleAssign() {
    if (!form.caretakerId || !form.patientId) {
      toast({ title: "Select both caretaker and patient", variant: "destructive" });
      return;
    }
    createAssignment.mutate({ data: { caretakerId: parseInt(form.caretakerId), patientId: parseInt(form.patientId) } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        setOpen(false);
        setForm({ caretakerId: "", patientId: "" });
        toast({ title: "Assignment created" });
      },
      onError: () => toast({ title: "Failed to create assignment", variant: "destructive" }),
    });
  }

  function handleDeleteAssignment(id: number) {
    deleteAssignment.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
        toast({ title: "Assignment removed" });
      },
    });
  }

  return (
    <AppLayout title="Caretakers">
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-assign-caretaker"><Plus className="w-4 h-4 mr-2" />Assign Caretaker</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Caretaker to Patient</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Caretaker</Label>
                <Select value={form.caretakerId} onValueChange={(v) => setForm({ ...form, caretakerId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select caretaker" /></SelectTrigger>
                  <SelectContent>
                    {caretakers?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Patient</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssign} disabled={createAssignment.isPending} className="w-full" data-testid="button-save-assignment">
                {createAssignment.isPending ? "Assigning..." : "Create Assignment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loadingCaretakers ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl border animate-pulse" />)
        ) : caretakers?.map((c) => {
          const careAssignments = assignments?.filter((a) => a.caretakerId === c.id);
          return (
            <div key={c.id} className="bg-white rounded-2xl border p-5 card-hover" data-testid={`caretaker-card-${c.id}`}>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "hsl(213 75% 50%)" }}>{c.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted-foreground">{c.email}</div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {careAssignments?.length ?? 0} patients
                </div>
              </div>
              <div className="space-y-2">
                {careAssignments && careAssignments.length > 0 ? (
                  careAssignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(185 75% 40%)" }}>{a.patient?.name?.charAt(0) ?? "?"}</div>
                      <span className="flex-1">{a.patient?.name ?? "Unknown"}</span>
                      <button onClick={() => handleDeleteAssignment(a.id)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-colors text-muted-foreground" data-testid={`delete-assignment-${a.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No patients assigned</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}

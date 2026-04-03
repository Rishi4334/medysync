import { useState } from "react";
import { useListDevices, useRegisterDevice, useDeleteDevice, useListUsers, getListDevicesQueryKey, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Cpu, Plus, Wifi, WifiOff, HelpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function DevicesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ deviceCode: "", name: "", patientId: "", firmwareVersion: "arduino-1.0.0" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: devices, isLoading } = useListDevices({ query: { queryKey: getListDevicesQueryKey() } });
  const { data: patients } = useListUsers({ role: "patient" }, { query: { queryKey: getListUsersQueryKey({ role: "patient" }) } });

  const registerDevice = useRegisterDevice();
  const deleteDevice = useDeleteDevice();

  function handleRegister() {
    if (!form.deviceCode || !form.name) {
      toast({ title: "Device code and name are required", variant: "destructive" });
      return;
    }
    registerDevice.mutate({ data: { deviceCode: form.deviceCode, name: form.name, patientId: form.patientId ? parseInt(form.patientId) : null, firmwareVersion: form.firmwareVersion || null } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDevicesQueryKey() });
        setOpen(false);
        setForm({ deviceCode: "", name: "", patientId: "", firmwareVersion: "arduino-1.0.0" });
        toast({ title: "Device registered" });
      },
      onError: () => toast({ title: "Failed to register device", variant: "destructive" }),
    });
  }

  const statusConfig = {
    online: { icon: Wifi, color: "text-green-500", bg: "bg-green-50", label: "Online", badge: "bg-green-100 text-green-800" },
    offline: { icon: WifiOff, color: "text-red-500", bg: "bg-red-50", label: "Offline", badge: "bg-red-100 text-red-800" },
    unknown: { icon: HelpCircle, color: "text-gray-400", bg: "bg-gray-50", label: "Unknown", badge: "bg-gray-100 text-gray-600" },
  };

  return (
    <AppLayout title="IoT Devices">
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-register-device"><Plus className="w-4 h-4 mr-2" />Register Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register ESP32 Device</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Device Code</Label>
                <Input value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} placeholder="e.g. ESP32-005" className="mt-1" data-testid="input-device-code" />
              </div>
              <div>
                <Label>Device Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Patient Room Box" className="mt-1" data-testid="input-device-name" />
              </div>
              <div>
                <Label>Assign to Patient (optional)</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Firmware Version</Label>
                <Input value={form.firmwareVersion} onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })} className="mt-1" data-testid="input-firmware" />
              </div>
              <Button onClick={handleRegister} disabled={registerDevice.isPending} className="w-full" data-testid="button-save-device">
                {registerDevice.isPending ? "Registering..." : "Register Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : devices && devices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => {
            const cfg = statusConfig[d.status as keyof typeof statusConfig] ?? statusConfig.unknown;
            const Icon = cfg.icon;
            const patientName = patients?.find((p) => p.id === d.patientId)?.name;
            return (
              <div key={d.id} className="bg-white rounded-2xl border p-5 card-hover" data-testid={`device-card-${d.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-6 h-6 ${cfg.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    <button
                      onClick={() => deleteDevice.mutate(
                        { id: d.id },
                        {
                          onSuccess: () => {
                            qc.invalidateQueries({ queryKey: getListDevicesQueryKey() });
                            toast({ title: "Device deleted" });
                          },
                          onError: () => toast({ title: "Failed to delete device", variant: "destructive" }),
                        }
                      )}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                      data-testid={`delete-device-${d.id}`}
                      title="Delete device"
                      aria-label={`Delete device ${d.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">{d.deviceCode}</div>
                {patientName && <div className="mt-2 text-xs text-primary font-medium">{patientName}</div>}
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.firmwareVersion ?? "Unknown firmware"}</span>
                  {d.lastSeenAt && <span>Last seen {new Date(d.lastSeenAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Cpu className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">No devices registered</p>
        </div>
      )}
    </AppLayout>
  );
}

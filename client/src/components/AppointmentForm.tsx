import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAppointmentSchema, updateAppointmentSchema, type Appointment, type User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { format } from "date-fns";

type AppointmentFormData = z.infer<typeof insertAppointmentSchema>;

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
}

export function AppointmentForm({ open, onOpenChange, appointment }: AppointmentFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const isEditing = !!appointment;

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(isEditing ? updateAppointmentSchema : insertAppointmentSchema),
    defaultValues: {
      appointmentDate: format(new Date(), "yyyy-MM-dd"),
      appointmentTime: "09:00",
      customer: "",
      customerPhone: "",
      customerEmail: "",
      assignedTo: "",
      serviceType: "Maintenance",
      notes: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (appointment) {
      form.reset({
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        customer: appointment.customer,
        customerPhone: appointment.customerPhone || "",
        customerEmail: appointment.customerEmail || "",
        assignedTo: appointment.assignedTo || "unassigned",
        serviceType: appointment.serviceType as any,
        notes: appointment.notes || "",
        status: appointment.status as any,
      });
    } else {
      form.reset({
        appointmentDate: format(new Date(), "yyyy-MM-dd"),
        appointmentTime: "09:00",
        customer: "",
        customerPhone: "",
        customerEmail: "",
        assignedTo: "unassigned",
        serviceType: "Maintenance",
        notes: "",
        status: "scheduled",
      });
    }
  }, [appointment, form]);

  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Convert "unassigned" to empty string for backend
      const payload = {
        ...data,
        assignedTo: data.assignedTo === "unassigned" ? "" : data.assignedTo,
      };
      const res = await apiRequest("POST", "/api/appointments", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: t("common_success"),
        description: t("notif_appointment_created"),
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common_error"),
        description: error.message || t("notif_error_generic"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Convert "unassigned" to empty string for backend
      const payload = {
        ...data,
        assignedTo: data.assignedTo === "unassigned" ? "" : data.assignedTo,
      };
      const res = await apiRequest("PATCH", `/api/appointments/${appointment!.id}`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: t("common_success"),
        description: t("notif_appointment_updated"),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common_error"),
        description: error.message || t("notif_error_generic"),
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEditing ? t("apt_form_title_edit") : t("apt_form_title_new")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("apt_form_subtitle_edit") : t("apt_form_subtitle_new")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("apt_form_customer_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("apt_form_customer_placeholder")} {...field} data-testid="input-customer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Calendar className="h-4 w-4 inline mr-2" />
                      {t("apt_form_date_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Clock className="h-4 w-4 inline mr-2" />
                      {t("apt_form_time_label")}
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apt_form_phone_label")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("apt_form_phone_placeholder")} {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apt_form_email_label")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("apt_form_email_placeholder")}
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apt_form_service_type_label")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Maintenance">{t("apt_form_service_maintenance")}</SelectItem>
                        <SelectItem value="Repair">{t("apt_form_service_repair")}</SelectItem>
                        <SelectItem value="Inspection">{t("apt_form_service_inspection")}</SelectItem>
                        <SelectItem value="Consultation">{t("apt_form_service_consultation")}</SelectItem>
                        <SelectItem value="Delivery">{t("apt_form_service_delivery")}</SelectItem>
                        <SelectItem value="Pickup">{t("apt_form_service_pickup")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("apt_form_assigned_label")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assigned-to">
                          <SelectValue placeholder={t("apt_form_assigned_placeholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">{t("wo_unassigned")}</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username} - {user.department || user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("apt_form_status_label")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">{t("apt_status_scheduled")}</SelectItem>
                          <SelectItem value="confirmed">{t("apt_status_confirmed")}</SelectItem>
                          <SelectItem value="in-progress">{t("apt_status_in_progress")}</SelectItem>
                          <SelectItem value="completed">{t("apt_status_completed")}</SelectItem>
                          <SelectItem value="cancelled">{t("apt_status_cancelled")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("apt_form_notes_label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("apt_form_notes_placeholder")}
                        className="min-h-24"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                {t("common_cancel")}
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending 
                  ? (isEditing ? t("apt_form_updating") : t("apt_form_creating")) 
                  : (isEditing ? t("apt_form_update_button") : t("apt_form_create_button"))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

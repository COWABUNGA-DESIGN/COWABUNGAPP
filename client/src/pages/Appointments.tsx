import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Phone, Mail, Trash2, Edit, Users } from "lucide-react";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment, User as UserType, Customer } from "@shared/schema";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Appointments() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: t("common_success"),
        description: t("notif_appointment_deleted"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common_error"),
        description: error.message || t("notif_error_generic"),
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customers", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCustomerFormOpen(false);
      form.reset();
      toast({
        title: "Customer created",
        description: "Customer has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common_error"),
        description: error.message || t("notif_error_generic"),
      });
    },
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("punch_delete_confirm"))) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingAppointment(null);
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return t("wo_unassigned");
    const user = users?.find((u) => u.id === userId);
    return user?.username || t("wo_unassigned");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "confirmed":
        return "bg-green-500";
      case "in-progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredAppointments = appointments?.filter((apt) => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.customerPhone && apt.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (apt.customerEmail && apt.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <div className="space-y-8 py-2">
      <div className="px-2 md:px-4 space-y-3">
        <h1 className="text-5xl font-bold gradient-text">{t("apt_title")}</h1>
        <p className="text-lg text-muted-foreground">{t("apt_subtitle")}</p>
      </div>
      <div className="flex items-center justify-between px-2 md:px-4">
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 px-2 md:px-4">
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6 px-2 md:px-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => setFormOpen(true)} data-testid="button-create-appointment">
              <Plus className="h-4 w-4 mr-2" />
              {t("apt_create_new")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("apt_search_placeholder")}
              className="max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-appointments"
            />

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
                data-testid="filter-all"
              >
                {t("apt_filter_all")}
              </Button>
              <Button
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                onClick={() => setStatusFilter("scheduled")}
                size="sm"
                data-testid="filter-scheduled"
              >
                {t("apt_filter_scheduled")}
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "default" : "outline"}
                onClick={() => setStatusFilter("confirmed")}
                size="sm"
                data-testid="filter-confirmed"
              >
                {t("apt_filter_confirmed")}
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
                size="sm"
                data-testid="filter-completed"
              >
                {t("apt_filter_completed")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">{t("common_loading")}</div>
          ) : filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">{t("apt_no_appointments")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} data-testid={`appointment-card-${appointment.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{appointment.customer}</CardTitle>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <Badge variant="outline">{appointment.serviceType}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span data-testid={`appointment-date-${appointment.id}`}>
                              {format(new Date(appointment.appointmentDate), "MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span data-testid={`appointment-time-${appointment.id}`}>
                              {appointment.appointmentTime}
                            </span>
                          </div>
                          {appointment.customerPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{appointment.customerPhone}</span>
                            </div>
                          )}
                          {appointment.customerEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{appointment.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{t("wo_assigned_to")}: {getUserName(appointment.assignedTo)}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(appointment)}
                          data-testid={`button-edit-${appointment.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(appointment.id)}
                          disabled={deleteAppointmentMutation.isPending}
                          data-testid={`button-delete-${appointment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Manage Customers</h3>
            <Button onClick={() => setCustomerFormOpen(true)} data-testid="button-create-customer">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>

          {customers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No customers yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Customer" to create your first customer
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {customers.map((customer) => (
                <Card key={customer.id} data-testid={`customer-card-${customer.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">{customer.name}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="text-sm">{customer.address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppointmentForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        appointment={editingAppointment}
      />

      <Dialog open={customerFormOpen} onOpenChange={setCustomerFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
            <DialogDescription>Add a new customer to your system</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createCustomerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-customer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} data-testid="input-customer-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="customer@example.com" type="email" {...field} data-testid="input-customer-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Province" {...field} data-testid="input-customer-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCustomerFormOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createCustomerMutation.isPending} data-testid="button-save-customer">
                  {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

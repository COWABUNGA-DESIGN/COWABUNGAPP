import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { UserPlus, Download } from "lucide-react";
import { useState } from "react";
import elevexLogoUrl from "@assets/giphy-downsized-medium_1763918974192.gif";

export default function CreateUser() {
  const { toast } = useToast();
  const { data: currentUser } = useAuth();
  const [generatedBadge, setGeneratedBadge] = useState<string | null>(null);
  const [badgeEmployeeId, setBadgeEmployeeId] = useState<string>("");

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      employeeId: "",
      password: "",
      email: "",
      department: "",
      occupation: "",
      headquarters: "",
      role: "technician",
    },
  });

  const { data: users } = useQuery<Array<{ id: string; username: string; role: string }>>({
    queryKey: ["/api/users"],
    enabled: currentUser?.role === "admin",
  });

  const generateEmployeeBadge = async (userData: InsertUser): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(0.5, '#a855f7');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White card background (use fillRect with no rounded corners for Safari compatibility)
      ctx.fillStyle = 'white';
      ctx.fillRect(40, 40, 720, 420);

      // Load and draw logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      
      const drawBadgeContent = () => {
        try {
          ctx.drawImage(logo, 60, 60, 120, 120);
        } catch (e) {
          // If logo fails to draw, continue without it
          console.warn('Failed to draw logo on badge:', e);
        }

        // Company name
        ctx.fillStyle = '#000';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillText('ELEVEX ERP', 200, 100);
        
        ctx.font = '20px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText('Employee Identification', 200, 130);

        // Divider line
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 200);
        ctx.lineTo(740, 200);
        ctx.stroke();

        // Employee details
        ctx.fillStyle = '#000';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(userData.username.toUpperCase(), 60, 250);

        ctx.font = '20px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`ID: ${userData.employeeId}`, 60, 290);
        ctx.fillText(`Role: ${userData.role.replace('_', ' ').toUpperCase()}`, 60, 320);
        
        if (userData.department) {
          ctx.fillText(`Department: ${userData.department}`, 60, 350);
        }
        if (userData.headquarters) {
          ctx.fillText(`Location: ${userData.headquarters}`, 60, 380);
        }
        if (userData.occupation) {
          ctx.fillText(`Position: ${userData.occupation}`, 60, 410);
        }

        // QR code placeholder or additional branding
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(600, 240, 120, 120);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('QR CODE', 620, 305);

        resolve(canvas.toDataURL('image/png'));
      };
      
      logo.onload = drawBadgeContent;
      logo.onerror = () => {
        console.warn('Logo failed to load, generating badge without logo');
        drawBadgeContent();
      };
      
      logo.src = elevexLogoUrl;
      
      // Timeout fallback
      setTimeout(() => {
        if (!logo.complete) {
          drawBadgeContent();
        }
      }, 3000);
    });
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Capture employee ID before reset
      setBadgeEmployeeId(variables.employeeId);
      
      // Generate employee badge
      const badgeDataUrl = await generateEmployeeBadge(variables);
      setGeneratedBadge(badgeDataUrl);
      
      toast({
        title: "Success",
        description: "User created successfully with employee badge",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    setGeneratedBadge(null);
    createUserMutation.mutate(data);
  };

  const downloadBadge = () => {
    if (!generatedBadge) return;
    const link = document.createElement('a');
    link.download = `employee-badge-${badgeEmployeeId}.png`;
    link.href = generatedBadge;
    link.click();
  };

  if (currentUser?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create and manage user accounts
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              Add a new user to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-employee-id"
                          placeholder="EMP001"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-new-username"
                          placeholder="Enter username"
                          {...field}
                        />
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
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-email"
                          type="email"
                          placeholder="user@elevex.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-new-password"
                          type="password"
                          placeholder="Enter password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technician">Technician</SelectItem>
                          <SelectItem value="technical_advisor">Technical Advisor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select département" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="Road Technician">Road Technician</SelectItem>
                          <SelectItem value="Garage Technician">Garage Technician</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Tech Advisor">Tech Advisor</SelectItem>
                          <SelectItem value="Accounting">Accounting</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-occupation"
                          placeholder="e.g., Service Technician, Parts Manager"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headquarters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headquarters (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-headquarters">
                            <SelectValue placeholder="Select headquarters" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="Montreal, QC">Montreal, QC</SelectItem>
                          <SelectItem value="Quebec, QC">Quebec, QC</SelectItem>
                          <SelectItem value="Saguenay, QC">Saguenay, QC</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-create-user"
                  type="submit"
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {generatedBadge ? (
          <Card>
            <CardHeader>
              <CardTitle>Employee Badge Generated</CardTitle>
              <CardDescription>
                Download the employee identification badge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={generatedBadge}
                  alt="Employee Badge"
                  className="w-full"
                  data-testid="img-employee-badge"
                />
              </div>
              <Button
                onClick={downloadBadge}
                className="w-full"
                data-testid="button-download-badge"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Badge
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Existing Users</CardTitle>
              <CardDescription>
                List of all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      data-testid={`user-item-${user.username}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate"
                    >
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Loading users...
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

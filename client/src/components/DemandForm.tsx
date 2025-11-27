import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image as ImageIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import hexBg from "@assets/IMG_6738_1763322726659.jpeg";

const demandSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["Normal", "High", "Urgent"]),
  department: z.enum([
    "Road Technician",
    "Garage Technician",
    "Sales",
    "Tech Advisor",
    "Accounting",
    "HR",
  ]),
  headquarters: z.enum(["Montreal, QC", "Quebec, QC", "Saguenay, QC"]),
  customer: z.string().min(1, "Customer is required"),
  siteAddress: z.string().min(1, "Site address is required"),
  asset: z.string().min(1, "Asset is required"),
  problemSummary: z.string().min(1, "Problem summary is required"),
  demandedBy: z.string().min(1, "Please select a technical advisor"),
  photos: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof demandSchema>;

interface DemandFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isEmbedded?: boolean;
}

interface FormContentProps {
  form: any;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadedPhotos: string[];
  advisors: Array<{ id: string; username: string; email?: string }> | undefined;
  isLoadingAdvisors: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  openAdvisorSelect: boolean;
  setOpenAdvisorSelect: (open: boolean) => void;
}

const FormContent = ({
  form,
  isSubmitting,
  isUploading,
  uploadedPhotos,
  advisors,
  isLoadingAdvisors,
  handleFileSelect,
  removePhoto,
  openAdvisorSelect,
  setOpenAdvisorSelect,
}: FormContentProps) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Short issue title" {...field} data-testid="input-demand-title" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priority</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-demand-priority">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
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
            <FormLabel>Department</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-demand-department">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
        name="headquarters"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Headquarters</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-demand-headquarters">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Montreal, QC">Montreal, QC</SelectItem>
                <SelectItem value="Quebec, QC">Quebec, QC</SelectItem>
                <SelectItem value="Saguenay, QC">Saguenay, QC</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="customer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer / Company</FormLabel>
            <FormControl>
              <Input placeholder="Company name" {...field} data-testid="input-demand-customer" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="siteAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Site Address</FormLabel>
            <FormControl>
              <Input placeholder="Address" {...field} data-testid="input-demand-address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="asset"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Asset</FormLabel>
            <FormControl>
              <Input placeholder="Equipment/Asset" {...field} data-testid="input-demand-asset" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="demandedBy"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Send to Technical Advisor</FormLabel>
            <Popover open={openAdvisorSelect} onOpenChange={setOpenAdvisorSelect}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAdvisorSelect}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                    data-testid="select-demand-advisor"
                  >
                    {field.value
                      ? advisors?.find((advisor) => advisor.id === field.value)?.username
                      : "Select a technical advisor"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search advisors..." data-testid="input-search-advisors" />
                  <CommandList>
                    {isLoadingAdvisors ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading advisors...</div>
                    ) : advisors && advisors.length > 0 ? (
                      <CommandGroup>
                        {advisors.map((advisor: { id: string; username: string; email?: string }) => (
                          <CommandItem
                            key={advisor.id}
                            value={advisor.username}
                            onSelect={() => {
                              form.setValue("demandedBy", advisor.id);
                              setOpenAdvisorSelect(false);
                            }}
                            data-testid={`advisor-option-${advisor.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                advisor.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {advisor.username}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>No advisor found.</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="problemSummary"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Problem Summary</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="What's wrong? Visible symptoms, codes, hazards, access notes..." 
                className="min-h-24"
                {...field} 
                data-testid="input-demand-problem-summary"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Photos (Optional)</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Attach photos to help identify the problem
        </p>
        
        <div className="space-y-3">
          {uploadedPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {uploadedPhotos.map((photo: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md border"
                    data-testid={`photo-preview-${index}`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                    data-testid={`button-remove-photo-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div>
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <label htmlFor="photo-upload">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() => document.getElementById('photo-upload')?.click()}
                data-testid="button-upload-photos"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Photos
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>
      </div>
    </div>
  </>
);

export function DemandForm({ open = false, onOpenChange, isEmbedded = false }: DemandFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [openAdvisorSelect, setOpenAdvisorSelect] = useState(false);

  const { data: advisors, isLoading: isLoadingAdvisors } = useQuery<Array<{id: string; username: string; email?: string}>>({
    queryKey: ["/api/users/technical-advisors"],
    enabled: isEmbedded || open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: "",
      priority: "Normal",
      department: "Road Technician",
      headquarters: "Montreal, QC",
      customer: "",
      siteAddress: "",
      asset: "",
      problemSummary: "",
      demandedBy: "",
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const data = await response.json();
        newPhotos.push(data.filePath);
      }

      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
      toast({
        title: "Photos uploaded",
        description: `${newPhotos.length} photo(s) added successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload photos",
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/work-orders/demands", {
        ...data,
        advisorId: data.demandedBy,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      });

      toast({
        title: "Work order demand created",
        description: "Your demand has been sent to the technical advisor for review.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/stats"] });
      form.reset();
      setUploadedPhotos([]);
      if (onOpenChange) onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create work order demand",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmbedded) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormContent
            form={form}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            uploadedPhotos={uploadedPhotos}
            advisors={advisors}
            isLoadingAdvisors={isLoadingAdvisors}
            handleFileSelect={handleFileSelect}
            removePhoto={removePhoto}
            openAdvisorSelect={openAdvisorSelect}
            setOpenAdvisorSelect={setOpenAdvisorSelect}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            data-testid="button-submit-demand"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Demand
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: `url(${hexBg})`, backgroundSize: 'cover' }}
        />
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Request Work Order
          </DialogTitle>
          <DialogDescription>
            Describe the service issue and attach photos. A technical advisor will review your request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <FormContent
              form={form}
              isSubmitting={isSubmitting}
              isUploading={isUploading}
              uploadedPhotos={uploadedPhotos}
              advisors={advisors}
              isLoadingAdvisors={isLoadingAdvisors}
              handleFileSelect={handleFileSelect}
              removePhoto={removePhoto}
              openAdvisorSelect={openAdvisorSelect}
              setOpenAdvisorSelect={setOpenAdvisorSelect}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange?.(false);
                  form.reset();
                  setUploadedPhotos([]);
                }}
                disabled={isSubmitting || isUploading}
                data-testid="button-demand-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600"
                data-testid="button-demand-submit"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

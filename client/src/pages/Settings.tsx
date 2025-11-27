import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

type FullUser = {
  id: string;
  username: string;
  role: string;
  email?: string | null;
  department?: string | null;
  headquarters?: string | null;
  profilePicture?: string | null;
  bannerImage?: string | null;
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Check, UserPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

const DEFAULT_AVATARS = [
  { id: "elevex-logo", path: "/attached_assets/default-avatars/elevex-logo.jpeg", name: "ELEVEX Logo" },
];

export default function Settings() {
  const { data: authUser } = useAuth();
  const { data: user } = useQuery<FullUser>({
    queryKey: ["/api/user"],
    enabled: !!authUser,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const response = await fetch("/api/users/profile-picture", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload profile picture");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("profilePictureUpdated"),
        description: t("profilePictureUpdatedDescription"),
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDefaultAvatarMutation = useMutation({
    mutationFn: async (avatarPath: string) => {
      return apiRequest("PATCH", "/api/users/profile-picture/default", {
        profilePicture: avatarPath,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("profilePictureUpdated"),
        description: t("defaultAvatarSet"),
      });
      setSelectedDefaultAvatar(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast({
        title: t("error"),
        description: t("fileSizeTooLarge"),
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error"),
        description: t("onlyImagesAllowed"),
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleSelectDefaultAvatar = (avatarPath: string) => {
    setSelectedDefaultAvatar(avatarPath);
    setDefaultAvatarMutation.mutate(avatarPath);
  };

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const uploadResponse = await fetch("/api/upload/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload banner image");
      }
      const { filePath } = await uploadResponse.json();
      
      return apiRequest("PATCH", "/api/users/me/profile", {
        bannerImage: filePath,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Banner Updated",
        description: "Your banner image has been updated successfully",
      });
      setSelectedBannerFile(null);
      setBannerPreviewUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size too large (max 5MB for banners)",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }

    setSelectedBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = () => {
    if (selectedBannerFile) {
      uploadBannerMutation.mutate(selectedBannerFile);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("settings")}</h1>
          {user.role === "admin" && (
            <Link href="/admin/create-user">
              <Button variant="outline" data-testid="button-create-user-nav">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </Link>
          )}
        </div>

        <Card data-testid="card-profile-picture">
          <CardHeader>
            <CardTitle>{t("profilePicture")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24" data-testid="img-current-avatar">
                <AvatarImage src={user.profilePicture || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t("currentProfilePicture")}</p>
                <p className="font-medium" data-testid="text-username">{user.username}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-picture-upload">{t("uploadNewPicture")}</Label>
              <div className="flex gap-2">
                <Input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                  data-testid="input-profile-picture"
                />
                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    data-testid="button-upload-picture"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadMutation.isPending ? t("uploading") : t("upload")}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("maxFileSize1MB")}</p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>{t("preview")}</Label>
                <Avatar className="h-24 w-24" data-testid="img-preview-avatar">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("orChooseDefaultAvatar")}</Label>
              <div className="grid grid-cols-4 gap-4">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectDefaultAvatar(avatar.path)}
                    className={`relative hover-elevate active-elevate-2 rounded-lg p-2 border-2 ${
                      selectedDefaultAvatar === avatar.path
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    disabled={setDefaultAvatarMutation.isPending}
                    data-testid={`button-avatar-${avatar.id}`}
                  >
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={avatar.path} alt={avatar.name} />
                      <AvatarFallback>{avatar.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.profilePicture === avatar.path && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-banner-image">
          <CardHeader>
            <CardTitle>Banner Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.bannerImage && (
              <div className="w-full h-32 rounded-lg overflow-hidden border">
                <img 
                  src={user.bannerImage} 
                  alt="Current banner" 
                  className="w-full h-full object-cover"
                  data-testid="img-current-banner"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="banner-upload">Upload New Banner</Label>
              <div className="flex gap-2">
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="flex-1"
                  data-testid="input-banner-image"
                />
                {selectedBannerFile && (
                  <Button
                    onClick={handleBannerUpload}
                    disabled={uploadBannerMutation.isPending}
                    data-testid="button-upload-banner"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {uploadBannerMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Max file size: 5MB. Recommended size: 1200x300 pixels</p>
            </div>

            {bannerPreviewUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="w-full h-32 rounded-lg overflow-hidden border">
                  <img 
                    src={bannerPreviewUrl} 
                    alt="Banner preview" 
                    className="w-full h-full object-cover"
                    data-testid="img-preview-banner"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-account-info">
          <CardHeader>
            <CardTitle>{t("accountInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground">{t("username")}</Label>
                <p className="font-medium" data-testid="text-account-username">{user.username}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("role")}</Label>
                <p className="font-medium" data-testid="text-account-role">{user.role}</p>
              </div>
              {user.email && (
                <div>
                  <Label className="text-muted-foreground">{t("email")}</Label>
                  <p className="font-medium" data-testid="text-account-email">{user.email}</p>
                </div>
              )}
              {user.department && (
                <div>
                  <Label className="text-muted-foreground">{t("department")}</Label>
                  <p className="font-medium" data-testid="text-account-department">{user.department}</p>
                </div>
              )}
              {user.headquarters && (
                <div>
                  <Label className="text-muted-foreground">{t("headquarters")}</Label>
                  <p className="font-medium" data-testid="text-account-headquarters">{user.headquarters}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

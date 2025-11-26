import { useState } from "react";
import { Upload, Image, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTemplateCategories, useTemplates, useAdminTemplates, useRanks } from "@/hooks/useTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/AdminGuard";

export default function AdminTemplates() {
  const { categories } = useTemplateCategories();
  const { ranks } = useRanks();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { templates } = useTemplates(selectedCategory);
  const { updateCategoryCover, updateTemplateCover, createTemplate } = useAdminTemplates();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    categoryId: undefined as string | undefined,
    rankId: undefined as string | undefined,
    description: "",
    file: null as File | null,
  });

  const handleCategoryCoverChange = async (categoryId: string, file: File) => {
    const { error } = await updateCategoryCover(categoryId, file);
    if (error) {
      toast.error("Failed to update category cover");
    } else {
      toast.success("Category cover updated successfully");
    }
  };

  const handleTemplateCoverChange = async (templateId: string, file: File) => {
    const { error } = await updateTemplateCover(templateId, file);
    if (error) {
      toast.error("Failed to update template cover");
    } else {
      toast.success("Template cover updated successfully");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleCreateTemplate = async () => {
    if (!uploadForm.name || !uploadForm.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await createTemplate({
      name: uploadForm.name,
      categoryId: uploadForm.categoryId,
      rankId: uploadForm.rankId,
      description: uploadForm.description || undefined,
      coverFile: uploadForm.file || undefined,
    });

    if (error) {
      toast.error("Failed to create template");
    } else {
      toast.success("Template created successfully");
      setIsUploadOpen(false);
      setUploadForm({
        name: "",
        categoryId: undefined,
        rankId: undefined,
        description: "",
        file: null,
      });
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Templates Management</h1>
              <p className="text-muted-foreground mt-1">Create and manage banner templates</p>
            </div>
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      placeholder="Enter template name"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={uploadForm.categoryId || undefined}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, categoryId: value })}
                    >
                      <SelectTrigger className="bg-background border-primary/20">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rank (Optional)</Label>
                    <Select
                      value={uploadForm.rankId || undefined}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, rankId: value })}
                    >
                      <SelectTrigger className="bg-background border-primary/20">
                        <SelectValue placeholder="Select rank (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {ranks.map((rank) => (
                          <SelectItem key={rank.id} value={rank.id}>
                            {rank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Enter description"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Cover Image</Label>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <Button onClick={handleCreateTemplate} className="w-full">
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs for Categories and Templates */}
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="gold-border bg-card rounded-xl p-4 space-y-3">
                    {category.cover_image_url && (
                      <img
                        src={category.cover_image_url}
                        alt={category.name}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <Input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCategoryCoverChange(category.id, file);
                          }}
                          accept="image/*"
                        />
                        <Button variant="outline" className="w-full" asChild>
                          <span className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            Update Cover
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="gold-border bg-card rounded-xl p-4 space-y-3">
                    <img
                      src={template.cover_thumbnail_url}
                      alt={template.name}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    {template.ranks && (
                      <p className="text-xs text-primary">Rank: {template.ranks.name}</p>
                    )}
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <Input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleTemplateCoverChange(template.id, file);
                          }}
                          accept="image/*"
                        />
                        <Button variant="outline" className="w-full" asChild>
                          <span className="flex items-center justify-center gap-2">
                            <Image className="w-4 h-4" />
                            Update
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

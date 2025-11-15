import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Image, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTemplateCategories, useTemplates, useAdminTemplates } from "@/hooks/useTemplates";

export default function AdminTemplates() {
  const navigate = useNavigate();
  const { categories } = useTemplateCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { templates } = useTemplates(selectedCategory);
  const { updateCategoryCover, updateTemplateCover, createTemplate } = useAdminTemplates();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    file: null as File | null,
  });

  const handleCategoryCoverChange = async (categoryId: string, file: File) => {
    const { error } = await updateCategoryCover(categoryId, file);

    if (error) {
      toast.error("Failed to update category cover");
      return;
    }

    toast.success("Category cover updated! All users will see the change instantly.");
  };

  const handleTemplateCoverChange = async (templateId: string, file: File) => {
    const { error } = await updateTemplateCover(templateId, file);

    if (error) {
      toast.error("Failed to update template cover");
      return;
    }

    toast.success("Template cover updated instantly!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleCreateTemplate = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await createTemplate(
      uploadForm.categoryId,
      uploadForm.name,
      uploadForm.file,
      uploadForm.description
    );

    if (error) {
      toast.error("Failed to create template");
      return;
    }

    toast.success("Template created successfully!");
    setIsUploadOpen(false);
    setUploadForm({ name: "", categoryId: "", description: "", file: null });
  };

  return (
    <div className="min-h-screen bg-navy-dark pb-6">
      <header className="sticky top-0 bg-navy-dark/95 backdrop-blur-sm z-40 px-6 py-4 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border-2 border-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <h1 className="text-xl font-bold text-primary">Template Management</h1>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Template Name *</Label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g., Diamond Rank Banner"
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Category *</Label>
                  <select
                    value={uploadForm.categoryId}
                    onChange={(e) => setUploadForm({ ...uploadForm, categoryId: e.target.value })}
                    className="w-full gold-border bg-secondary text-foreground rounded-lg px-3 py-2"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Cover Image *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="gold-border bg-secondary text-foreground"
                  />
                </div>

                <Button
                  onClick={handleCreateTemplate}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Category Covers Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary">
            Category Covers <span className="text-sm text-muted-foreground">(Backend Integrated)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="gold-border bg-card rounded-xl overflow-hidden">
                <div className="aspect-video relative bg-secondary">
                  {category.cover_image_url ? (
                    <img
                      src={category.cover_image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-semibold text-foreground flex-1">{category.name}</h3>
                  </div>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCategoryCoverChange(category.id, file);
                      }}
                      className="hidden"
                    />
                    <div className="w-full border-2 border-primary text-primary hover:bg-primary/10 rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      Change Cover
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary">Template Covers</h2>
          <Tabs defaultValue={categories[0]?.id} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              {categories.slice(0, 4).map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.icon}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates in this category. Create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="gold-border bg-card rounded-xl overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={template.cover_thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleTemplateCoverChange(template.id, file);
                        }}
                        className="hidden"
                      />
                      <div className="w-full border-2 border-primary text-primary hover:bg-primary/10 rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        Change Cover
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Upload, Image, Plus, Edit, Trash2, Eye, EyeOff, FileImage, Layers, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTemplateCategories, useTemplates, useAdminTemplates, useRanks } from "@/hooks/useTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import PremiumGlobalLoader from "@/components/PremiumGlobalLoader";
import { AdminGuard } from "@/components/AdminGuard";
import { Badge } from "@/components/ui/badge";

export default function AdminTemplates() {
  const { categories, loading: categoriesLoading } = useTemplateCategories();
  const { ranks } = useRanks();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { templates, loading: templatesLoading } = useTemplates(selectedCategory);
  const { updateCategoryCover, updateTemplateCover, createTemplate } = useAdminTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'categories' | 'templates'>('categories');
  const [refreshing, setRefreshing] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    categoryId: undefined as string | undefined,
    rankId: undefined as string | undefined,
    description: "",
    file: null as File | null,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger page reload for refresh since hooks don't expose refetch
    window.location.reload();
  };

  const handleCategoryCoverChange = async (categoryId: string, file: File) => {
    const { error } = await updateCategoryCover(categoryId, file);
    if (error) {
      toast.error("Failed to update category cover");
    } else {
      toast.success("Category cover updated");
      window.location.reload();
    }
  };

  const handleTemplateCoverChange = async (templateId: string, file: File) => {
    const { error } = await updateTemplateCover(templateId, file);
    if (error) {
      toast.error("Failed to update template cover");
    } else {
      toast.success("Template cover updated");
      window.location.reload();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleCreateTemplate = async () => {
    if (!uploadForm.name || !uploadForm.categoryId || !uploadForm.file) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await createTemplate(
      uploadForm.categoryId,
      uploadForm.name,
      uploadForm.file,
      uploadForm.description || undefined,
      uploadForm.rankId
    );

    if (error) {
      toast.error("Failed to create template");
    } else {
      toast.success("Template created");
      setIsUploadOpen(false);
      setUploadForm({ name: "", categoryId: undefined, rankId: undefined, description: "", file: null });
      window.location.reload();
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(tmpl =>
    tmpl.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategories = categories.filter(c => c.is_active !== false).length;

  if (categoriesLoading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <PremiumGlobalLoader size="lg" message="Loading templates..." fullScreen={false} />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <AdminHeader 
          title="Templates" 
          subtitle={`${categories.length} categories`} 
          onRefresh={handleRefresh} 
          isRefreshing={refreshing} 
        />
        
        <div className="p-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <AdminStatsCard 
              icon={<Layers className="w-5 h-5" />} 
              value={categories.length} 
              label="Categories" 
            />
            <AdminStatsCard 
              icon={<FileImage className="w-5 h-5" />} 
              value={templates.length} 
              label="Templates" 
              iconColor="text-green-500"
            />
            <AdminStatsCard 
              icon={<Eye className="w-5 h-5" />} 
              value={activeCategories} 
              label="Active" 
              iconColor="text-blue-500"
            />
            <AdminStatsCard 
              icon={<Plus className="w-5 h-5" />} 
              value={ranks.length} 
              label="Ranks" 
              iconColor="text-purple-500"
            />
          </div>

          {/* Tab Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'categories' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-card border border-primary/20 text-muted-foreground'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'templates' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-card border border-primary/20 text-muted-foreground'
              }`}
            >
              Templates
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pl-10 bg-card border-primary/20" 
            />
          </div>

          {/* Create Template Button */}
          {activeTab === 'templates' && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-primary/20 max-w-sm">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Template Name *</Label>
                    <Input
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      placeholder="Enter template name"
                      className="bg-background border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={uploadForm.categoryId || undefined}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, categoryId: value })}
                    >
                      <SelectTrigger className="bg-background border-primary/20">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {ranks.map((rank) => (
                          <SelectItem key={rank.id} value={rank.id}>{rank.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image *</Label>
                    <Input type="file" onChange={handleFileChange} accept="image/*" className="bg-background border-primary/20" />
                  </div>
                  <Button onClick={handleCreateTemplate} className="w-full">Create Template</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Categories List */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 gap-3">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-card border border-primary/20 rounded-xl p-3 hover:border-primary/40 transition-all">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {category.cover_image_url ? (
                        <img src={category.cover_image_url} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">{category.icon}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{category.name}</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                          {category.slug}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                    </div>
                    <label className="flex-shrink-0">
                      <Input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCategoryCoverChange(category.id, file);
                        }}
                        accept="image/*"
                      />
                      <Button variant="outline" size="sm" className="border-primary/30" asChild>
                        <span><Upload className="w-4 h-4" /></span>
                      </Button>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Templates List */}
          {activeTab === 'templates' && (
            <>
              <Select value={selectedCategory || undefined} onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}>
                <SelectTrigger className="bg-card border-primary/20">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 gap-3">
                {templatesLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No templates found</div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-card border border-primary/20 rounded-xl p-3 hover:border-primary/40 transition-all">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <img src={template.cover_thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate mb-1">{template.name}</h3>
                          {template.ranks && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-sm">{template.ranks.icon}</span>
                              <span className="text-xs text-primary">{template.ranks.name}</span>
                            </div>
                          )}
                          {template.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                          )}
                        </div>
                        <label className="flex-shrink-0">
                          <Input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleTemplateCoverChange(template.id, file);
                            }}
                            accept="image/*"
                          />
                          <Button variant="outline" size="sm" className="border-primary/30" asChild>
                            <span><Image className="w-4 h-4" /></span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

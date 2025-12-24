import { useState, useEffect } from 'react';
import { ArrowLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import RankCategoryStickerGrid from '@/components/admin/RankCategoryStickerGrid';

interface Rank {
  id: string;
  name: string;
  color: string;
  gradient: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order?: number;
}

const AdminRankStickers = () => {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedRank, setSelectedRank] = useState<string>();
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load ranks on mount
  useEffect(() => {
    const loadRanks = async () => {
      setLoadingRanks(true);
      const { data } = await supabase
        .from('ranks')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setRanks(data);
      setLoadingRanks(false);
    };
    loadRanks();
  }, []);

  // Load template categories (dashboard categories)
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      const { data } = await supabase
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) setCategories(data);
      setLoadingCategories(false);
    };
    loadCategories();
  }, []);

  const handleRankChange = (rankId: string) => {
    setSelectedRank(rankId);
  };

  const selectedRankData = ranks.find(r => r.id === selectedRank);

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Rank Stickers Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and manage stickers for each rank across all dashboard categories
            </p>
          </div>
        </div>

        {/* Rank Selection */}
        <Card className="p-4 md:p-6 mb-6">
          <Label className="text-base font-semibold mb-3 block">Select Rank</Label>
          {loadingRanks ? (
            <div className="h-10 bg-muted animate-pulse rounded-md w-full max-w-md" />
          ) : (
            <Select value={selectedRank} onValueChange={handleRankChange}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a rank to manage stickers..." />
              </SelectTrigger>
              <SelectContent>
                {ranks.map((rank) => (
                  <SelectItem key={rank.id} value={rank.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ background: rank.gradient }} />
                      {rank.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Card>

        {/* Selected Rank Context Badge */}
        {selectedRankData && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 flex-wrap">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: selectedRankData.gradient }}
              >
                {selectedRankData.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Managing stickers for</p>
                <h2 className="text-lg font-bold text-foreground">{selectedRankData.name}</h2>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Layers className="h-3 w-3 mr-1" />
                {categories.length} Categories
              </Badge>
            </div>
          </Card>
        )}

        {/* Categories Grid - All dashboard categories */}
        {selectedRank ? (
          loadingCategories ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Dashboard Categories ({categories.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Click to expand and manage stickers
                </p>
              </div>
              {categories.map((category, index) => (
                <RankCategoryStickerGrid
                  key={category.id}
                  rankId={selectedRank}
                  rankName={selectedRankData?.name || 'Unknown'}
                  category={category}
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No categories found. Add categories from the dashboard.</p>
            </Card>
          )
        ) : (
          <Card className="p-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Rank to Begin</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose a rank from the dropdown above to manage stickers across all dashboard categories.
              Each rank can have unique stickers for every category.
            </p>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRankStickers;

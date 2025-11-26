import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export default function MyDownloads() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    fetchUser();
  }, []);

  const { data: downloads, isLoading } = useDownloadHistory(userId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading downloads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">My Downloads</h1>
              <p className="text-sm text-muted-foreground">
                {downloads?.length || 0} banners downloaded
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads List */}
      <div className="container mx-auto px-4 py-6">
        {!downloads || downloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Downloads Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start creating banners and download them to build your collection
            </p>
            <Button onClick={() => navigate("/dashboard")} className="bg-primary">
              Browse Templates
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {downloads.map((download) => (
              <Card
                key={download.id}
                className="p-4 bg-card border-border/40 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Category Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="w-6 h-6 text-primary" />
                  </div>

                  {/* Download Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">
                      {download.category_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(download.downloaded_at), "MMM dd, yyyy 'at' hh:mm a")}
                      </span>
                    </div>
                  </div>

                  {/* Re-download Button */}
                  {download.banner_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:bg-primary/10"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = download.banner_url!;
                        link.download = `${download.category_name}-banner.png`;
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Re-download
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

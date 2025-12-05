import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import { Button } from "@/components/ui/button";
import { formatToIST } from "@/lib/dateUtils";

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
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-screen-md mx-auto px-4 py-4">
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
      <div className="max-w-screen-md mx-auto px-4 py-6">
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
          <div className="space-y-0">
            {downloads.map((download, index) => (
              <div key={download.id}>
                <div className="flex items-start gap-4 py-5">
                  {/* Download Icon - Circular Red Background */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-destructive" />
                  </div>

                  {/* Download Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base mb-1">
                      Banner download - {download.category_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {formatToIST(download.downloaded_at)}
                    </p>
                  </div>

                  {/* Amount - Red Color */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-destructive font-semibold text-lg">
                      - ₹10
                    </span>
                  </div>
                </div>
                
                {/* Separator Line - except for last item */}
                {index < downloads.length - 1 && (
                  <div className="h-px bg-border/40" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

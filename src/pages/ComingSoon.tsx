import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center px-6">
      <div className="gold-border bg-card p-8 rounded-3xl max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Coming Soon</h1>
          <p className="text-muted-foreground">
            This page will be available soon. We're working hard to bring you amazing features!
          </p>
        </div>

        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useBirthdays } from "@/hooks/useBirthdays";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import ListPageSkeleton from "@/components/skeletons/ListPageSkeleton";

const BirthdaysSelection = () => {
  const navigate = useNavigate();
  const { birthdays, loading } = useBirthdays();

  // Only show skeleton on initial load with no cached data
  if (loading && birthdays.length === 0) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Birthday Celebrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a birthday theme</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {birthdays.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No birthday themes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {birthdays.map((birthday) => (
              <Card
                key={birthday.id}
                className="group cursor-pointer overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                onClick={() => navigate(`/banner-create/birthday?birthdayId=${birthday.id}`)}
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                  <img
                    src={birthday.Birthday_image_url}
                    alt={birthday.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                      {birthday.title}
                    </h3>
                    {birthday.short_title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {birthday.short_title}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BirthdaysSelection;

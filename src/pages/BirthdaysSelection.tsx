import { useNavigate } from "react-router-dom";
import { useBirthdays } from "@/hooks/useBirthdays";
import SelectionCard from "@/components/dashboard/SelectionCard";
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
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Birthday Celebrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a birthday theme</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {birthdays.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎂</span>
            </div>
            <p className="text-muted-foreground">No birthday themes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {birthdays.map((birthday) => (
              <SelectionCard
                key={birthday.id}
                id={birthday.id}
                title={birthday.title}
                subtitle={birthday.short_title || undefined}
                imageUrl={birthday.Birthday_image_url}
                fallbackIcon="🎂"
                fallbackGradient="bg-gradient-to-br from-pink-600 to-purple-600"
                onClick={() => navigate(`/banner-create/birthday?birthdayId=${birthday.id}`)}
                aspectRatio="4/3"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BirthdaysSelection;

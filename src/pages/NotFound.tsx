import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Book } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-literary">
      <Card className="text-center p-8 story-shadow animate-fade-in">
        <div className="mb-6">
          <Book className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="story-title text-4xl font-bold text-primary mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-4">
            This page doesn't exist in our story
          </p>
          <p className="text-muted-foreground mb-6">
            The chapter you're looking for seems to have been lost to time.
          </p>
        </div>
        <Button asChild className="story-link">
          <a href="/">Return to the Story</a>
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;

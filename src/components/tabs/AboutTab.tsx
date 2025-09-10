import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export const AboutTab = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Info className="h-8 w-8" />
              About the Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed">
                This website is designed to provide entertainment and engagement through creative content. Our mission is to bring fun, knowledge, and interactive experiences to our visitors. We are constantly improving to give our users more features and a smooth experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
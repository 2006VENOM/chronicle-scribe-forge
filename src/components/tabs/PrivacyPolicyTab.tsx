import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const PrivacyPolicyTab = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Shield className="h-8 w-8" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed">
                We value your privacy. We use cookies to personalize content and ads, provide social media features, and analyze traffic. By using this site, you agree to our Privacy Policy. We may collect basic analytics such as pages visited and time spent on the site to improve user experience. Third-party advertisers may also place cookies to serve relevant ads.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
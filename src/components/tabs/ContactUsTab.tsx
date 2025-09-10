import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Phone } from "lucide-react";

export const ContactUsTab = () => {
  const handleEmailClick = () => {
    window.location.href = 'mailto:theevenom6@gmail.com';
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/2349162635238', '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Phone className="h-8 w-8" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Email Contact */}
              <Card className="border border-border/50">
                <CardContent className="p-6 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground mb-4">Send us a message</p>
                  <Button onClick={handleEmailClick} className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    theevenom6@gmail.com
                  </Button>
                </CardContent>
              </Card>

              {/* WhatsApp Contact */}
              <Card className="border border-border/50">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-semibold mb-2">WhatsApp</h3>
                  <p className="text-muted-foreground mb-4">Chat with us directly</p>
                  <Button onClick={handleWhatsAppClick} className="w-full bg-green-600 hover:bg-green-700">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    +2349162635238
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-muted-foreground">
              <p>We'd love to hear from you! Feel free to reach out through any of these channels.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
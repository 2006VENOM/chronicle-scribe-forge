import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email?: string;
}

interface LoginTabProps {
  onLogin: (user: User) => void;
}

export const LoginTab = ({ onLogin }: LoginTabProps) => {
  const [step, setStep] = useState<'email' | 'verify' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        onLogin({ id: session.user.id, email: session.user.email });
      }
    };
    checkUser();
  }, [onLogin]);

  const handleSendVerification = async () => {
    if (!email.endsWith('@gmail.com')) {
      toast({
        title: "Gmail Required",
        description: "Please enter a Gmail address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "Verification Sent",
        description: "Check your Gmail for the verification code"
      });
      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has a username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.username) {
          onLogin({ id: data.user.id, email: data.user.email });
        } else {
          setStep('username');
        }
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found");
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          username: username.trim(),
          email: email 
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Account Created",
        description: "Welcome! Your account has been set up."
      });
      
      onLogin({ id: user.id, email: user.email });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {step === 'email' && 'Sign In with Gmail'}
              {step === 'verify' && 'Verify Your Email'}
              {step === 'username' && 'Choose Username'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'email' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gmail Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your-email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSendVerification}
                  disabled={isLoading || !email}
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Send Verification Code"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="text-center text-sm text-muted-foreground mb-4">
                  We sent a verification code to {email}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('email')}
                  className="w-full"
                >
                  Back
                </Button>
              </>
            )}

            {step === 'username' && (
              <>
                <div className="text-center text-sm text-muted-foreground mb-4">
                  Choose a username for your account
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateAccount}
                  disabled={isLoading || !username.trim()}
                  className="w-full"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
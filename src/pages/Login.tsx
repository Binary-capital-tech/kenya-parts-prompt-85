import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle2, X, Loader2 } from "lucide-react";

const Login = () => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', type: 'success' });

  // Supabase configuration
  const SUPABASE_URL = 'https://tlgjxxsscuyrauopinoz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0';

  const toast = (title, description, type = 'success') => {
    setToastMessage({ title, description, type });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSkipLogin = () => {
    toast("Continuing as Guest", "You can shop without logging in");
    setTimeout(() => window.location.href = "/", 1500);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast("Invalid Email", "Please enter a valid email address", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send-code', email })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to send code');

      toast("Code Sent!", `Check your email at ${email}`);
      setStep('code');
    } catch (error) {
      toast("Error", error.message || "Failed to send code. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast("Invalid Code", "Please enter the 6-digit code", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'verify-code', email, code })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Invalid code');

      if (data.success) {
        setStep('success');
        toast("Login Successful!", "Welcome to AutoParts");
        
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (error) {
      toast("Invalid Code", error.message || "The code you entered is incorrect", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send-code', email })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to resend code');
      
      toast("Code Resent", "A new code has been sent to your email");
    } catch (error) {
      toast("Error", error.message || "Failed to resend code", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardContent className="pt-12 pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Welcome Back!
            </h2>
            <p className="text-slate-600 mb-6">You're successfully logged in</p>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {showToast && (
        <div className={`fixed top-4 right-4 ${toastMessage.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-white'} border rounded-lg shadow-lg p-4 max-w-sm z-50 animate-in slide-in-from-top`}>
          <h3 className={`font-semibold ${toastMessage.type === 'error' ? 'text-red-900' : 'text-slate-900'}`}>
            {toastMessage.title}
          </h3>
          <p className={`text-sm ${toastMessage.type === 'error' ? 'text-red-700' : 'text-slate-600'}`}>
            {toastMessage.description}
          </p>
        </div>
      )}
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            AutoParts
          </h1>
          <p className="text-slate-600">Quality auto parts, delivered fast</p>
        </div>

        <Card className="shadow-2xl border-0 backdrop-blur-xl bg-white/80">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {step === 'email' ? 'Sign In' : 'Verify Email'}
              </CardTitle>
              {step === 'code' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep('email')}
                  className="h-8 w-8 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription className="text-slate-600">
              {step === 'email' 
                ? 'Enter your email to receive a login code' 
                : `We sent a 6-digit code to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'email' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendCode}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium btn-premium disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Code...
                    </div>
                  ) : (
                    'Send Login Code'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 border-slate-200 hover:bg-slate-50 font-medium"
                  onClick={handleSkipLogin}
                >
                  Continue without Login
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-700 font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest h-14 font-mono border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleVerifyCode}
                  className="w-full h-12 btn-premium disabled:opacity-50 hover:bg-slate-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors disabled:opacity-50 font-medium"
                  >
                    Didn't receive a code? Resend
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                By continuing, you agree to AutoParts' Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
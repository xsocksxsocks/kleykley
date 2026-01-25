import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import logoImage from '@/assets/logo-kley.png';
import { EU_COUNTRIES } from '@/lib/countries';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

const signupSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  fullName: z.string()
    .min(2, 'Vor- und Nachname muss mindestens 2 Zeichen haben')
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Bitte geben Sie Vor- und Nachname ein (z.B. Max Mustermann)',
    }),
  companyName: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen haben'),
  phone: z.string().min(5, 'Bitte geben Sie eine gültige Telefonnummer ein'),
  address: z.string().min(5, 'Bitte geben Sie eine gültige Adresse ein'),
  postalCode: z.string().min(4, 'Bitte geben Sie eine gültige PLZ ein'),
  city: z.string().min(2, 'Bitte geben Sie eine gültige Stadt ein'),
  country: z.string().min(1, 'Bitte wählen Sie ein Land'),
});

const resetEmailSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

const Auth: React.FC = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'Deutschland',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Password reset state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetEmailError('');
    
    try {
      resetEmailSchema.parse({ email: resetEmail });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setResetEmailError(error.errors[0]?.message || 'Ungültige E-Mail');
        return;
      }
    }

    setIsResetting(true);
    
    try {
      // Use custom Edge Function for password reset email
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: resetEmail,
          redirectUrl: `${window.location.origin}/portal/reset-password`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setResetEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Fehler',
        description: 'Es konnte keine E-Mail gesendet werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setResetEmail('');
    setResetEmailError('');
    setResetEmailSent(false);
  };

  useEffect(() => {
    if (user && !loading) {
      navigate('/portal');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse(loginData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast({
          title: 'Anmeldung fehlgeschlagen',
          description: 'E-Mail oder Passwort ist falsch.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Willkommen zurück!',
        description: 'Sie sind jetzt angemeldet.',
      });
      navigate('/portal');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      signupSchema.parse(signupData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      signupData.companyName,
      signupData.phone,
      signupData.address,
      signupData.city,
      signupData.postalCode,
      signupData.country
    );
    setIsLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast({
          title: 'Konto existiert bereits',
          description: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fehler',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Registrierung erfolgreich!',
        description: 'Ihr Konto wird geprüft. Sie werden benachrichtigt, sobald es freigeschaltet ist.',
      });
      navigate('/portal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <img src={logoImage} alt="Kley" className="h-12 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Kundenportal</CardTitle>
          <CardDescription>
            Melden Sie sich an oder erstellen Sie ein Konto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="signup">Registrieren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="ihre@email.de"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
                <div className="text-center mt-4">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setResetEmail(loginData.email);
                      setResetDialogOpen(true);
                    }}
                  >
                    Passwort vergessen?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Vor- und Nachname *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Max Mustermann"
                      disabled={isLoading}
                    />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Firmenname *</Label>
                    <Input
                      id="signup-company"
                      type="text"
                      value={signupData.companyName}
                      onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                      placeholder="Musterfirma GmbH"
                      disabled={isLoading}
                    />
                    {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="ihre@email.de"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefonnummer *</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    placeholder="+49 123 456789"
                    disabled={isLoading}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Firmen- und Lieferadresse</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Straße und Hausnummer *</Label>
                      <Input
                        id="signup-address"
                        type="text"
                        value={signupData.address}
                        onChange={(e) => setSignupData({ ...signupData, address: e.target.value })}
                        placeholder="Musterstraße 123"
                        disabled={isLoading}
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-postal">PLZ *</Label>
                        <Input
                          id="signup-postal"
                          type="text"
                          value={signupData.postalCode}
                          onChange={(e) => setSignupData({ ...signupData, postalCode: e.target.value })}
                          placeholder="12345"
                          disabled={isLoading}
                        />
                        {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-city">Stadt *</Label>
                        <Input
                          id="signup-city"
                          type="text"
                          value={signupData.city}
                          onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                          placeholder="Musterstadt"
                          disabled={isLoading}
                        />
                        {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-country">Land *</Label>
                      <Select
                        value={signupData.country}
                        onValueChange={(value) => setSignupData({ ...signupData, country: value })}
                        disabled={isLoading}
                      >
                        <SelectTrigger id="signup-country">
                          <SelectValue placeholder="Land wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {EU_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Wird registriert...' : 'Registrieren'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Nach der Registrierung muss Ihr Konto von uns geprüft und freigeschaltet werden.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={closeResetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </DialogDescription>
          </DialogHeader>
          
          {resetEmailSent ? (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts wurde an <strong>{resetEmail}</strong> gesendet.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Bitte überprüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten.
              </p>
              <Button onClick={closeResetDialog} className="w-full">
                Schließen
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-Mail-Adresse</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetEmailError('');
                  }}
                  placeholder="ihre@email.de"
                  disabled={isResetting}
                  autoFocus
                />
                {resetEmailError && (
                  <p className="text-sm text-destructive">{resetEmailError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeResetDialog}
                  className="flex-1"
                  disabled={isResetting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1" disabled={isResetting}>
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    'E-Mail senden'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;

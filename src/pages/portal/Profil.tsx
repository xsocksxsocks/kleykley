import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { EU_COUNTRIES } from '@/lib/countries';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  company_name: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen haben'),
  phone: z.string().min(5, 'Telefonnummer muss mindestens 5 Zeichen haben'),
  address: z.string().min(5, 'Adresse muss mindestens 5 Zeichen haben'),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben'),
  postal_code: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben'),
  country: z.string().min(1, 'Land muss ausgewählt sein'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  newPassword: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
  confirmPassword: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});


const Profil: React.FC = () => {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postal_code: profile?.postal_code || '',
    country: (profile as any)?.country || 'Deutschland',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postal_code: profile.postal_code || '',
        country: (profile as any)?.country || 'Deutschland',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      profileSchema.parse(profileData);
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
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Profil aktualisiert',
        description: 'Ihre Daten wurden erfolgreich gespeichert.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      passwordSchema.parse(passwordData);
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
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Passwort geändert',
        description: 'Ihr Passwort wurde erfolgreich aktualisiert.',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Passwort konnte nicht geändert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('request_account_deletion', {
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Löschung beantragt',
        description: 'Ihr Konto wird in 30 Tagen gelöscht. Sie werden jetzt ausgeloggt.',
      });

      // Log out the user after requesting deletion
      await signOut();
      navigate('/portal/auth');
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast({
        title: 'Fehler',
        description: 'Löschung konnte nicht beantragt werden.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('cancel_account_deletion', {
        user_id: user.id,
      });

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Löschung abgebrochen',
        description: 'Ihr Konto bleibt bestehen.',
      });
    } catch (error) {
      console.error('Error canceling deletion:', error);
      toast({
        title: 'Fehler',
        description: 'Löschung konnte nicht abgebrochen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDeletionPending = profile?.deletion_scheduled_at != null;
  const deletionDate = profile?.deletion_scheduled_at 
    ? new Date(profile.deletion_scheduled_at).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Mein Profil</h1>

        {isDeletionPending && (
          <Alert variant="destructive" className="mb-6 max-w-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Konto zur Löschung vorgemerkt</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Ihr Konto wird am <strong>{deletionDate}</strong> unwiderruflich gelöscht.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelDeletion}
                disabled={isLoading}
              >
                Löschung abbrechen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="max-w-2xl">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profildaten</TabsTrigger>
            <TabsTrigger value="password">Passwort ändern</TabsTrigger>
            <TabsTrigger value="account">Konto</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Persönliche Daten</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre persönlichen Daten und Lieferadresse.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Vollständiger Name *</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        disabled={isLoading}
                      />
                      {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Firmenname</Label>
                      <Input
                        id="company_name"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Die E-Mail-Adresse kann nicht geändert werden.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={isLoading}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-4">Firmen- und Lieferadresse</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Straße und Hausnummer *</Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          disabled={isLoading}
                        />
                        {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">PLZ *</Label>
                          <Input
                            id="postal_code"
                            value={profileData.postal_code}
                            onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                            disabled={isLoading}
                          />
                          {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Stadt *</Label>
                          <Input
                            id="city"
                            value={profileData.city}
                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                            disabled={isLoading}
                          />
                          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Land *</Label>
                        <Select
                          value={profileData.country}
                          onValueChange={(value) => setProfileData({ ...profileData, country: value })}
                          disabled={isLoading}
                        >
                          <SelectTrigger id="country">
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

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Passwort ändern</CardTitle>
                <CardDescription>
                  Ändern Sie Ihr Passwort für mehr Sicherheit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      disabled={isLoading}
                    />
                    {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Wird geändert...' : 'Passwort ändern'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Konto verwalten</CardTitle>
                <CardDescription>
                  Verwalten Sie Ihr Konto und Ihre Daten gemäß DSGVO.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Kontostatus</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.approval_status === 'approved' && 'Ihr Konto ist freigeschaltet.'}
                    {profile?.approval_status === 'pending' && 'Ihr Konto wartet auf Freischaltung.'}
                    {profile?.approval_status === 'rejected' && 'Ihr Konto wurde abgelehnt.'}
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-2 text-destructive flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Konto löschen
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gemäß DSGVO haben Sie das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen. 
                    Nach Beantragung haben Sie 30 Tage Zeit, die Löschung rückgängig zu machen. 
                    Nach Ablauf dieser Frist werden alle Ihre Daten unwiderruflich gelöscht.
                  </p>
                  
                  {isDeletionPending ? (
                    <div className="bg-destructive/10 p-4 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-2">
                        Löschung geplant für: {deletionDate}
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelDeletion}
                        disabled={isLoading}
                      >
                        Löschung abbrechen
                      </Button>
                    </div>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Konto löschen beantragen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ihr Konto und alle damit verbundenen Daten werden in 30 Tagen unwiderruflich gelöscht. 
                            Sie können die Löschung innerhalb dieser Frist jederzeit abbrechen, indem Sie sich anmelden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleRequestDeletion}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Ja, Löschung beantragen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
};

export default Profil;

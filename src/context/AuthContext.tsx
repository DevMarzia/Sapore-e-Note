import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/recipe';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, pass: string, username: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  uploadAvatar: (file: File) => Promise<string | null>;
}

const LOCAL_USER_KEY = 'sapore_note_local_user_v1';
const LOCAL_PROFILE_KEY = 'sapore_note_local_profile_v1';

const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest-chef',
  username: 'chef_visitatore',
  full_name: 'Visitatore Gastronomo',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  bio: 'Appassionato di cucina italiana e buone forchette.',
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  // Load profile from Supabase
  const fetchSupabaseProfile = useCallback(async (userId: string, userMeta?: any): Promise<UserProfile | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          username: data.username || `utente_${userId.slice(0, 5)}`,
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          is_private: data.is_private === true,
          created_at: data.created_at,
        };
      }

      // If profile record doesn't exist yet (e.g. newly signed in via Google OAuth)
      const username = userMeta?.username
        || userMeta?.preferred_username
        || (userMeta?.full_name ? userMeta.full_name.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20) : '')
        || (userMeta?.email ? userMeta.email.split('@')[0].replace(/[^a-z0-9_]/g, '_').substring(0, 20) : '')
        || `chef_${userId.slice(0, 6)}`;
      const fullName = userMeta?.full_name || userMeta?.name || '';
      const avatarUrl = userMeta?.avatar_url || userMeta?.picture || '';
      const fallbackProfile: UserProfile = {
        id: userId,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: 'Appassionato di ricette e cucina genuina.',
        is_private: false,
        created_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
          bio: fallbackProfile.bio,
          is_private: false,
        }])
        .select()
        .single();

      if (!insertErr && inserted) {
        return {
          ...inserted,
          is_private: inserted.is_private === true,
        };
      }
      return fallbackProfile;
    } catch (e) {
      console.warn('Eccezione caricamento profilo Supabase:', e);
      return null;
    }
  }, []);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      const supabase = getSupabaseClient();

      if (supabase && isConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            const userProfile = await fetchSupabaseProfile(session.user.id, session.user.user_metadata);
            if (mounted) setProfile(userProfile);
          }
        } catch (e) {
          console.warn('Errore lettura sessione Supabase:', e);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (!mounted) return;
            if (session?.user) {
              setUser(session.user);
              const userProfile = await fetchSupabaseProfile(session.user.id, session.user.user_metadata);
              setProfile(userProfile);
            } else {
              setUser(null);
              setProfile(null);
            }
          }
        );

        // Sync session helper when tokens are received from the popup
        const applyTokens = async (accessToken?: string | null, refreshToken?: string | null) => {
          if (!mounted) return;
          try {
            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (!error && data.session?.user) {
                setUser(data.session.user);
                const userProfile = await fetchSupabaseProfile(data.session.user.id, data.session.user.user_metadata);
                setProfile(userProfile);
                return;
              }
            }

            // Fallback: check session from storage
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              setUser(session.user);
              const userProfile = await fetchSupabaseProfile(session.user.id, session.user.user_metadata);
              setProfile(userProfile);
            }
          } catch (err) {
            console.warn('Errore sync sessione Supabase:', err);
          }
        };

        // 1. Listen for postMessage from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'SUPABASE_AUTH_TOKENS' && mounted) {
            applyTokens(event.data.access_token, event.data.refresh_token);
          } else if (event.data?.type === 'SUPABASE_AUTH_SUCCESS' && mounted) {
            applyTokens();
          }
        };
        window.addEventListener('message', handleMessage);

        // 2. Listen on BroadcastChannel (cross-window communication)
        let authChannel: BroadcastChannel | null = null;
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            authChannel = new BroadcastChannel('sapore_auth_sync');
            authChannel.onmessage = (event) => {
              if (event.data?.type === 'SUPABASE_AUTH_TOKENS' && mounted) {
                applyTokens(event.data.access_token, event.data.refresh_token);
              }
            };
          } catch (e) {
            console.warn('BroadcastChannel error in context:', e);
          }
        }

        // 3. Listen on storage event (when popup writes to localStorage)
        const handleStorage = (event: StorageEvent) => {
          if (event.key === 'sapore_auth_sync_event' && event.newValue && mounted) {
            try {
              const parsed = JSON.parse(event.newValue);
              applyTokens(parsed.access_token, parsed.refresh_token);
            } catch {
              applyTokens();
            }
          }
        };
        window.addEventListener('storage', handleStorage);

        if (mounted) setIsLoading(false);
        return () => {
          subscription.unsubscribe();
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
          if (authChannel) authChannel.close();
        };
      } else {
        // Fallback local storage profile for offline / demo mode
        try {
          const storedUser = localStorage.getItem(LOCAL_USER_KEY);
          const storedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
          if (storedUser && storedProfile && mounted) {
            setUser(JSON.parse(storedUser));
            setProfile(JSON.parse(storedProfile));
          }
        } catch (e) {
          console.warn('Errore ripristino utente locale:', e);
        }
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [isConfigured, fetchSupabaseProfile]);

  // Sign up
  const signUp = async (email: string, pass: string, username: string, fullName: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      return { error: 'Lo username può contenere solo lettere minuscole, numeri e underscore.' };
    }
    if (pass.length < 6) {
      return { error: 'La password deve contenere almeno 6 caratteri.' };
    }

    const supabase = getSupabaseClient();
    if (supabase && isConfigured) {
      try {
        // Check if username is already taken in profiles table
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          return { error: `Lo username @${cleanUsername} è già in uso. Scegline un altro.` };
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              username: cleanUsername,
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (data?.user) {
          setUser(data.user);
          // Insert profile immediately
          const newProfile: UserProfile = {
            id: data.user.id,
            username: cleanUsername,
            full_name: fullName.trim(),
            avatar_url: '',
            bio: 'Nuovo chef nella community di Sapore & Note!',
            created_at: new Date().toISOString(),
          };

          await supabase.from('profiles').upsert([newProfile]);
          setProfile(newProfile);
          return {};
        }

        return { error: 'Registrazione non completata. Controlla la tua email di conferma.' };
      } catch (err: any) {
        return { error: err.message || 'Errore di connessione a Supabase durante la registrazione.' };
      }
    } else {
      // Local Mode Sign Up
      const localId = `user-${Date.now()}`;
      const fakeUser = {
        id: localId,
        email: email.trim(),
        user_metadata: { username: cleanUsername, full_name: fullName.trim() },
      } as unknown as User;

      const newProfile: UserProfile = {
        id: localId,
        username: cleanUsername,
        full_name: fullName.trim() || cleanUsername,
        avatar_url: '',
        bio: 'Membro registrato in locale.',
        created_at: new Date().toISOString(),
      };

      setUser(fakeUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fakeUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      return {};
    }
  };

  // Sign in
  const signIn = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (supabase && isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          return { error: error.message === 'Invalid login credentials' ? 'Email o password non corretti.' : error.message };
        }

        if (data?.user) {
          setUser(data.user);
          const userProfile = await fetchSupabaseProfile(data.user.id, data.user.user_metadata);
          setProfile(userProfile);
          return {};
        }

        return { error: 'Impossibile accedere con le credenziali fornite.' };
      } catch (err: any) {
        return { error: err.message || 'Errore di rete durante il login.' };
      }
    } else {
      // Local Mode Sign In
      const cleanEmail = email.trim();
      const localUsername = cleanEmail.split('@')[0] || 'chef_locale';
      const localId = `user-local-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const fakeUser = {
        id: localId,
        email: cleanEmail,
        user_metadata: { username: localUsername },
      } as unknown as User;

      const userProfile: UserProfile = {
        id: localId,
        username: localUsername,
        full_name: localUsername,
        avatar_url: '',
        bio: 'Bentornato su Sapore & Note!',
        created_at: new Date().toISOString(),
      };

      setUser(fakeUser);
      setProfile(userProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fakeUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProfile));
      return {};
    }
  };

  // Sign in with Google (OAuth)
  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (supabase && isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true, // Prevents iframe from redirecting to Google and causing 403
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('validation')) {
            return {
              error: 'Il provider Google non è ancora abilitato su Supabase (Authentication > Providers > Google). Nel frattempo puoi accedere con email o testare il profilo locale.',
            };
          }
          return { error: error.message };
        }

        if (data?.url) {
          // Open OAuth in an external popup window so it never loads inside the iframe
          const width = 500;
          const height = 620;
          const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
          const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

          const popup = window.open(
            data.url,
            'supabase_google_auth',
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
          );

          if (!popup) {
            return {
              error: 'Il browser ha bloccato il popup di Google. Abilita i popup o clicca sul link.',
            };
          }

          // Polling check to detect session and close popup
          let checkTicks = 0;
          const timer = setInterval(async () => {
            checkTicks++;
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user) {
                clearInterval(timer);
                setUser(sessionData.session.user);
                const userProfile = await fetchSupabaseProfile(
                  sessionData.session.user.id,
                  sessionData.session.user.user_metadata
                );
                setProfile(userProfile);
                try {
                  popup.close();
                } catch {
                  // ignore
                }
                return;
              }
            } catch {
              // ignore
            }

            if (popup.closed || checkTicks > 90) {
              clearInterval(timer);
              try {
                const { data: finalSession } = await supabase.auth.getSession();
                if (finalSession?.session?.user) {
                  setUser(finalSession.session.user);
                  const userProfile = await fetchSupabaseProfile(
                    finalSession.session.user.id,
                    finalSession.session.user.user_metadata
                  );
                  setProfile(userProfile);
                }
              } catch {
                // ignore
              }
            }
          }, 600);

          return {};
        }

        return {};
      } catch (err: any) {
        return { error: err.message || 'Errore di connessione a Google OAuth.' };
      }
    } else {
      // Local Mode Google Sign In Simulation
      const localId = `google-user-${Date.now()}`;
      const fakeUser = {
        id: localId,
        email: 'chef.google@example.com',
        user_metadata: {
          full_name: 'Chef Google',
          username: 'chef_google',
          avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
        },
      } as unknown as User;

      const userProfile: UserProfile = {
        id: localId,
        username: 'chef_google',
        full_name: 'Chef Google',
        avatar_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80',
        bio: 'Account Google collegato a Sapore & Note.',
        is_private: false,
        created_at: new Date().toISOString(),
      };

      setUser(fakeUser);
      setProfile(userProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fakeUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProfile));
      return {};
    }
  };

  // Sign out
  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase && isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Errore signOut Supabase:', e);
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { error: 'Nessun profilo attivo.' };

    const updated = { ...profile, ...updates };

    const supabase = getSupabaseClient();
    if (supabase && isConfigured && user) {
      try {
        const updatePayload: any = {
          full_name: updated.full_name,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
        };
        if (typeof updated.is_private === 'boolean') {
          updatePayload.is_private = updated.is_private;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id);

        if (error) {
          // If is_private column does not exist yet on Supabase, retry without it
          if (error.message?.toLowerCase().includes('is_private')) {
            console.warn('Colonna is_private non ancora presente su Supabase, salvo gli altri campi');
            const { is_private, ...fallbackPayload } = updatePayload;
            await supabase.from('profiles').update(fallbackPayload).eq('id', user.id);
          } else {
            console.error('Errore salvataggio profilo Supabase:', error.message);
            return { error: error.message };
          }
        }
      } catch (err: any) {
        return { error: err.message };
      }
    }

    setProfile(updated);
    if (!isConfigured) {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
    }
    return {};
  };

  // Upload Avatar to avatars bucket or local Data URL
  const uploadAvatar = async (file: File): Promise<string | null> => {
    const supabase = getSupabaseClient();
    if (supabase && isConfigured && user) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          return data.publicUrl;
        }
      } catch (e) {
        console.warn('Errore upload avatar su Supabase Storage, fallback Data URL:', e);
      }
    }

    // Fallback Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: profile || (user ? {
          id: user.id,
          username: user.user_metadata?.username || `chef_${user.id.slice(0, 5)}`,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: '',
          bio: '',
        } : null),
        isLoading,
        isConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};

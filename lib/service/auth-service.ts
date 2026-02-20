
import { supabase } from '../supabase';

export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

const ROLE_WEIGHTS: Record<UserRole, number> = {
  admin: 100,
  supervisor: 50,
  technician: 20,
  viewer: 10
};

export const AuthService = {
  /**
   * Récupère le profil public et tente une auto-réparation si manquant
   */
  async fetchMyProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await (supabase.auth as any).getUser();
      if (!user) return null;

      // 1. Tentative de lecture simple
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // 2. AUTO-RÉPARATION : Si le profil manque, on le crée à la volée avec les données JWT
      if (!data && user) {
        console.warn("[AuthService] Profil manquant détecté. Initialisation de la liaison...");
        
        const metadata = user.user_metadata || {};
        const role = (metadata.role || 'technician').toLowerCase();

        // Fix: Cast supabase.from('profiles') to any to resolve "never" type error on upsert when the schema definition is incomplete
        const { data: repaired, error: repairError } = await (supabase
          .from('profiles') as any)
          .upsert({
            id: user.id,
            email: user.email!,
            full_name: metadata.full_name || user.email?.split('@')[0] || 'Agent SIG',
            role: role as any,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (repairError) {
          console.error("[AuthService] Échec de l'auto-réparation:", repairError.message);
          return null;
        }
        data = repaired;
      }

      return data as UserProfile | null;
    } catch (err) {
      console.error('[AuthService] Erreur critique de résolution:', err);
      return null;
    }
  },

  hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const userWeight = ROLE_WEIGHTS[userRole] || 0;
    const requiredWeight = ROLE_WEIGHTS[requiredRole] || 0;
    return userWeight >= requiredWeight;
  }
};

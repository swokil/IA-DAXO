
import { UserProfile } from '../types';

// Simulation d'une base de données cloud via LocalStorage pour le prototype
// Facilement remplaçable par Supabase ou Firebase
const STORAGE_KEY = 'daxo_cloud_users';
const SESSION_KEY = 'daxo_active_session';

export const authService = {
  // Simule une inscription ou connexion
  async signIn(email: string, provider: string, name?: string): Promise<UserProfile> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        
        // Si l'utilisateur n'existe pas, on le crée
        if (!users[email]) {
          users[email] = {
            id: btoa(email),
            name: name || email.split('@')[0],
            email: email,
            provider: provider,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            createdAt: Date.now()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        }

        const user = users[email];
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        resolve(user);
      }, 1500);
    });
  },

  // Récupère la session actuelle au chargement de la page
  getCurrentUser(): UserProfile | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // Déconnexion
  signOut() {
    localStorage.removeItem(SESSION_KEY);
  }
};

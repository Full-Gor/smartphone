// public/js/auth-service.js
class AuthService {
    static async register(userData) {
      try {
        // Créer l'utilisateur avec email et mot de passe
        const userCredential = await auth.createUserWithEmailAndPassword(
          userData.email, 
          userData.password
        );
        const user = userCredential.user;
  
        // Stockage des informations utilisateur supplémentaires
        await db.collection('users').doc(user.uid).set({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          registered: new Date().toISOString(),
          role: 'user'
        });
  
        return user;
      } catch (error) {
        console.error('Erreur d\'inscription:', error);
        throw error;
      }
    }
  
    static async login(email, password) {
      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
      } catch (error) {
        console.error('Erreur de connexion:', error);
        throw error;
      }
    }
  
    static async logout() {
      try {
        await auth.signOut();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Erreur de déconnexion:', error);
        throw error;
      }
    }
  
    static getCurrentUser() {
      return auth.currentUser;
    }
  
    // Vérifier l'état de connexion
    static onAuthStateChanged(callback) {
      return auth.onAuthStateChanged(callback);
    }
  }
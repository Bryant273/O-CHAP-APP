import { Injectable, signal, computed } from '@angular/core';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { OchapUser } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = signal<User | null>(null);
  private profile = signal<Record<string, unknown> | null>(null);
  private profileUnsub: (() => void) | null = null;
  
  public user$ = this.user.asReadonly();
  public profile$ = this.profile.asReadonly();
  public isAuthenticated = signal(false);

  public isAdmin = computed(() => {
    const u = this.user();
    const p = this.profile();
    if (!u) return false;
    const email = u.email?.toLowerCase();
    if (email === 'acherie812@gmail.com') return true;
    return p?.['role'] === 'admin' || p?.['role'] === 'manager_erp';
  });

  public isManagerSup = computed(() => {
    const p = this.profile();
    return p?.['role'] === 'manager_sup';
  });

  public isSupplier = computed(() => {
    const p = this.profile();
    const role = p?.['role'];
    return role === 'supplier' || role === 'fournisseur' || role === 'manager_sup';
  });

  public isLivreur = computed(() => {
    const p = this.profile();
    return p?.['role'] === 'livreur';
  });

  public isAuditeur = computed(() => {
    const p = this.profile();
    return p?.['role'] === 'auditeur';
  });

  public isStaff = computed(() => this.isAdmin() || this.isSupplier() || this.isLivreur() || this.isAuditeur());

  async updateProfile(updates: Partial<OchapUser>) {
    const user = this.user();
    if (!user) return false;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    }
  }

  constructor() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, async (user: User | null) => {
        this.user.set(user);
        this.isAuthenticated.set(!!user);
        
        if (this.profileUnsub) {
          this.profileUnsub();
          this.profileUnsub = null;
        }

        if (user) {
          this.watchProfile(user.uid);
        } else {
          this.profile.set(null);
        }
      });
    }
  }

  private watchProfile(uid: string) {
    const docRef = doc(db, 'users', uid);
    this.profileUnsub = onSnapshot(docRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        const email = (data['email'] as string)?.toLowerCase();
        let role = data['role'] as string;
        
        const adminEmails = ['acherie812@gmail.com'];
        if (adminEmails.includes(email)) {
          role = 'admin';
        }

        if (role !== data['role']) {
          await setDoc(docRef, { role }, { merge: true });
        } else {
          this.profile.set(data);
        }
      } else {
        // Handle case where auth user exists but no firestore doc yet
        // ensureProfile will handle creation
        const user = auth.currentUser;
        if (user) await this.ensureProfile(user);
      }
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await this.ensureProfile(result.user);
    return result.user;
  }

  async signupWithEmail(email: string, pass: string, name: string, role = 'client') {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    await this.ensureProfile(result.user, name, role);
    return result.user;
  }

  async loginWithEmail(email: string, pass: string) {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  }

  async logout() {
    if (this.profileUnsub) this.profileUnsub();
    await signOut(auth);
  }

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) return;
    
    const email = user.email?.toLowerCase();
    if (email === 'acherie812@gmail.com') {
      throw new Error('Le compte administrateur ERP ne peut pas être supprimé.');
    }

    // Delete Firestore profile
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { deleted: true, email: 'deleted@ochap.com', displayName: 'Compte Supprimé' }, { merge: true });
    
    // In a real app we'd call user.delete(), but here we'll just sign out 
    // as user.delete() requires recent login. We'll mark the profile as deleted.
    await this.logout();
  }

  private async ensureProfile(user: User, name?: string, requestedRole?: string) {
    const docRef = doc(db, 'users', user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) return;

    const email = user.email?.toLowerCase();
    let role = requestedRole || 'client';
    
    if (email === 'acherie812@gmail.com') {
      role = 'admin';
    }

    const newProfile = {
      uid: user.uid,
      email: user.email,
      displayName: name || user.displayName || 'Utilisateur O\'CHAP',
      photoURL: user.photoURL || null,
      role: role,
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, newProfile);
  }
}

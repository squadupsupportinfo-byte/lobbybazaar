import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { playSquadJoinSound, playSketchClick } from '../utils/audio';
import { CharacterAvatarType } from '../types';

export interface GamerSocialLinks {
  discord?: string;
  twitch?: string;
  steam?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  instagram?: string;
  facebook?: string;
}

export interface GamerPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface GamerPlaySchedule {
  days?: string[];
  timeSlot?: string;
  customHours?: string;
}

export interface GamerProfile {
  uid: string;
  email: string;
  gamerTag: string;
  photoUrl?: string;
  bio?: string;
  favoriteGame?: string;
  favoriteConsole?: string;
  role?: string;
  rank?: string;
  characterAvatar?: CharacterAvatarType;
  likedGenres?: string[];
  likedGames?: string[];
  socialLinks?: GamerSocialLinks;
  photos?: GamerPhoto[];
  zipCode?: string;
  locationName?: string;
  coords?: { lat: number; lng: number };
  playSchedule?: GamerPlaySchedule;
  isLive?: boolean;
  unlockedBuildings?: string[];
  unlockedCharacters?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  gamerProfile: GamerProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    gamerTag: string,
    favoriteGame?: string,
    role?: string,
    characterAvatar?: CharacterAvatarType
  ) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateGamerProfile: (data: Partial<GamerProfile>) => Promise<void>;
  deleteAccountPermanently: (password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [gamerProfile, setGamerProfile] = useState<GamerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load gamer profile from Firestore strictly for the active user
  const fetchGamerProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as GamerProfile;
        if (data.uid === firebaseUser.uid) {
          setGamerProfile(data);
          if (Array.isArray(data.unlockedBuildings)) {
            data.unlockedBuildings.forEach((bType) => {
              if (bType && typeof window !== 'undefined') {
                localStorage.setItem(`squadup_unlocked_${bType}`, 'true');
              }
            });
          }
          if (Array.isArray(data.unlockedCharacters)) {
            data.unlockedCharacters.forEach((cId) => {
              if (cId && typeof window !== 'undefined') {
                localStorage.setItem(`squadup_character_unlocked_${cId}`, 'true');
              }
            });
          }

          // Also sync any locally confirmed unlocks into Firestore so user never loses unlocks
          if (typeof window !== 'undefined') {
            const premiumIds = ['moon_demon_noble', 'demon_dog_warrior', 'celestial_moon_guardian', 'sacred_shrine_priestess'];
            const locallyUnlocked = premiumIds.filter(
              (cId) => localStorage.getItem(`squadup_character_unlocked_${cId}`) === 'true'
            );
            const currentUnlocked = data.unlockedCharacters || [];
            const merged = Array.from(new Set([...currentUnlocked, ...locallyUnlocked]));
            if (merged.length !== currentUnlocked.length) {
              data.unlockedCharacters = merged;
              setDoc(userDocRef, { unlockedCharacters: merged }, { merge: true }).catch(() => {});
            }
          }
          try {
            localStorage.setItem(`squadup_profile_${firebaseUser.uid}`, JSON.stringify(data));
          } catch {
            // ignore localStorage quota
          }
        }
      } else {
        // Create initial default profile for new user
        const defaultGamerTag =
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          `Gamer_${firebaseUser.uid.slice(0, 5)}`;
        const newProfile: GamerProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          gamerTag: defaultGamerTag,
          favoriteGame: 'Valorant',
          role: 'Flex Player',
          rank: 'Unranked',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setGamerProfile(newProfile);
        try {
          localStorage.setItem(`squadup_profile_${firebaseUser.uid}`, JSON.stringify(newProfile));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Error fetching gamer profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load cached profile specifically for THIS user while network loads
        try {
          const userCache = localStorage.getItem(`squadup_profile_${currentUser.uid}`);
          if (userCache) {
            setGamerProfile(JSON.parse(userCache));
          } else {
            setGamerProfile(null);
          }
        } catch {
          setGamerProfile(null);
        }
        await fetchGamerProfile(currentUser);
      } else {
        setUser(null);
        setGamerProfile(null);
      }
      setLoading(false);
    });

    // Listen for real-time character unlock events
    const handleCharUnlocked = (e: any) => {
      const charId = e.detail?.characterId;
      if (charId) {
        setGamerProfile((prev) => {
          if (!prev) return null;
          const current = prev.unlockedCharacters || [];
          const next = Array.from(new Set([...current, charId]));
          return {
            ...prev,
            unlockedCharacters: next,
            characterAvatar: charId as CharacterAvatarType,
          };
        });
      }
    };
    window.addEventListener('squadup_character_unlocked', handleCharUnlocked);

    return () => {
      unsubscribe();
      window.removeEventListener('squadup_character_unlocked', handleCharUnlocked);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      playSketchClick();
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        setUser(res.user);
        playSquadJoinSound();
        await fetchGamerProfile(res.user);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.warn('Google Sign In Notice:', err?.message || err);
      }
      throw err;
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    gamerTag: string,
    favoriteGame = 'Valorant',
    role = 'Flex',
    characterAvatar: CharacterAvatarType = 'waving'
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      playSketchClick();

      // Enforce strict one email for one account policy across Firestore records
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', cleanEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          throw new Error('This email address is already in use by another account. Only one account per email is allowed. Please sign in instead.');
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('already in use')) {
          throw checkErr;
        }
      }

      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const firebaseUser = res.user;

      await updateProfile(firebaseUser, { displayName: gamerTag.trim() });

      const newProfile: GamerProfile = {
        uid: firebaseUser.uid,
        email: cleanEmail,
        gamerTag: gamerTag.trim(),
        favoriteGame,
        role,
        characterAvatar,
        rank: 'Unranked',
        createdAt: new Date().toISOString(),
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, newProfile);
      setGamerProfile(newProfile);
      setUser(firebaseUser);
      try {
        localStorage.setItem('squadup_saved_profile', JSON.stringify(newProfile));
        localStorage.setItem(`squadup_profile_${firebaseUser.uid}`, JSON.stringify(newProfile));
      } catch {
        // ignore
      }
      playSquadJoinSound();
    } catch (err: any) {
      console.warn('Sign Up Notice:', err?.message || err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      playSketchClick();
      const res = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      if (res.user) {
        setUser(res.user);
        playSquadJoinSound();
        await fetchGamerProfile(res.user);
      }
    } catch (err: any) {
      console.warn('Sign In Notice:', err?.message || err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      playSketchClick();
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (err: any) {
      console.warn('Password Reset Notice:', err?.message || err);
      throw err;
    }
  };

  const deleteAccountPermanently = async (password?: string) => {
    if (!auth.currentUser) {
      throw new Error('No active user account found.');
    }
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;

    try {
      playSketchClick();

      // If password provided, re-authenticate to prevent 'auth/requires-recent-login'
      if (password && currentUser.email) {
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (reauthErr: any) {
          console.warn('Re-auth notice during deletion:', reauthErr);
          throw new Error('Incorrect password. Please verify your current password to authorize permanent deletion.');
        }
      }

      // 1. Delete user's squad beacons AND deployed store shops in Firestore
      try {
        const squadsQuery = query(collection(db, 'squads'), where('ownerId', '==', uid));
        const squadsSnap = await getDocs(squadsQuery);
        for (const sDoc of squadsSnap.docs) {
          await deleteDoc(sDoc.ref);
        }
      } catch (squadsErr) {
        console.warn('Squads and store shop cleanup notice during account deletion:', squadsErr);
      }

      // Clean up any friend requests sent or received by this user
      try {
        const frSentQuery = query(collection(db, 'friend_requests'), where('senderId', '==', uid));
        const frSentSnap = await getDocs(frSentQuery);
        for (const frDoc of frSentSnap.docs) {
          await deleteDoc(frDoc.ref);
        }
        const frRecvQuery = query(collection(db, 'friend_requests'), where('receiverId', '==', uid));
        const frRecvSnap = await getDocs(frRecvQuery);
        for (const frDoc of frRecvSnap.docs) {
          await deleteDoc(frDoc.ref);
        }
      } catch (frErr) {
        console.warn('Friend requests cleanup notice:', frErr);
      }

      // Clean up any friendships involving this user
      try {
        const f1Query = query(collection(db, 'friends'), where('user1Id', '==', uid));
        const f1Snap = await getDocs(f1Query);
        for (const fDoc of f1Snap.docs) {
          await deleteDoc(fDoc.ref);
        }
        const f2Query = query(collection(db, 'friends'), where('user2Id', '==', uid));
        const f2Snap = await getDocs(f2Query);
        for (const fDoc of f2Snap.docs) {
          await deleteDoc(fDoc.ref);
        }
      } catch (fErr) {
        console.warn('Friends cleanup notice:', fErr);
      }

      // 2. Delete user's profile document from Firestore
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (userDocErr) {
        console.warn('User profile cleanup notice:', userDocErr);
      }

      // 3. Clear all local storage caches, including deployed store shops
      try {
        localStorage.removeItem('squadup_saved_profile');
        localStorage.removeItem(`squadup_profile_${uid}`);
        localStorage.removeItem('squadup_user_email');
        localStorage.removeItem('squadup_deployed_stores');
        sessionStorage.clear();
      } catch {
        // ignore
      }

      // 4. Delete the Firebase Auth user permanently
      await deleteUser(currentUser);

      // 5. Reset states
      setUser(null);
      setGamerProfile(null);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        throw new Error('For security, account deletion requires a recent sign in. Please re-enter your password or sign out and sign back in.');
      }
      throw err;
    }
  };

  const updateProfileData = async (data: Partial<GamerProfile>) => {
    const current: GamerProfile = gamerProfile || {
      uid: user?.uid || 'guest-user',
      email: user?.email || '',
      gamerTag: user?.displayName || 'Gamer',
      createdAt: new Date().toISOString(),
    };
    const updated: GamerProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setGamerProfile(updated);

    // 1. Persist to Firestore first so cloud storage always succeeds!
    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore profile update notice:', firestoreErr);
      }
    }

    // 2. Cache in localStorage strictly for this user UID
    if (user?.uid) {
      try {
        localStorage.setItem(`squadup_profile_${user.uid}`, JSON.stringify(updated));
      } catch {
        // If photo data URLs exceed browser localStorage quota (~5MB), strip heavy base64 strings from local storage cache
        try {
          const lightCopy = {
            ...updated,
            photos: (updated.photos || []).map((p) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              uploadedAt: p.uploadedAt,
            })),
          };
          localStorage.setItem(
            `squadup_profile_${user.uid}`,
            JSON.stringify({ ...lightCopy, photos: [] })
          );
        } catch {
          // Safe to ignore in-memory state and Firestore maintain full fidelity
        }
      }
    }
    playSketchClick();
  };

  const logout = async () => {
    playSketchClick();
    try {
      localStorage.removeItem('squadup_saved_profile');
      localStorage.removeItem('squadup_user_email');
      sessionStorage.clear();
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('squadup_profile_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
    await signOut(auth);
    setUser(null);
    setGamerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        gamerProfile,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        updateGamerProfile: updateProfileData,
        deleteAccountPermanently,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

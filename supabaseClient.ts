import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import EncryptedStorage from 'react-native-encrypted-storage';

// ✅ CORRECT CONFIGURATION (Derived from your Key)
const SUPABASE_URL = 'https://zpunedwsgzijpezpwuih.supabase.co';
const SUPABASE_ANON_KEY = 'TzGffCoJqCVw/xk7miYo2/XqDvBYnajccRijJC40vnmd9LgE3LmDegMeGePCOy8jnnC8RHORLzM/eU7uu4nn2A==';

const SecureStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const val = await EncryptedStorage.getItem(key);
      return val;
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await EncryptedStorage.setItem(key, value);
    } catch (e) {
      // Handle error
    }
  },
  removeItem: async (key: string) => {
    try {
      await EncryptedStorage.removeItem(key);
    } catch (e) {
      // Handle error
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// /store/themeStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : undefined
      ),
      partialize: (state) => ({ theme: state.theme }),
      // onRehydrateStorage: () => (state) => {
      //   // debug
      //   console.log('✅ theme rehydrated:', state);
      // },
    }
  )
);

export default useThemeStore;

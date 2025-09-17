// /store/themeStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: 'chats',
      selectedContact:null,
      setSelectedContact: (contact) => set({ selectedContact: contact }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'layout-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : undefined
      ),
      partialize: (state) => ({ activeTab: state.activeTab, selectedContact: state.selectedContact }),
      // onRehydrateStorage: () => (state) => {
      //   // debug
      //   console.log('✅ Layout rehydrated:', state);
      // },
    }
  )
);

export default useLayoutStore;

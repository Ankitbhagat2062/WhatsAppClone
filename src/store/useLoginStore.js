import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useLoginStore = create(
  persist(
    (set) => ({
      step: 1,
      userPhoneData: null,
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      resetLoginState: () => set({ step: 1, userPhoneData: null }),
    }),
    {
      name: "login-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : undefined
      ),
      partialize: (state) => ({
        step: state.step,
        userPhoneData: state.userPhoneData,
      }),
      // onRehydrateStorage: () => (state) => {
      //   console.log("✅ login store rehydrated:", state);
      // },
    }
  )
);

export default useLoginStore;



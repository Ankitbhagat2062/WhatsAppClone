import { create } from 'zustand';
import { getSocket } from '../pages/services/chat.service';
import axiosInstance from '../pages/services/url.service'

const useStatusStore = create((set, get) => ({
    statuses: [],
    loading: false,
    error: null,
    setStatuses: (status) => set({ status }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    inittializeSocket: () => {
        const socket = getSocket();
        if (!socket) return;

        socket.on("new_status", (newStatus) => {
            set((state) => ({
                statuses: state.statuses.some((s) => s.id === newStatus._id)
                    ? state.statuses : [newStatus, ...state.statuses]
            }))
        })
        socket.on("status_deleted", (statusId) => {
            set((state) => ({
                statuses: state.statuses.filter((s) => s.id === statusId)
            }))
        })
        socket.on("status_viewed", (statusId, viewers) => {
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status.id === statusId ? { ...status, viewers } : status)
            }))
        })
    },
    cleanupSocket: () => {
        const socket = getSocket();
        if (socket) {
            socket.off("new status");
            socket.off("status deleted");
            socket.off("status_viewed");
        }
    },
    //fetch statos
    fetchStatuses: async () => {
        set({ loading: true, error: null })
        try {
            const { data } = await axiosInstance.get("status");
            set({ statuses: data.data || {}, loading: false })
        }
        catch (error) {
            console.error("Error fetching status", error)
            set({ error: error.message, loading: false })
        }
    },
    createStatus: async (statusData) => {
        set({ loading: true, error: null });
        try {
            const formData = new FormData();
            if (statusData.file) formData.append("media", statusData.file);
            if (statusData.content?.trim()) formData.append("content", statusData.content);

            const { data } = await axiosInstance.post("/status", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (data.data) {
                set((state) => ({
                    statuses: state.statuses.some((s) => s.id === data.data.id)
                        ? state.statuses
                        : [data.data, ...state.statuses],
                    loading: false,
                }));
            }
            return data.data;
        } catch (error) {
            console.error("Error creating Status", error);
            set({ error: error.message, loading: false });
        }
    },
    viewStatus: async (statusId) => {
        try {
            await axiosInstance.put(`status/${statusId}/view`)
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status.id === statusId ? { ...status } : status)
            }))
        } catch (error) {
            console.error("Error creating Status", error)
            set({ error: error.message, loading: false })
        }
    },
    deleteStatus: async (statusId) => {
        try {
            set({ loading: true, error: null });
            await axiosInstance.delete(`/status/${statusId}`);
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId) // ✅ fix: use _id
            }));
        } catch (error) {
            console.error("Error deleting Status", error);
            set({ error: error.message, loading: false });
            throw new Error();
        }
    },

    getStatusViewwers: async (statusId) => {
        try {
            set({ loading: true, error: null })
            const { data } = await axiosInstance.get(`status/${statusId}/viewers`)
            return data.data;
        } catch (error) {
            console.error("Error getting StatusViewers", error)
            set({ error: error.message, loading: false });
            throw new Error
        }
    },
    getGroupedStatus: () => {
        const {
            statuses
        } = get();
        return statuses.reduce((acc, status) => {
            const statusUserId = status.user?._id;
            if (!acc[statusUserId]) {
                acc[statusUserId] = {
                    id: statusUserId,
                    name: status?.user?.username,
                    avatar: status?.user?.profilePicture,
                    statuses: []
                };
            }
            acc[statusUserId].statuses.push({
                id: status._id,
                media: status.content,
                contentType: status.contentType,
                timestamp: status.createdAt,
                viewers: status.viewers,
            });
            return acc;
        }, {});
    },
    getUserStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return userId ? groupedStatus[userId] : null;
    },

    getOtherStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return Object.values(groupedStatus).filter(
            (contact) => contact._id !== userId
        );
    },

    //clear error
    clearError: () => set({ error: null }),

    reset: () =>
        set({
            statuses: [],
            loading: false,
            error: null,
        }),
}));

export default useStatusStore;

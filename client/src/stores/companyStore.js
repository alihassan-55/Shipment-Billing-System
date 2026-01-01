import { create } from 'zustand';
import axios from 'axios';

export const useCompanyStore = create((set) => ({
    company: null,
    isLoading: false,
    error: null,

    fetchCompany: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get('/company');
            set({ company: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch company profile:', error);
            set({ isLoading: false, error: 'Failed to load company info' });
        }
    },

    updateCompany: async (data) => {
        set({ isLoading: true });
        try {
            const response = await axios.put('/company', data);
            set({ company: response.data, isLoading: false, error: null });
            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to update' });
            return { success: false, error: error.response?.data?.error };
        }
    },

    uploadLogo: async (file) => {
        set({ isLoading: true });
        try {
            const formData = new FormData();
            formData.append('logo', file);

            const response = await axios.post('/company/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local state with new profile and logoUrl
            set({ company: response.data.profile, isLoading: false, error: null });
            return { success: true, publicUrl: response.data.publicUrl };
        } catch (error) {
            console.error('Logo upload failed:', error);
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to upload logo' });
            return { success: false, error: error.response?.data?.error };
        }
    }
}));

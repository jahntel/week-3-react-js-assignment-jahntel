import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import api from '../api/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,
      
      // Initialize auth state from stored token
      initializeAuth: async () => {
        const token = get().token;
        if (token) {
          try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, loading: false });
          } catch (error) {
            set({ user: null, token: null, loading: false });
            localStorage.removeItem('skillbridge-auth');
          }
        } else {
          set({ loading: false });
        }
      },

      // Login user
      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, token } = response.data.data;
          
          set({ user, token, loading: false });
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          toast.success(response.data.message || 'Login successful!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Register user
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData);
          const { user, token } = response.data.data;
          
          set({ user, token, loading: false });
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          toast.success(response.data.message || 'Registration successful!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Logout user
      logout: async () => {
        try {
          await api.get('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, token: null });
          delete api.defaults.headers.common['Authorization'];
          localStorage.removeItem('skillbridge-auth');
          toast.success('Logged out successfully');
        }
      },

      // Update user profile
      updateProfile: async (userData) => {
        try {
          const response = await api.put('/auth/updatedetails', userData);
          const updatedUser = response.data.data.user;
          
          set({ user: updatedUser });
          toast.success('Profile updated successfully');
          return { success: true, user: updatedUser };
        } catch (error) {
          const message = error.response?.data?.message || 'Profile update failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Change password
      changePassword: async (passwordData) => {
        try {
          const response = await api.put('/auth/updatepassword', passwordData);
          toast.success('Password updated successfully');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Password change failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Update user XP (for real-time updates)
      updateUserXP: (xpData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              xp: xpData.newXP,
              level: xpData.newLevel
            }
          });
          
          if (xpData.leveledUp) {
            toast.success(`🎉 Level up! You're now level ${xpData.newLevel}!`, {
              duration: 6000,
              icon: '🎉'
            });
          }
        }
      },

      // Add badge to user
      addBadge: (badge) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              badges: [...currentUser.badges, badge]
            }
          });
          
          toast.success(`🏆 Badge earned: ${badge.name}!`, {
            duration: 6000,
            icon: '🏆'
          });
        }
      },

      // Update user stats
      updateUserStats: (stats) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              ...stats
            }
          });
        }
      }
    }),
    {
      name: 'skillbridge-auth',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);

export { useAuthStore };
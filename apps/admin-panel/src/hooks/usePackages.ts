import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export const useAdminPackages = () => {
    return useQuery({
        queryKey: ['admin-packages'],
        queryFn: async () => {
            const res = await api.get('/packages');
            return res.data || res;
        }
    });
};

export const useCreatePackage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/packages', data);
            return res.data || res;
        },
        onSuccess: () => {
            toast.success('Package created successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create package');
        }
    });
};

export const useUpdatePackage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/packages/${id}`, data);
            return res.data || res;
        },
        onSuccess: () => {
            toast.success('Package updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update package');
        }
    });
};

export const useDeletePackage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/packages/${id}`);
            return res.data || res;
        },
        onSuccess: () => {
            toast.success('Package deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-packages'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete package');
        }
    });
};

export const useAdminPackageInquiries = () => {
    return useQuery({
        queryKey: ['admin-package-inquiries'],
        queryFn: async () => {
            const res = await api.get('/packages/admin/inquiries');
            return Array.isArray(res) ? res : res.data || [];
        }
    });
};

export const useAssignVendorToInquiry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
            const res = await api.put(`/packages/admin/inquiries/${id}/assign`, { vendorId });
            return res.data || res;
        },
        onSuccess: () => {
            toast.success('Vendor assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-package-inquiries'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign vendor');
        }
    });
};

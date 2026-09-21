import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useVendorPackageInquiries = () => {
    return useQuery({
        queryKey: ['vendor-package-inquiries'],
        queryFn: async () => {
            const res: any = await api.get('/packages/vendor/inquiries');
            return Array.isArray(res) ? res : res.data || [];
        }
    });
};

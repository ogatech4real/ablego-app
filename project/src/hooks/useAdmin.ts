import { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { useAuth } from './useAuth';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeTrips: number;
  pendingVerifications: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error: any;
}

export const useAdmin = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await db.getDashboardOverview();

      if (error) {
        setError(error.message);
        return;
      }

      setStats({
        totalUsers: data?.total_riders + data?.total_drivers + data?.total_support_workers || 0,
        totalBookings: data?.total_bookings || 0,
        totalRevenue: data?.month_revenue || 0,
        activeTrips: data?.active_trips || 0,
        pendingVerifications: 0 // This would need to be calculated
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async (
    page = 1, 
    limit = 50, 
    filters?: { role?: string; search?: string }
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getAllUsers(page, limit, filters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getAllBookings = async (
    page = 1, 
    limit = 50, 
    filters?: { status?: string; dateFrom?: string; dateTo?: string }
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getAllBookings(page, limit, filters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getDriverApplications = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getDriverApplications(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getSupportWorkerApplications = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getSupportWorkerApplications(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const getVehicleRegistrations = async (
    page = 1, 
    limit = 50
  ): Promise<PaginatedResponse<any>> => {
    if (!isAdmin) {
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: 'Admin access required' }
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.getVehicleRegistrations(page, limit);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return {
        data: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        error: { message: errorMessage }
      };
    } finally {
      setLoading(false);
    }
  };

  const promoteUserToAdmin = async (userId: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.promoteUserToAdmin(userId);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const verifyVehicle = async (vehicleId: string, verified: boolean, notes?: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.verifyVehicle(vehicleId, verified, notes);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const verifySupportWorker = async (supportWorkerId: string, verified: boolean, notes?: string) => {
    if (!isAdmin) {
      return { data: null, error: { message: 'Admin access required' } };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await db.verifySupportWorker(supportWorkerId, verified, notes);
      
      if (result.error) {
        setError(result.error.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardStats();
    }
  }, [isAdmin]);

  return {
    stats,
    loading,
    error,
    loadDashboardStats,
    getAllUsers,
    getAllBookings,
    getDriverApplications,
    getSupportWorkerApplications,
    getVehicleRegistrations,
    promoteUserToAdmin,
    verifyVehicle,
    verifySupportWorker
  };
};
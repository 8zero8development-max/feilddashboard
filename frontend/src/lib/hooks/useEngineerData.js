import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../App';
import { 
  db, 
  seedDatabase, 
  getOfflineData, 
  addToMutationQueue, 
  updateLocalJob,
  MUTATION_TYPES,
  saveJobDraft,
  getJobDraft,
  deleteJobDraft,
} from '../db';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';

export function useEngineerJobs() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return useQuery({
    queryKey: ['engineer', 'jobs'],
    queryFn: async () => {
      if (!navigator.onLine) {
        const offlineData = await getOfflineData();
        return offlineData.jobs;
      }
      
      const response = await api.get('/jobs/my-jobs');
      await db.jobs.bulkPut(response.data);
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: async () => {
      const offlineData = await getOfflineData();
      return offlineData.jobs;
    },
  });
}

export function useEngineerLookups() {
  return useQuery({
    queryKey: ['engineer', 'lookups'],
    queryFn: async () => {
      if (!navigator.onLine) {
        return getOfflineData();
      }
      
      const [customersRes, sitesRes, assetsRes, partsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/sites'),
        api.get('/assets'),
        api.get('/parts'),
      ]);
      
      const data = {
        customers: customersRes.data,
        sites: sitesRes.data,
        assets: assetsRes.data,
        parts: partsRes.data,
      };
      
      await seedDatabase(data);
      return data;
    },
    staleTime: 1000 * 60 * 10,
    placeholderData: async () => {
      return getOfflineData();
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, status }) => {
      await updateLocalJob(jobId, { status });
      
      if (!navigator.onLine) {
        await addToMutationQueue({
          type: MUTATION_TYPES.UPDATE_JOB_STATUS,
          jobId,
          payload: { status },
        });
        return { offline: true, jobId, status };
      }
      
      const response = await api.put(`/jobs/${jobId}`, { status });
      return { offline: false, data: response.data };
    },
    onMutate: async ({ jobId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['engineer', 'jobs'] });
      
      const previousJobs = queryClient.getQueryData(['engineer', 'jobs']);
      
      queryClient.setQueryData(['engineer', 'jobs'], (old) => {
        if (!old) return old;
        return old.map((job) =>
          job.id === jobId ? { ...job, status } : job
        );
      });
      
      return { previousJobs };
    },
    onError: (err, variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['engineer', 'jobs'], context.previousJobs);
      }
      toast.error('Failed to update job status');
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast.warning('Saved to Outbox - will sync when online', {
          className: 'bg-amber-500',
        });
      } else {
        toast.success(`Job ${result.data?.status?.replace('_', ' ') || 'updated'}`);
      }
    },
    onSettled: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['engineer', 'jobs'] });
      }
    },
  });
}

export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, completionData }) => {
      await updateLocalJob(jobId, { status: 'completed' });
      
      if (!navigator.onLine) {
        await addToMutationQueue({
          type: MUTATION_TYPES.COMPLETE_JOB,
          jobId,
          payload: completionData,
        });
        await deleteJobDraft(jobId);
        return { offline: true, jobId };
      }
      
      const response = await api.post(`/jobs/${jobId}/complete`, completionData);
      await deleteJobDraft(jobId);
      return { offline: false, data: response.data };
    },
    onMutate: async ({ jobId }) => {
      await queryClient.cancelQueries({ queryKey: ['engineer', 'jobs'] });
      
      const previousJobs = queryClient.getQueryData(['engineer', 'jobs']);
      
      queryClient.setQueryData(['engineer', 'jobs'], (old) => {
        if (!old) return old;
        return old.map((job) =>
          job.id === jobId ? { ...job, status: 'completed' } : job
        );
      });
      
      return { previousJobs };
    },
    onError: (err, variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['engineer', 'jobs'], context.previousJobs);
      }
      toast.error('Failed to complete job');
    },
    onSuccess: (result) => {
      if (result.offline) {
        toast.warning('Job completion saved to Outbox - will sync when online', {
          className: 'bg-amber-500',
        });
      } else {
        toast.success('Job completed successfully!');
      }
    },
    onSettled: () => {
      if (navigator.onLine) {
        queryClient.invalidateQueries({ queryKey: ['engineer', 'jobs'] });
      }
    },
  });
}

export function useJobDraft(jobId) {
  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setDraft(null);
      setIsLoading(false);
      return;
    }

    getJobDraft(jobId).then((savedDraft) => {
      setDraft(savedDraft || null);
      setIsLoading(false);
    });
  }, [jobId]);

  const saveDraft = useCallback(async (draftData) => {
    if (!jobId) return;
    await saveJobDraft(jobId, draftData);
    setDraft({ jobId, ...draftData, lastUpdated: Date.now() });
  }, [jobId]);

  const clearDraft = useCallback(async () => {
    if (!jobId) return;
    await deleteJobDraft(jobId);
    setDraft(null);
  }, [jobId]);

  return { draft, saveDraft, clearDraft, isLoading };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

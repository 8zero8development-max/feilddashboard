import { api } from '../App';
import { 
  db, 
  getPendingMutations, 
  updateMutationStatus, 
  removeMutation,
  MUTATION_STATUS,
  MUTATION_TYPES,
} from './db';
import { toast } from 'sonner';

let isSyncing = false;

export async function processMutationQueue() {
  if (isSyncing || !navigator.onLine) return;
  
  isSyncing = true;
  
  try {
    const pendingMutations = await getPendingMutations();
    
    if (pendingMutations.length === 0) {
      isSyncing = false;
      return;
    }
    
    for (const mutation of pendingMutations) {
      try {
        await updateMutationStatus(mutation.id, MUTATION_STATUS.IN_PROGRESS);
        
        switch (mutation.type) {
          case MUTATION_TYPES.UPDATE_JOB_STATUS:
            await api.put(`/jobs/${mutation.jobId}`, mutation.payload);
            break;
            
          case MUTATION_TYPES.COMPLETE_JOB:
            await api.post(`/jobs/${mutation.jobId}/complete`, mutation.payload);
            break;
            
          default:
            console.warn('Unknown mutation type:', mutation.type);
        }
        
        await removeMutation(mutation.id);
        
      } catch (error) {
        console.error('Failed to sync mutation:', mutation, error);
        await updateMutationStatus(mutation.id, MUTATION_STATUS.FAILED);
      }
    }
    
    const remainingPending = await getPendingMutations();
    const syncedCount = pendingMutations.length - remainingPending.length;
    
    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} offline change${syncedCount > 1 ? 's' : ''}`);
    }
    
  } finally {
    isSyncing = false;
  }
}

export function initSyncManager() {
  window.addEventListener('online', () => {
    toast.info('Back online - syncing changes...');
    processMutationQueue();
  });
  
  if (navigator.onLine) {
    processMutationQueue();
  }
  
  setInterval(() => {
    if (navigator.onLine) {
      processMutationQueue();
    }
  }, 30000);
}

export async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'sync' in window.registration) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-job-completions');
    } catch (error) {
      console.warn('Background sync not available:', error);
    }
  }
}

export async function getMutationQueueCount() {
  const pending = await getPendingMutations();
  return pending.length;
}

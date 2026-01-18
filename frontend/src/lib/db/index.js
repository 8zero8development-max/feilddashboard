import Dexie from 'dexie';

export const db = new Dexie('CravenCoolingEngineerDB');

db.version(1).stores({
  jobs: 'id, job_number, customer_id, site_id, status, scheduled_date, assigned_engineer_id',
  customers: 'id, company_name',
  sites: 'id, customer_id, name',
  assets: 'id, site_id, name',
  parts: 'id, name, part_number',
  mutationQueue: '++id, type, jobId, timestamp, status, payload',
  jobDrafts: 'jobId, engineerNotes, travelTime, timeOnSite, checklistItems, partsUsed, photos, lastUpdated',
});

export const MUTATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const MUTATION_TYPES = {
  UPDATE_JOB_STATUS: 'UPDATE_JOB_STATUS',
  COMPLETE_JOB: 'COMPLETE_JOB',
};

export async function seedDatabase(data) {
  const { jobs, customers, sites, assets, parts } = data;
  
  await db.transaction('rw', [db.jobs, db.customers, db.sites, db.assets, db.parts], async () => {
    if (jobs?.length) {
      await db.jobs.bulkPut(jobs);
    }
    if (customers?.length) {
      await db.customers.bulkPut(customers);
    }
    if (sites?.length) {
      await db.sites.bulkPut(sites);
    }
    if (assets?.length) {
      await db.assets.bulkPut(assets);
    }
    if (parts?.length) {
      await db.parts.bulkPut(parts);
    }
  });
}

export async function getOfflineData() {
  const [jobs, customers, sites, assets, parts] = await Promise.all([
    db.jobs.toArray(),
    db.customers.toArray(),
    db.sites.toArray(),
    db.assets.toArray(),
    db.parts.toArray(),
  ]);
  
  return { jobs, customers, sites, assets, parts };
}

export async function addToMutationQueue(mutation) {
  return db.mutationQueue.add({
    ...mutation,
    timestamp: Date.now(),
    status: MUTATION_STATUS.PENDING,
  });
}

export async function getPendingMutations() {
  return db.mutationQueue
    .where('status')
    .equals(MUTATION_STATUS.PENDING)
    .sortBy('timestamp');
}

export async function updateMutationStatus(id, status) {
  return db.mutationQueue.update(id, { status });
}

export async function removeMutation(id) {
  return db.mutationQueue.delete(id);
}

export async function saveJobDraft(jobId, draftData) {
  return db.jobDrafts.put({
    jobId,
    ...draftData,
    lastUpdated: Date.now(),
  });
}

export async function getJobDraft(jobId) {
  return db.jobDrafts.get(jobId);
}

export async function deleteJobDraft(jobId) {
  return db.jobDrafts.delete(jobId);
}

export async function updateLocalJob(jobId, updates) {
  return db.jobs.update(jobId, updates);
}

export default db;

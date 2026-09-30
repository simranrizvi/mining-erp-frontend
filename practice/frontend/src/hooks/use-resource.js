'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { buildQueryString } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';

/**
 * Generic data-fetching + CRUD hook backing every module's list page.
 * Handles pagination/search/filter params, loading & error state, and
 * exposes create/update/remove helpers that talk to the real REST API —
 * every module page built on this hook is fully wired, not mocked.
 *
 * @param {string} endpoint - base API path, e.g. '/hr/employees'
 * @param {object} initialParams - initial query params (page, limit, search, ...)
 */
export function useResource(endpoint, initialParams = { page: 1, limit: 10 }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [params, setParams] = useState(initialParams);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`${endpoint}${buildQueryString(params)}`);
      setItems(Array.isArray(data.data) ? data.data : []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchList]);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }, []);

  const create = useCallback(
    async (payload, { path = '' } = {}) => {
      const { data } = await api.post(`${endpoint}${path}`, payload);
      toast({ title: 'Created successfully', variant: 'success' });
      await fetchList();
      return data.data;
    },
    [endpoint, fetchList, toast]
  );

  const update = useCallback(
    async (id, payload, { method = 'patch', path = '' } = {}) => {
      const { data } = await api[method](`${endpoint}/${id}${path}`, payload);
      toast({ title: 'Updated successfully', variant: 'success' });
      await fetchList();
      return data.data;
    },
    [endpoint, fetchList, toast]
  );

  const remove = useCallback(
    async (id) => {
      await api.delete(`${endpoint}/${id}`);
      toast({ title: 'Deleted successfully', variant: 'success' });
      await fetchList();
    },
    [endpoint, fetchList, toast]
  );

  const runAction = useCallback(
    async (fn, { successMessage = 'Action completed' } = {}) => {
      try {
        const result = await fn();
        toast({ title: successMessage, variant: 'success' });
        await fetchList();
        return result;
      } catch (err) {
        toast({ title: 'Action failed', description: getErrorMessage(err), variant: 'error' });
        throw err;
      }
    },
    [fetchList, toast]
  );

  return { items, meta, params, updateParams, isLoading, error, refetch: fetchList, create, update, remove, runAction };
}

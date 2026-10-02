import { useCallback } from 'react';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/apiFetch';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeWithSchedules } from '@template/shared';

export function useEmployees() {
  const { data: employees, loading, refetch } = useApi<Employee[]>('/employees');

  const create = useCallback(async (input: CreateEmployeeInput) => {
    await apiFetch('/employees', { method: 'POST', body: JSON.stringify(input) });
    refetch();
  }, [refetch]);

  const update = useCallback(async (id: string, input: UpdateEmployeeInput) => {
    await apiFetch(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
    refetch();
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    await apiFetch(`/employees/${id}`, { method: 'DELETE' });
    refetch();
  }, [refetch]);

  const getWithSchedules = useCallback(async () => {
    const { data } = await useApi<EmployeeWithSchedules[]>('/employees?withSchedules=true');
    return data;
  }, []);

  const getSchedules = useCallback(async (from: string, to: string) => {
    return apiFetch(`/employees/schedules?from=${from}&to=${to}`);
  }, []);

  return { employees: employees ?? [], loading, create, update, remove, refetch, getWithSchedules, getSchedules };
}
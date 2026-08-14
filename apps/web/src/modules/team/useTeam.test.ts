import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { useTeam } from './useTeam';

describe('useTeam', () => {
  it('loads the member list', async () => {
    server.use(
      http.get('/api/team', () =>
        HttpResponse.json([{ id: '1', businessId: 'b1', userId: 'u1', role: 'admin' }]),
      ),
    );

    const { result } = renderHook(() => useTeam());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.members).toHaveLength(1);
  });
});

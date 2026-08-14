import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/team', () => HttpResponse.json([])),
  http.get('/api/business', () =>
    HttpResponse.json({ id: 'b1', name: 'Demo', currencySymbol: '$', taxPercent: 0 }),
  ),
  http.get('/api/branches', () => HttpResponse.json([])),
];

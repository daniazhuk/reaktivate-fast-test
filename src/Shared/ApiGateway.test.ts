import ApiGateway, { HttpError } from './ApiGateway';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('ApiGateway', () => {
  it('sends GET to base url + path and parses json', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([{ id: 1 }]));
    const gateway = new ApiGateway('https://api.test/', fetchFn);

    await expect(gateway.get('/v1/books/me')).resolves.toEqual([{ id: 1 }]);
    expect(fetchFn).toHaveBeenCalledWith('https://api.test/v1/books/me', { method: 'GET' });
  });

  it('sends POST with a json payload', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }));
    const gateway = new ApiGateway('/api', fetchFn);

    await expect(gateway.post('/v1/books/me', { name: 'A', author: 'B' })).resolves.toEqual({ status: 'ok' });
    expect(fetchFn).toHaveBeenCalledWith('/api/v1/books/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', author: 'B' }),
    });
  });

  it('throws HttpError on non-2xx responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    const gateway = new ApiGateway('/api', fetchFn);

    const error = await gateway.get('/v1/books/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 500 });
  });
});

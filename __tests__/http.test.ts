/**
 * Tests du client HTTP avec fetch mocké.
 */
import {http} from '../src/core/api/http';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('http client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('envoie les en-têtes X-App-* et credentials omit, refuse Origin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({'x-request-id': 'req-1'}),
      text: async () => JSON.stringify({ok: true, data: {hello: 'world'}}),
    });

    const result = await http({
      path: '/health',
      headers: {Origin: 'https://evil.example', 'X-Custom': 'ok'},
    });

    expect(result.ok).toBe(true);
    const call = mockFetch.mock.calls[0];
    const opts = call[1] as RequestInit;
    expect(opts.credentials).toBe('omit');
    const headers = opts.headers as Record<string, string>;
    expect(headers['X-App-Platform']).toBe('android');
    expect(headers.Origin).toBeUndefined();
    expect(headers['X-Custom']).toBe('ok');
  });

  it('convertit une erreur réseau en network_error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const result = await http({path: '/test'});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('network_error');
      expect(result.status).toBe(0);
    }
  });

  it('gère un corps JSON invalide', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 200,
      headers: new Headers(),
      text: async () => 'not-json',
    });
    const result = await http({path: '/bad'});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid_json');
    }
  });

  it('détecte un 426 UPGRADE_REQUIRED', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 426,
      headers: new Headers(),
      text: async () => '',
    });
    const result = await http({path: '/session'});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UPGRADE_REQUIRED');
    }
  });
});

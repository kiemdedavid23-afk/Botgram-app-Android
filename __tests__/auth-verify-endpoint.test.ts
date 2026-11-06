import {verifyCode} from '../src/core/api/endpoints/auth';
import {http} from '../src/core/api/http';

jest.mock('../src/core/api/http', () => ({
  http: jest.fn(async () => ({ok: true, status: 200, data: {}})),
}));

const mockHttp = http as unknown as jest.Mock;

describe('endpoint /auth/code/verify', () => {
  beforeEach(() => mockHttp.mockClear());

  it('envoie les champs du chemin entreprise tels quels, en mode jeton « body »', async () => {
    const params = {
      email: 'a@b.co',
      code: '123456',
      account_type: 'company' as const,
      display_name: 'Awa',
      country: 'BF',
      usage: 'boutique',
      phone: '+22670123456',
      company_name: 'Ma société',
    };
    await verifyCode(params);
    expect(mockHttp).toHaveBeenCalledWith({
      method: 'POST',
      path: '/auth/code/verify',
      body: params,
      tokenModeBody: true,
    });
  });

  it('connexion simple : seulement e-mail et code', async () => {
    await verifyCode({email: 'a@b.co', code: '123456'});
    expect(mockHttp.mock.calls[0]?.[0].body).toEqual({
      email: 'a@b.co',
      code: '123456',
    });
  });
});

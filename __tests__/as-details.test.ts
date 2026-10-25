import {asDetails} from '../src/features/thread/store/retryErrors';

describe('asDetails', () => {
  it('absent / null / chaîne → undefined', () => {
    expect(asDetails(undefined)).toBeUndefined();
    expect(asDetails(null)).toBeUndefined();
    expect(asDetails('x')).toBeUndefined();
  });

  it('tableau → undefined', () => {
    expect(asDetails([1])).toBeUndefined();
  });

  it('objet → même objet', () => {
    const o = {retry_at: 1};
    expect(asDetails(o)).toBe(o);
  });
});

import {parseLatest, toUpdateLevel} from '../src/core/update/latest';
import {installStatusText} from '../src/features/update/statusText';
import {updateTexts as t} from '../src/features/update/texts';

describe('toUpdateLevel', () => {
  it('accepte optional et required, le reste vaut none', () => {
    expect(toUpdateLevel('optional')).toBe('optional');
    expect(toUpdateLevel('required')).toBe('required');
    for (const v of ['none', 'x', 1, null, undefined]) {
      expect(toUpdateLevel(v)).toBe('none');
    }
  });
});

describe('parseLatest', () => {
  it('objet complet', () => {
    expect(
      parseLatest({
        version_code: 12,
        version_name: '1.2.0',
        download_url: 'https://x.invalid/a.apk',
        sha256: 'ab',
        size_bytes: 10,
        notes: 'n',
      }),
    ).toEqual({
      version_code: 12,
      version_name: '1.2.0',
      download_url: 'https://x.invalid/a.apk',
      sha256: 'ab',
      size_bytes: 10,
      notes: 'n',
    });
  });

  it('ancien format : texte seul = version', () => {
    expect(parseLatest('1.1.0')).toEqual({version_name: '1.1.0'});
    expect(parseLatest('')).toBeUndefined();
  });

  it('valeurs invalides ignorées', () => {
    const r = parseLatest({version_code: 'x', size_bytes: NaN, sha256: ''});
    expect(r?.version_code).toBeUndefined();
    expect(r?.size_bytes).toBeUndefined();
    expect(r?.sha256).toBeUndefined();
    expect(parseLatest(null)).toBeUndefined();
    expect(parseLatest(5)).toBeUndefined();
  });
});

describe('installStatusText', () => {
  it('textes par phase', () => {
    expect(installStatusText('idle', 0, null)).toBeNull();
    expect(installStatusText('downloading', 0, null)).toBe(t.downloading(null));
    expect(installStatusText('downloading', 0.5, null)).toBe(t.downloading(50));
    expect(installStatusText('installing', 1, null)).toBe(t.installing);
    expect(installStatusText('needsPermission', 0, null)).toBe(t.needsPermission);
    expect(installStatusText('error', 0, 'boom')).toBe('boom');
  });
});

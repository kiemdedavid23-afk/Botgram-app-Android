import {botLink} from '../src/features/botprofile/utils/botLink';
import {
  validatePhoto,
  PHOTO_MAX_BYTES,
} from '../src/features/botprofile/utils/photo';

describe('botLink', () => {
  it('forme le lien à partir du pseudo, avec ou sans @', () => {
    expect(botLink('Digital_dsi_bot')).toBe('https://t.me/Digital_dsi_bot');
    expect(botLink('@Digital_dsi_bot')).toBe('https://t.me/Digital_dsi_bot');
  });
  it('renvoie null sans pseudo', () => {
    expect(botLink(null)).toBeNull();
    expect(botLink(undefined)).toBeNull();
    expect(botLink('  ')).toBeNull();
    expect(botLink('@')).toBeNull();
  });
});

describe('validatePhoto', () => {
  const ok = {uri: 'file:///a.jpg', name: 'a.jpg', mime: 'image/jpeg', size: 1000};
  it('accepte une image de taille raisonnable', () => {
    expect(validatePhoto(ok)).toBeNull();
  });
  it('refuse un fichier qui n\'est pas une image', () => {
    expect(validatePhoto({...ok, mime: 'application/pdf'})).toBe('not_image');
  });
  it('refuse une image trop lourde', () => {
    expect(validatePhoto({...ok, size: PHOTO_MAX_BYTES + 1})).toBe('too_large');
  });
  it('accepte un type MIME inconnu (sélecteur limité aux images)', () => {
    expect(validatePhoto({...ok, mime: ''})).toBeNull();
  });
});

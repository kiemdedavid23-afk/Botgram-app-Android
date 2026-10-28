import {kindFromMime} from '../src/features/thread/mediaLimits';

describe('kindFromMime — vidéo / audio / vocal', () => {
  it('mp4 → video', () => {
    expect(kindFromMime('video/mp4')).toBe('video');
  });

  it('autres vidéos (mkv, webm…) → document (Telegram les refuse en vidéo)', () => {
    expect(kindFromMime('video/x-matroska')).toBe('document');
    expect(kindFromMime('video/webm')).toBe('document');
  });

  it('mp3 / m4a → audio', () => {
    expect(kindFromMime('audio/mpeg')).toBe('audio');
    expect(kindFromMime('audio/mp4')).toBe('audio');
  });

  it('ogg / opus → voice', () => {
    expect(kindFromMime('audio/ogg')).toBe('voice');
    expect(kindFromMime('audio/opus')).toBe('voice');
  });

  it('wav, flac, inconnu → document', () => {
    expect(kindFromMime('audio/wav')).toBe('document');
    expect(kindFromMime('audio/flac')).toBe('document');
    expect(kindFromMime(undefined)).toBe('document');
  });
});

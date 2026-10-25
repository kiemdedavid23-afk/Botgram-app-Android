import {uuidV4} from '../src/core/utils/uuid';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidV4', () => {
  it('produit des UUID v4 valides sur plusieurs tirages', () => {
    for (let i = 0; i < 20; i += 1) {
      const id = uuidV4();
      expect(id).toMatch(UUID_V4_RE);
    }
  });
});

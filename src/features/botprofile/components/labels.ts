import type {TextField} from '../../../core/api/endpoints/botProfile.types';

export const TEXT_LABELS: Record<TextField, string> = {
  name: 'Nom',
  description: 'Description',
  short_description: 'Description courte',
};

export const FIELD_LIMITS: Record<TextField, number> = {
  name: 64,
  description: 512,
  short_description: 120,
};

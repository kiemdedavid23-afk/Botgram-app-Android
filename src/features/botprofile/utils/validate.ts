import type {LocalizedTexts, TextField} from '../../../core/api/endpoints/botProfile.types';
import {FIELD_LIMITS} from './labels';

export function validateField(
  field: TextField,
  value: string,
): string | null {
  const limit = FIELD_LIMITS[field];
  if (field === 'name') {
    const t = value.trim();
    if (t.length < 1) return 'Le nom est requis (1–64).';
    if (t.length > limit) return `Max ${limit} caractères.`;
  } else if (value.length > limit) {
    return `Max ${limit} caractères.`;
  }
  return null;
}

export function validateTexts(texts: LocalizedTexts): Partial<Record<TextField, string>> {
  const out: Partial<Record<TextField, string>> = {};
  for (const f of ['name', 'description', 'short_description'] as TextField[]) {
    const err = validateField(f, texts[f]);
    if (err) out[f] = err;
  }
  return out;
}

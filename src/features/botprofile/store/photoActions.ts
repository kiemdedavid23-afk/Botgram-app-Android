/**
 * Actions photo du bot (changer / supprimer) — met à jour le store profil.
 * Ne lève jamais : renvoie un résultat avec message prêt à afficher.
 */
import {
  deleteBotPhoto,
  setBotPhoto,
} from '../../../core/api/endpoints/botPhoto';
import type {HttpFailure} from '../../../core/api/http';
import {mapProfileError} from '../utils/errors';
import {validatePhoto, type PickedImage} from '../utils/photo';
import {useBotProfileStore} from './botProfileStore';
import {texts} from '../texts';

export type PhotoResult = {ok: true} | {ok: false; message: string};

function failureMessage(res: HttpFailure): string {
  if (res.status === 404 || res.status === 405) return texts.photoUnsupported;
  return mapProfileError(res.error.code);
}

export async function doDeletePhoto(botId: string): Promise<PhotoResult> {
  const res = await deleteBotPhoto(botId);
  if (!res.ok) return {ok: false, message: failureMessage(res)};
  useBotProfileStore.getState().setPhotoPresent(false);
  return {ok: true};
}

export async function doUploadPhoto(
  botId: string,
  file: PickedImage,
): Promise<PhotoResult> {
  const invalid = validatePhoto(file);
  if (invalid === 'not_image') return {ok: false, message: texts.photoNotImage};
  if (invalid === 'too_large') return {ok: false, message: texts.photoTooLarge};

  const form = new FormData();
  form.append('photo', {
    uri: file.uri,
    type: file.mime || 'image/jpeg',
    name: file.name || 'photo.jpg',
  } as unknown as Blob);
  const res = await setBotPhoto(botId, form);
  if (!res.ok) return {ok: false, message: failureMessage(res)};
  useBotProfileStore.getState().setPhotoPresent(true);
  return {ok: true};
}

import type {PickedFile} from '../store/sendMediaActions';

/** Un élément choisi dans le tiroir, prêt à être envoyé. */
export type SelectedItem = {
  /** `g:<id>` (galerie) ou `c:<nom>` (photo prise avec la caméra). */
  key: string;
  file: PickedFile;
  previewUri: string;
  type: 'photo' | 'video';
};

/**
 * Section active de l'espace membre (Tableau de bord / Profil / Gestion).
 * Dans un store pour que l'espace bot puisse ouvrir Profil ou Gestion
 * avant de revenir à l'espace membre.
 */
import {create} from 'zustand';

export type MemberSection = 'dashboard' | 'member' | 'gestion';

type State = {
  section: MemberSection;
  setSection: (section: MemberSection) => void;
};

export const useMemberSectionStore = create<State>(set => ({
  section: 'dashboard',
  setSection: section => set({section}),
}));

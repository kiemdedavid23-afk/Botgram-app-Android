/**
 * Un tableau de bord, un profil et un en-tête par type de compte.
 * Fichier profond : volontairement NON exporté par accounts/index (évite le cycle accounts ↔ auth).
 */
import React from 'react';
import {useAuthStore} from '../auth/store/authStore';
import {BrandBar} from '../../shared/components/BrandBar';
import {DashboardScreen} from '../dashboard/screens/DashboardScreen';
import {MemberProfileScreen} from '../member/screens/MemberProfileScreen';
import {accountTypeOf} from './accountType';
import {CompanyHeader, type CompanyHeaderProps} from './company/CompanyHeader';
import {CompanyDashboardScreen} from './company/CompanyDashboardScreen';
import {CompanyProfileScreen} from './company/CompanyProfileScreen';
import {InvitedDashboardScreen} from './invited/InvitedDashboardScreen';
import {InvitedProfileScreen} from './invited/InvitedProfileScreen';

function useType() {
  return accountTypeOf(useAuthStore(s => s.member));
}

/**
 * Entreprise : en-tête propre, sans la barre Botgram (salutation complète si `hello` est fourni,
 * barre compacte avec `right` sinon). Autres : barre Botgram.
 */
export function AccountHeader({
  right,
  hello,
}: {
  right?: React.ReactNode;
  hello?: CompanyHeaderProps['hello'];
}): React.JSX.Element {
  const type = useType();
  return type === 'company' ? (
    <CompanyHeader right={right} hello={hello} />
  ) : (
    <BrandBar title="Botgram" right={right} />
  );
}

export function AccountDashboard(props: {
  onAddBot: () => void;
  onOpenBot?: () => void;
  onOpenTeam?: () => void;
  onOpenGestion?: () => void;
  onOpenProfile?: () => void;
}): React.JSX.Element {
  const type = useType();
  if (type === 'company') return <CompanyDashboardScreen {...props} />;
  if (type === 'invited') {
    return <InvitedDashboardScreen onOpenBot={props.onOpenBot} onOpenTeam={props.onOpenTeam} />;
  }
  return <DashboardScreen onAddBot={props.onAddBot} onOpenBot={props.onOpenBot} />;
}

export function AccountProfile({onGoDashboard}: {onGoDashboard?: () => void}): React.JSX.Element {
  const type = useType();
  if (type === 'company') return <CompanyProfileScreen />;
  if (type === 'invited') return <InvitedProfileScreen />;
  return <MemberProfileScreen onGoDashboard={onGoDashboard} />;
}

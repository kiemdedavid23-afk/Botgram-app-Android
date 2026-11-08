/**
 * En-tête des pages Paramètres : ← Titre ⋮, style entreprise (voir FlowHeader).
 */
import React from 'react';
import {FlowHeader} from '../../accounts/company/components/FlowHeader';

type Props = {
  title: string;
  /** Absent = page racine (pas de flèche). */
  onBack?: () => void;
  /** Menu ⋮ éventuel. */
  right?: React.ReactNode;
};

export function SettingsHeader({title, onBack, right}: Props): React.JSX.Element {
  return <FlowHeader title={title} onBack={onBack} right={right} />;
}

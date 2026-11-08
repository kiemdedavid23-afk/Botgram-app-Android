/**
 * Page Paramètres : fond en dégradé + en-tête, style entreprise. Le contenu gère son défilement.
 */
import React from 'react';
import {FlowPage} from '../../accounts/company/components/FlowPage';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsPage({title, onBack, right, children}: Props): React.JSX.Element {
  return (
    <FlowPage title={title} onBack={onBack} right={right}>
      {children}
    </FlowPage>
  );
}

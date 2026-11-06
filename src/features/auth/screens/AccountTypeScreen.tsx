/**
 * Choix du type de compte, juste après le code e-mail d'une adresse inconnue.
 * Le choix est définitif : il est expliqué ici, avant le formulaire.
 */
import React, {useState} from 'react';
import {View, Text, Pressable} from 'react-native';
import type {AccountType} from '../../../core/api/endpoints/auth';
import {accountTypeEmoji, accountTypeLabel} from '../../accounts';
import {texts} from '../texts';
import {AuthLightScaffold} from '../components/AuthLightScaffold';
import {formStyles as s} from '../components/formStyles';

type Props = {
  offered: AccountType[];
  initial: AccountType;
  onChoose: (type: AccountType) => void;
  onBack: () => void;
};

const DESCRIPTIONS: Record<AccountType, string> = {
  personal: texts.typePersonalDesc,
  company: texts.typeCompanyDesc,
  invited: texts.typeInvitedDesc,
};

export function AccountTypeScreen({
  offered,
  initial,
  onChoose,
  onBack,
}: Props): React.JSX.Element {
  const [selected, setSelected] = useState<AccountType>(
    offered.includes(initial) ? initial : offered[0] ?? 'personal',
  );
  return (
    <AuthLightScaffold step={3} onBack={onBack}>
      <Text style={s.title} accessibilityRole="header">
        {texts.typeHeadline}
      </Text>
      <Text style={s.sub}>{texts.typeSub}</Text>

      {offered.map(type => {
        const on = type === selected;
        return (
          <Pressable
            key={type}
            style={[s.typeCard, on ? s.typeCardOn : null]}
            onPress={() => setSelected(type)}
            accessibilityRole="radio"
            accessibilityState={{selected: on}}>
            <Text style={s.typeEmoji}>{accountTypeEmoji(type)}</Text>
            <View style={s.typeBody}>
              <Text style={s.typeTitle}>{accountTypeLabel(type)}</Text>
              <Text style={s.typeDesc}>{DESCRIPTIONS[type]}</Text>
            </View>
          </Pressable>
        );
      })}

      <Pressable
        style={s.btn}
        onPress={() => onChoose(selected)}
        accessibilityRole="button">
        <Text style={s.btnText}>{texts.continue}</Text>
      </Pressable>
    </AuthLightScaffold>
  );
}

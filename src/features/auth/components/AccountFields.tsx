/** Champs propres à chaque type de compte. */
import React from 'react';
import {View, Text, TextInput} from 'react-native';
import {authColors} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {formatInviteCode} from '../utils/signup';
import {AuthField} from './AuthField';
import {formStyles as s} from './formStyles';
import type {FieldsProps} from './IdentityFields';

/** Particulier : organisation facultative. */
export function PersonalFields({
  form,
  patch,
  focus,
  setFocus,
}: FieldsProps): React.JSX.Element {
  return (
    <AuthField
      emoji="🏢"
      label={texts.organizationLabel}
      hint={texts.optional}
      focused={focus === 'org'}>
      <TextInput
        style={s.input}
        value={form.organization}
        onChangeText={v => patch({organization: v})}
        placeholder="Ma boutique, mon école…"
        placeholderTextColor={authColors.textMuted}
        selectionColor={authColors.accent}
        maxLength={80}
        onFocus={() => setFocus('org')}
        onBlur={() => setFocus(null)}
      />
    </AuthField>
  );
}

/** Entreprise : nom requis, secteur et téléphone facultatifs. */
export function CompanyFields({
  form,
  patch,
  errors,
  focus,
  setFocus,
  dial,
}: FieldsProps): React.JSX.Element {
  return (
    <>
      <AuthField
        emoji="🏢"
        label={texts.companyName}
        focused={focus === 'companyName'}
        error={errors.company_name}>
        <TextInput
          style={s.input}
          value={form.companyName}
          onChangeText={v => patch({companyName: v})}
          placeholder={texts.companyNameHint}
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          autoCapitalize="words"
          maxLength={80}
          onFocus={() => setFocus('companyName')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>
      <AuthField
        emoji="🏷️"
        label={texts.companySector}
        hint={texts.optional}
        focused={focus === 'companySector'}
        error={errors.company_sector}>
        <TextInput
          style={s.input}
          value={form.companySector}
          onChangeText={v => patch({companySector: v})}
          placeholder={texts.companySectorHint}
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          maxLength={60}
          onFocus={() => setFocus('companySector')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>
      <AuthField
        emoji="☎️"
        label={texts.companyPhone}
        hint={texts.optional}
        focused={focus === 'companyPhone'}
        error={errors.company_phone}>
        <View style={s.dial}>
          <Text style={s.dialText}>+{dial}</Text>
        </View>
        <TextInput
          style={s.input}
          value={form.companyPhone}
          onChangeText={v => patch({companyPhone: v})}
          placeholder="25 00 00 00"
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          keyboardType="phone-pad"
          onFocus={() => setFocus('companyPhone')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>
    </>
  );
}

/** Invité : code d'invitation, avec l'avertissement sur la lecture des messages. */
export function InviteFields({
  form,
  patch,
  errors,
  focus,
  setFocus,
}: FieldsProps): React.JSX.Element {
  return (
    <>
      <AuthField
        emoji="🔑"
        label={texts.inviteCode}
        focused={focus === 'invite'}
        error={errors.invite_code}>
        <TextInput
          style={s.input}
          value={form.inviteCode}
          onChangeText={v => patch({inviteCode: formatInviteCode(v)})}
          placeholder={texts.inviteCodeHint}
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={19}
          onFocus={() => setFocus('invite')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>
      <View style={s.noticeBox}>
        <Text style={s.noticeText}>{texts.invitedNotice}</Text>
      </View>
    </>
  );
}

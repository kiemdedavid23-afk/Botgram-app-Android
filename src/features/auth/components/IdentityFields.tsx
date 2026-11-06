/** Champs communs aux trois chemins : nom, pays, usage, téléphone. */
import React from 'react';
import {View, Text, TextInput, Pressable} from 'react-native';
import {ChevronDown} from 'lucide-react-native';
import {authColors} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {COUNTRIES, USAGES, USAGE_EMOJI, flagEmoji} from '../data/lists';
import type {SignupForm} from '../utils/signup';
import {AuthField} from './AuthField';
import {formStyles as s} from './formStyles';

export type FieldsProps = {
  form: SignupForm;
  patch: (p: Partial<SignupForm>) => void;
  errors: Record<string, string>;
  focus: string | null;
  setFocus: (f: string | null) => void;
  dial: string;
};

const cap = (v: string): string => v.charAt(0).toUpperCase() + v.slice(1);

type Props = FieldsProps & {onOpenCountry: () => void};

export function IdentityFields({
  form,
  patch,
  errors,
  focus,
  setFocus,
  dial,
  onOpenCountry,
}: Props): React.JSX.Element {
  const countryName =
    COUNTRIES.find(c => c.code === form.country)?.name ?? form.country;
  return (
    <>
      <AuthField
        emoji="👤"
        label={texts.displayName}
        focused={focus === 'name'}
        error={errors.display_name}>
        <TextInput
          style={s.input}
          value={form.displayName}
          onChangeText={v => patch({displayName: v})}
          placeholder={texts.displayNameHint}
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          autoCapitalize="words"
          maxLength={80}
          onFocus={() => setFocus('name')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>

      <AuthField emoji="🌍" label={texts.country}>
        <Pressable
          style={s.select}
          onPress={onOpenCountry}
          accessibilityRole="button">
          <Text style={s.selectText}>
            {flagEmoji(form.country)}  {countryName}
          </Text>
          <ChevronDown size={20} color={authColors.textMuted} />
        </Pressable>
      </AuthField>

      <View style={s.group}>
        <Text style={s.label}>🎯 {texts.usageQuestion}</Text>
        <View style={s.chips}>
          {USAGES.map(u => {
            const on = u === form.usage;
            return (
              <Pressable
                key={u}
                onPress={() => patch({usage: u})}
                style={[s.chip, on ? s.chipOn : null]}
                accessibilityRole="button"
                accessibilityState={{selected: on}}>
                <Text style={[s.chipText, on ? s.chipTextOn : null]}>
                  {USAGE_EMOJI[u]} {cap(u)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AuthField
        emoji="📱"
        label={texts.phone}
        focused={focus === 'phone'}
        error={errors.phone}>
        <View style={s.dial}>
          <Text style={s.dialText}>+{dial}</Text>
        </View>
        <TextInput
          style={s.input}
          value={form.phone}
          onChangeText={v => patch({phone: v})}
          placeholder="70 00 00 00"
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          keyboardType="phone-pad"
          onFocus={() => setFocus('phone')}
          onBlur={() => setFocus(null)}
        />
      </AuthField>
    </>
  );
}

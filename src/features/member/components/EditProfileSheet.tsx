/**
 * Feuille de modification profil — .mp-sheet (MemberProfilePage.css).
 * Champs = EDITABLE_FIELDS du site. PATCH /me via memberStore.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {X} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import {useMemberStore} from '../store/memberStore';
import type {PatchMeFields} from '../../../core/api/endpoints/member';
import {texts} from '../texts';
import {ProfileField} from './ProfileField';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type FormState = {
  display_name: string;
  organization: string;
  usage: string;
  country: string;
  phone: string;
};

export function EditProfileSheet({
  visible,
  onClose,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const member = useMemberStore(s => s.member);
  const saving = useMemberStore(s => s.saving);
  const fieldErrors = useMemberStore(s => s.fieldErrors);
  const updateProfile = useMemberStore(s => s.updateProfile);

  const [form, setForm] = useState<FormState>({
    display_name: '',
    organization: '',
    usage: '',
    country: '',
    phone: '',
  });
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && member) {
      setForm({
        display_name: member.display_name ?? '',
        organization: member.organization ?? '',
        usage: member.usage ?? '',
        country: member.country ?? '',
        phone: member.phone ?? '',
      });
      setGlobalError(null);
    }
  }, [visible, member]);

  const setField = (key: keyof FormState, value: string) => {
    setForm(f => ({...f, [key]: value}));
  };

  const onSave = async () => {
    setGlobalError(null);
    const fields: PatchMeFields = {
      display_name: form.display_name.trim(),
      organization: form.organization.trim(),
      usage: form.usage.trim() || undefined,
      country: form.country.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
    const result = await updateProfile(fields);
    if (result === 'ok') {
      onClose();
      return;
    }
    if (result === 'validation') return;
    setGlobalError(texts.errorGeneric);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {backgroundColor: colors.bgPrimary},
            getShadow('md', mode),
          ]}>
          <View style={styles.head}>
            <Text style={[styles.title, {color: colors.textPrimary}]}>
              {texts.editTitle}
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.close, {backgroundColor: colors.bgSecondary}]}
              hitSlop={8}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={[styles.hint, {color: colors.textHint}]}>
            {texts.editHint}
          </Text>
          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.bodyContent}>
            <ProfileField
              label={texts.labelName}
              value={form.display_name}
              onChange={v => setField('display_name', v)}
              placeholder={texts.placeholderName}
              error={fieldErrors.display_name}
            />
            <ProfileField
              label={texts.labelOrganization}
              value={form.organization}
              onChange={v => setField('organization', v)}
              placeholder={texts.placeholderOrganization}
              error={fieldErrors.organization}
            />
            <ProfileField
              label={texts.labelUsage}
              value={form.usage}
              onChange={v => setField('usage', v)}
              placeholder={texts.placeholderUsage}
              error={fieldErrors.usage}
            />
            <ProfileField
              label={texts.labelCountry}
              value={form.country}
              onChange={v => setField('country', v.toUpperCase().slice(0, 2))}
              placeholder={texts.selectCountry}
              error={fieldErrors.country}
              autoCapitalize="characters"
            />
            <Text style={[styles.countryHint, {color: colors.textHint}]}>Codes : BF, CI, ML, SN, NE, TG, BJ, GH, NG, CM, GN, FR, BE, CA, CH, US</Text>
            <ProfileField
              label={texts.labelPhone}
              value={form.phone}
              onChange={v => setField('phone', v)}
              placeholder={texts.placeholderPhone}
              error={fieldErrors.phone}
              keyboardType="phone-pad"
            />
            {globalError ? (
              <Text style={[styles.err, {color: colors.danger}]}>
                {globalError}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
              <Text style={[styles.btnText, {color: colors.textPrimary}]}>
                {texts.cancel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void onSave();
              }}
              disabled={saving}
              style={[styles.btn, {backgroundColor: colors.accent}]}>
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.btnText, {color: colors.white}]}>
                  {texts.save}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: m.sheetRadius,
    borderTopRightRadius: m.sheetRadius,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: m.sheetHeadPad,
    paddingHorizontal: m.sheetHeadPadH,
    paddingBottom: m.sheetHeadPadBottom,
  },
  title: {
    fontSize: m.sheetTitleSize,
    fontWeight: '700',
  },
  close: {
    width: m.sheetClose,
    height: m.sheetClose,
    borderRadius: m.sheetClose / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: m.sheetHintSize,
    paddingHorizontal: m.sheetBodyPadH,
    marginBottom: 4,
  },
  body: {
    maxHeight: 360,
  },
  bodyContent: {
    paddingHorizontal: m.sheetBodyPadH,
    paddingVertical: m.sheetBodyPadV,
    gap: m.sheetBodyGap,
  },
  field: {
    gap: m.fieldGap,
  },
  fieldLabel: {
    fontSize: m.fieldLabelSize,
    fontWeight: '600',
  },
  input: {
    height: m.fieldInputHeight,
    paddingHorizontal: m.fieldInputPadH,
    borderRadius: m.fieldInputRadius,
    borderWidth: m.fieldInputBorder,
    fontSize: m.fieldInputFont,
  },
  countryHint: {
    fontSize: 11,
    lineHeight: 16,
  },
  err: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: m.sheetActionsGap,
    paddingTop: m.sheetActionsPad,
    paddingHorizontal: m.sheetActionsPadH,
    paddingBottom: m.sheetActionsPadBottom,
  },
  btn: {
    flex: 1,
    height: m.btnHeight,
    borderRadius: m.btnRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: m.btnFont,
    fontWeight: '700',
  },
});

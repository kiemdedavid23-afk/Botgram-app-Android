/**
 * Sélecteur de pays — liste COUNTRY_CODES (site format.ts).
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useTheme, memberProfileMetrics as m} from '../../../shared/theme';
import {COUNTRY_CODES, countryLabel} from '../utils/format';
import {texts} from '../texts';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CountryPicker({
  visible,
  value,
  onSelect,
  onClose,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <View style={[styles.sheet, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            {texts.selectCountry}
          </Text>
          <FlatList
            data={[...COUNTRY_CODES]}
            keyExtractor={item => item}
            renderItem={({item}) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={[
                  styles.row,
                  item === value && {backgroundColor: colors.accentSoft},
                ]}>
                <Text style={{color: colors.textPrimary, fontSize: 16}}>
                  {countryLabel(item)}
                </Text>
              </Pressable>
            )}
          />
          <Pressable
            onPress={onClose}
            style={[styles.cancel, {backgroundColor: colors.bgSecondary}]}>
            <Text style={{color: colors.textPrimary, fontWeight: '600'}}>
              {texts.cancel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: m.sheetRadius,
    borderTopRightRadius: m.sheetRadius,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {paddingVertical: 14, paddingHorizontal: 20},
  cancel: {
    margin: 16,
    height: m.btnHeight,
    borderRadius: m.btnRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

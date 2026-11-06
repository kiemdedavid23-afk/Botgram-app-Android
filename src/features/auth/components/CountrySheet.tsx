import React from 'react';
import {View, Text, Pressable, ScrollView, Modal} from 'react-native';
import {texts} from '../texts';
import {COUNTRIES, flagEmoji} from '../data/lists';
import {formStyles as s} from './formStyles';

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CountrySheet({
  visible,
  selected,
  onSelect,
  onClose,
}: Props): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={s.sheet}>
        <View style={s.sheetCard}>
          <Text style={s.sheetTitle}>🌍 {texts.country}</Text>
          <ScrollView style={s.pickerScroll}>
            {COUNTRIES.map(c => (
              <Pressable
                key={c.code}
                style={s.sheetItem}
                onPress={() => onSelect(c.code)}>
                <Text
                  style={[
                    s.pickerItemText,
                    c.code === selected ? s.pickerItemOn : null,
                  ]}>
                  {flagEmoji(c.code)}  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={s.sheetClose} onPress={onClose}>
            <Text style={s.pickerClose}>{texts.closeSheet}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

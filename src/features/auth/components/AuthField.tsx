import React from 'react';
import {View, Text} from 'react-native';
import {formStyles as s} from './formStyles';

type Props = {
  emoji: string;
  label: string;
  hint?: string;
  focused?: boolean;
  error?: string;
  children: React.ReactNode;
};

/** Champ : libellé au-dessus, pastille emoji à gauche, bordure qui s'active au focus. */
export function AuthField({
  emoji,
  label,
  hint,
  focused,
  error,
  children,
}: Props): React.JSX.Element {
  return (
    <View style={s.group}>
      <Text style={s.label}>
        {label}
        {hint ? <Text style={s.labelHint}> · {hint}</Text> : null}
      </Text>
      <View
        style={[
          s.row,
          focused ? s.rowFocused : null,
          error ? s.rowError : null,
        ]}>
        <View style={s.bubble}>
          <Text style={s.bubbleEmoji}>{emoji}</Text>
        </View>
        {children}
      </View>
      {error ? <Text style={s.fieldError}>⚠️ {error}</Text> : null}
    </View>
  );
}

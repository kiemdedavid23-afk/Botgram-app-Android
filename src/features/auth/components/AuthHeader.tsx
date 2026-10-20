import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';

type Props = {title: string; onBack?: () => void};

export function AuthHeader({title, onBack}: Props): React.JSX.Element {
  return (
    <View style={styles.head}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
          <ArrowLeft size={24} color={authColors.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    height: authMetrics.headHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: authColors.bg,
  },
  back: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: authColors.text,
    marginRight: 36,
  },
});

import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {shellMetrics as sm} from '../../../shared/theme/shellMetrics';

type Props = {title: string; onBack?: () => void};

export function AuthHeader({title, onBack}: Props): React.JSX.Element {
  return (
    <View style={styles.head}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={sm.authBackHitSlop} style={styles.back}>
          <ArrowLeft size={sm.authBackIconSize} color={authColors.text} />
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
    paddingHorizontal: sm.authPadH,
    backgroundColor: authColors.bg,
  },
  back: {
    width: sm.backBtnSize,
    height: sm.backBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: sm.authTitleSize,
    fontWeight: sm.titleWeight,
    color: authColors.text,
    marginRight: sm.authTitleMarginRight,
  },
});

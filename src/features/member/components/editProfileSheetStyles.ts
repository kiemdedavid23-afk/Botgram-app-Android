import {StyleSheet} from 'react-native';
import {memberProfileMetrics as m} from '../../../shared/theme';

export const styles = StyleSheet.create({
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
  inputPressable: {
    justifyContent: 'center',
  },
  countryValue: {
    fontSize: m.fieldInputFont,
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

/**
 * Guide complet — page de lecture « Associer son bot Telegram à Botgram ».
 * Contenu embarqué (guideContent.ts) : lisible sans connexion.
 * Sommaire cliquable, barre de progression de lecture, ouverture possible
 * directement sur une section (ex. « Où trouver le jeton ? »).
 */
import React, {useCallback, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import {Info, AlertTriangle} from 'lucide-react-native';
import {
  useTheme,
  space,
  radii,
  fontSize,
  fontWeight,
} from '../../../shared/theme';
import {ScreenHeader} from '../../../shared/components/ScreenHeader';
import {texts} from '../texts';
import {
  GUIDE_INTRO,
  GUIDE_SECTIONS,
  type GuideBlock,
  type GuideSectionId,
} from '../guideContent';

type Props = {
  onBack: () => void;
  /** Section à afficher à l'ouverture (sinon, haut du guide). */
  section?: GuideSectionId;
};

const MONO = Platform.select({android: 'monospace', default: 'Menlo'});
const BODY_LINE = 23;
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

/** Texte avec **gras**, *italique* et `code`. */
function Inline({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}): React.JSX.Element {
  const {colors} = useTheme();
  const parts = text.split(INLINE_RE).filter(p => p !== '');
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <Text key={i} style={styles.bold}>
              <Inline text={part.slice(2, -2)} />
            </Text>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <Text
              key={i}
              style={[
                styles.inlineCode,
                {color: colors.accent, backgroundColor: colors.bgTertiary},
              ]}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <Text key={i} style={styles.italic}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

function Block({block}: {block: GuideBlock}): React.JSX.Element {
  const {colors} = useTheme();
  const body = [styles.body, {color: colors.textPrimary}];

  switch (block.t) {
    case 'p':
      return <Inline text={block.text} style={body} />;

    case 'h3':
      return (
        <Text style={[styles.h3, {color: colors.textPrimary}]}>
          {block.text}
        </Text>
      );

    case 'ul':
    case 'ol':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.item}>
              {block.t === 'ol' ? (
                <View style={[styles.num, {backgroundColor: colors.accentSoft}]}>
                  <Text style={[styles.numText, {color: colors.accent}]}>
                    {i + 1}
                  </Text>
                </View>
              ) : (
                <View style={[styles.dot, {backgroundColor: colors.accent}]} />
              )}
              <Inline text={item} style={[body, styles.itemText]} />
            </View>
          ))}
        </View>
      );

    case 'note': {
      const warn = block.tone === 'warn';
      const tint = warn ? colors.warn : colors.accent;
      const Icon = warn ? AlertTriangle : Info;
      return (
        <View
          style={[
            styles.note,
            {
              backgroundColor: warn ? colors.warn + '22' : colors.accentSoft,
              borderLeftColor: tint,
            },
          ]}>
          <View style={styles.noteHead}>
            <Icon size={18} color={tint} />
            {block.title ? (
              <Text style={[styles.noteTitle, {color: colors.textPrimary}]}>
                {block.title}
              </Text>
            ) : null}
          </View>
          <Inline text={block.text} style={body} />
        </View>
      );
    }

    case 'code':
      return (
        <View style={[styles.codeBox, {backgroundColor: colors.bgTertiary}]}>
          <Text selectable style={[styles.codeText, {color: colors.textPrimary}]}>
            {block.text}
          </Text>
        </View>
      );

    case 'table':
      return (
        <View style={[styles.table, {borderColor: colors.divider}]}>
          <View style={[styles.tr, {backgroundColor: colors.bgTertiary}]}>
            {block.head.map(h => (
              <Text
                key={h}
                style={[styles.th, {color: colors.textSecondary}]}>
                {h}
              </Text>
            ))}
          </View>
          {block.rows.map((row, r) => (
            <View
              key={r}
              style={[styles.tr, styles.trLine, {borderTopColor: colors.divider}]}>
              {row.map((cell, c) => (
                <Inline
                  key={c}
                  text={cell}
                  style={[styles.td, {color: colors.textPrimary}]}
                />
              ))}
            </View>
          ))}
        </View>
      );

    case 'faq':
      return (
        <View
          style={[
            styles.faq,
            {backgroundColor: colors.bgSecondary, borderColor: colors.divider},
          ]}>
          <Text style={[styles.faqQ, {color: colors.textPrimary}]}>
            {block.q}
          </Text>
          <Inline text={block.a} style={[body, {color: colors.textSecondary}]} />
        </View>
      );
  }
}

export function AssociateGuideScreen({
  onBack,
  section,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const ys = useRef<Partial<Record<GuideSectionId, number>>>({});
  const jumped = useRef(false);
  const [progress, setProgress] = React.useState(0);

  const goTo = useCallback((id: GuideSectionId, animated: boolean) => {
    const y = ys.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({y: Math.max(0, y - space.sm), animated});
    }
  }, []);

  const onSectionLayout = (id: GuideSectionId) => (e: LayoutChangeEvent) => {
    ys.current[id] = e.nativeEvent.layout.y;
    if (section && id === section && !jumped.current) {
      jumped.current = true;
      goTo(id, false);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    setProgress(max > 0 ? Math.min(1, Math.max(0, contentOffset.y / max)) : 0);
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScreenHeader title={texts.guideTitle} onBack={onBack} />
      <View style={[styles.track, {backgroundColor: colors.bgTertiary}]}>
        <View
          style={[
            styles.fill,
            {backgroundColor: colors.accent, width: `${progress * 100}%`},
          ]}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>
          {texts.guideHeading}
        </Text>
        <Text style={[styles.lead, {color: colors.textSecondary}]}>
          {GUIDE_INTRO}
        </Text>

        <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.tocTitle, {color: colors.textSecondary}]}>
            {texts.guideToc}
          </Text>
          {GUIDE_SECTIONS.map((s, i) => (
            <Pressable
              key={s.id}
              accessibilityRole="link"
              onPress={() => goTo(s.id, true)}
              style={styles.tocRow}>
              <Text style={[styles.tocNum, {color: colors.accent}]}>
                {i + 1}
              </Text>
              <Text style={[styles.tocText, {color: colors.textPrimary}]}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {GUIDE_SECTIONS.map((s, i) => (
          <View
            key={s.id}
            onLayout={onSectionLayout(s.id)}
            style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
            <Text style={[styles.h2, {color: colors.textPrimary}]}>
              <Text style={{color: colors.accent}}>{i + 1}. </Text>
              {s.title}
            </Text>
            {s.blocks.map((b, j) => (
              <Block key={j} block={b} />
            ))}
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[styles.done, {backgroundColor: colors.accent}]}>
          <Text style={[styles.doneText, {color: colors.white}]}>
            {texts.guideBack}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  track: {height: 3},
  fill: {height: 3},
  content: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.xl,
    gap: space.md,
  },
  title: {fontSize: fontSize.pageHeader + 2, fontWeight: fontWeight.bold},
  lead: {fontSize: fontSize.message, lineHeight: BODY_LINE},
  card: {
    borderRadius: radii.lg,
    padding: space.md,
    gap: space.sm + 4,
  },
  tocTitle: {
    fontSize: fontSize.sheetSectionLabel + 1,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    paddingVertical: space.xs + 2,
  },
  tocNum: {
    width: 22,
    fontSize: fontSize.message,
    fontWeight: fontWeight.bold,
  },
  tocText: {flex: 1, fontSize: fontSize.message, lineHeight: 21},
  h2: {fontSize: 19, fontWeight: fontWeight.bold, lineHeight: 26},
  h3: {
    fontSize: fontSize.msgDefault,
    fontWeight: fontWeight.semibold,
    marginTop: space.xs,
  },
  body: {fontSize: fontSize.message, lineHeight: BODY_LINE},
  bold: {fontWeight: fontWeight.bold},
  italic: {fontStyle: 'italic'},
  inlineCode: {fontFamily: MONO, fontSize: fontSize.message - 1},
  list: {gap: space.sm + 2},
  item: {flexDirection: 'row', alignItems: 'flex-start', gap: space.sm + 4},
  itemText: {flex: 1},
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numText: {fontSize: 13, fontWeight: fontWeight.bold},
  dot: {width: 6, height: 6, borderRadius: 3, marginTop: 9, marginHorizontal: 9},
  note: {
    borderRadius: radii.md,
    borderLeftWidth: 4,
    padding: space.md - 2,
    gap: space.sm,
  },
  noteHead: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  noteTitle: {fontSize: fontSize.message, fontWeight: fontWeight.bold},
  codeBox: {borderRadius: radii.md, padding: space.md - 2},
  codeText: {fontFamily: MONO, fontSize: 13, lineHeight: 20},
  table: {borderWidth: 1, borderRadius: radii.md, overflow: 'hidden'},
  tr: {flexDirection: 'row'},
  trLine: {borderTopWidth: 1},
  th: {
    flex: 1,
    padding: space.sm,
    fontSize: 12,
    fontWeight: fontWeight.semibold,
  },
  td: {flex: 1, padding: space.sm, fontSize: 13.5, lineHeight: 19},
  faq: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: space.md - 2,
    gap: space.xs + 2,
  },
  faqQ: {fontSize: fontSize.message, fontWeight: fontWeight.bold},
  done: {
    borderRadius: radii.md,
    paddingVertical: space.md - 2,
    alignItems: 'center',
  },
  doneText: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
});

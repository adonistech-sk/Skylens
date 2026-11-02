import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TYPE_NAMES } from '../../data/catalog';
import { tourFor } from '../../data/constellationTours';
import type { SkyObject } from '../../data/catalog';
import type { ObjectLocation } from '../../astronomy/locator';
import { press } from '../../design/components';
import { Icon } from '../../design/Icon';
import { color, font, type } from '../../design/tokens';
import { fovForMagnitude, MODE_LABELS } from '../../state/skyModes';
import { requestFocus, select, setSkyMode, toggleFavorite, useStore } from '../../state/store';
import { beginTour } from './tour';

interface Props {
  object: SkyObject;
  location: ObjectLocation;
  /** Directions to a target that is off screen. */
  guide: string | null;
  /** The object is fainter than this view draws. */
  tooFaint: boolean;
  /** Stepping through what is in view. Absent when there is nothing to step to. */
  onStep?: (offset: number) => void;
  onAddToList: () => void;
  /** Sits inside the panel rather than floating over the sky. */
  inline?: boolean;
}

function Action({ testID, icon, label, a11y, onPress, filled }: { testID: string; icon: 'target' | 'info' | 'star' | 'plus'; label: string; a11y: string; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.action, press(pressed)]} accessibilityRole="button" accessibilityLabel={a11y}>
      <Icon name={icon} size={18} tint={color.peach} filled={filled} /><Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

/** The one selection card. Over the sky it floats. In the panel it sits at the top. */
export function SelectionCard({ object: o, location, guide, tooFaint, onStep, onAddToList, inline }: Props) {
  const favorite = useStore((s) => s.favorites.includes(o.id));
  const open = () => router.push({ pathname: '/object/[id]', params: { id: o.id } });
  const tour = o.type === 'constellation' ? tourFor(o.id.slice(4)) : null;
  const showDeep = () => {
    setSkyMode('atlas');
    requestFocus(o.id, o.magnitude !== null ? fovForMagnitude(o.magnitude) : undefined);
  };
  return (
    <View style={[styles.card, inline && styles.inline]}>
      <View style={styles.head}>
        {onStep ? <Pressable testID="sky-prev" onPress={() => onStep(-1)} hitSlop={6} style={styles.step} accessibilityRole="button" accessibilityLabel="Previous object in view"><Icon name="back" size={18} tint={color.textSecondary} /></Pressable> : null}
        <Pressable testID="sky-selection" onPress={open} style={({ pressed }) => [styles.title, press(pressed)]} accessibilityRole="button" accessibilityLabel={`${o.name}. Open details.`}>
          <Text style={styles.name} numberOfLines={1}>{o.name}</Text>
          <Text style={type.caption} numberOfLines={2}>{TYPE_NAMES[o.type]} · {location.explanation}</Text>
          {guide ? <Text testID="sky-guide" style={styles.guide} numberOfLines={1}>{guide}</Text> : null}
        </Pressable>
        {onStep ? <Pressable testID="sky-next" onPress={() => onStep(1)} hitSlop={6} style={styles.step} accessibilityRole="button" accessibilityLabel="Next object in view"><Icon name="chevron" size={18} tint={color.textSecondary} /></Pressable> : null}
      </View>
      {tooFaint ? (
        <Pressable testID="sky-show-atlas" onPress={showDeep} style={({ pressed }) => [styles.faint, press(pressed)]} accessibilityRole="button" accessibilityLabel={`Too faint for this view. Show in ${MODE_LABELS.atlas}.`}>
          <Text style={styles.faintText}>Too faint for this view · Show in {MODE_LABELS.atlas}</Text>
        </Pressable>
      ) : null}
      {tour ? (
        <Pressable testID="sky-tour" onPress={() => beginTour(o.id.slice(4))} style={({ pressed }) => [styles.faint, press(pressed)]} accessibilityRole="button" accessibilityLabel={`Start a guided tour of ${o.name}, ${tour.stops.length} stops`}>
          <Text style={styles.faintText}>Guided exploration · {tour.stops.length} stops</Text>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Action testID="sky-locate" icon="target" label="Locate" a11y={`Center ${o.name}`} onPress={() => requestFocus(o.id)} />
        <Action testID="sky-learn" icon="info" label="Learn" a11y={`Learn about ${o.name}`} onPress={open} />
        <Action testID="sky-save" icon="star" filled={favorite} label={favorite ? 'Saved' : 'Save'} a11y={favorite ? `Remove ${o.name} from favorites` : `Save ${o.name} to favorites`} onPress={() => toggleFavorite(o.id)} />
        <Action testID="sky-add-list" icon="plus" label="List" a11y={`Add ${o.name} to a list`} onPress={onAddToList} />
        <Pressable testID="sky-deselect" onPress={() => select(null)} style={({ pressed }) => [styles.close, press(pressed)]} accessibilityRole="button" accessibilityLabel="Clear the selection" hitSlop={6}>
          <Icon name="close" size={16} tint={color.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, borderRadius: 18, backgroundColor: 'rgba(11,15,27,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  inline: { backgroundColor: 'rgba(255,255,255,0.04)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, paddingHorizontal: 2 },
  name: { fontFamily: font.serif, fontSize: 22, lineHeight: 26, color: color.text },
  guide: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17, color: color.peach, marginTop: 2 },
  step: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },
  faint: { marginTop: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: color.peachFill },
  faintText: { fontFamily: font.medium, fontSize: 12.5, color: color.peach, textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 42 },
  actionText: { fontFamily: font.medium, fontSize: 12.5, color: color.text },
  close: { width: 30, height: 42, alignItems: 'center', justifyContent: 'center' },
});

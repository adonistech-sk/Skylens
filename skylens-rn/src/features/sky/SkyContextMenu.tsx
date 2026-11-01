import { Pressable, StyleSheet, Text, View } from 'react-native';
import { compass16, constellationOf, mul, transpose, vectorEquatorial, vectorHorizontal } from '../../astronomy/core';
import { constellationName, object, TYPE_NAMES } from '../../data/catalog';
import { Icon } from '../../design/Icon';
import { color, font } from '../../design/tokens';
import { formatDec, formatRA } from '../../state/format';
import { HitContext } from './scene';
import { SkyPoint } from './SkyView';

const WIDTH = 256;

/** What a long press found: the objects under the finger, and where that point of sky is. */
export function SkyContextMenu({ point, frame, screen, onPick, onCentre, onClose }: {
  point: SkyPoint; frame: HitContext; screen: { width: number; height: number }; onPick: (id: string) => void; onCentre: () => void; onClose: () => void;
}) {
  const h = vectorHorizontal(point.direction);
  const eq = vectorEquatorial(mul(transpose(frame.moment.matrix), point.direction));
  const place = constellationName(constellationOf(eq));
  const hits = point.hits.map(object).filter((o) => o !== null);
  const height = 96 + hits.length * 48;
  const left = Math.min(screen.width - WIDTH - 14, Math.max(14, point.x - WIDTH / 2));
  const top = point.y - height - 26 > 70 ? point.y - height - 26 : Math.min(screen.height - height - 170, point.y + 26);
  return (
    <>
      <Pressable testID="sky-menu-backdrop" style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View testID="sky-menu" style={[styles.menu, { left, top }]} accessibilityViewIsModal>
        <Text style={styles.place} numberOfLines={1}>{place ?? 'Sky'}</Text>
        <Text style={styles.position}>{Math.round(h.altitude)}° high · {compass16(h.azimuth)} {Math.round(h.azimuth)}°</Text>
        <Text style={styles.position}>RA {formatRA(eq.raHours)} · Dec {formatDec(eq.decDeg)}</Text>
        {hits.map((o) => (
          <Pressable key={o.id} testID={`sky-menu-${o.name}`} onPress={() => onPick(o.id)} style={styles.row} accessibilityRole="button" accessibilityLabel={`Select ${o.name}`}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{o.name}</Text>
              <Text style={styles.kind} numberOfLines={1}>{TYPE_NAMES[o.type]}</Text>
            </View>
            <Icon name="chevron" size={16} tint={color.textSecondary} />
          </Pressable>
        ))}
        <Pressable testID="sky-menu-centre" onPress={onCentre} style={styles.row} accessibilityRole="button" accessibilityLabel="Center this point of the sky">
          <Icon name="target" size={18} tint={color.peach} />
          <Text style={styles.action}>Center here</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menu: { position: 'absolute', width: WIDTH, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: 'rgba(11,15,27,0.96)', borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  place: { fontFamily: font.serif, fontSize: 19, lineHeight: 24, color: color.text },
  position: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hairline },
  name: { fontFamily: font.medium, fontSize: 14, color: color.text },
  kind: { fontFamily: font.regular, fontSize: 12, color: color.textSecondary },
  action: { fontFamily: font.medium, fontSize: 14, color: color.text },
});

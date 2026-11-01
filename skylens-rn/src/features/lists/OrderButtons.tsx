import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../design/Icon';
import { color } from '../../design/tokens';

/** Up and down buttons, which work with VoiceOver where a drag handle wouldn't. */
export function OrderButtons({ name, onMove, first, last }: { name: string; onMove: (offset: number) => void; first: boolean; last: boolean }) {
  return (
    <View style={styles.order}>
      <Pressable disabled={first} onPress={() => onMove(-1)} hitSlop={4} style={[styles.orderButton, first && styles.off]} accessibilityRole="button" accessibilityLabel={`Move ${name} up`}>
        <View style={{ transform: [{ rotate: '-90deg' }] }}><Icon name="chevron" size={16} tint={color.textSecondary} /></View>
      </Pressable>
      <Pressable disabled={last} onPress={() => onMove(1)} hitSlop={4} style={[styles.orderButton, last && styles.off]} accessibilityRole="button" accessibilityLabel={`Move ${name} down`}>
        <View style={{ transform: [{ rotate: '90deg' }] }}><Icon name="chevron" size={16} tint={color.textSecondary} /></View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  order: { flexDirection: 'row' },
  orderButton: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.3 },
});

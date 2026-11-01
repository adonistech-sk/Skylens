import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../design/components';
import { color, type } from '../design/tokens';

export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: color.base }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
        <IconButton name="back" label="Back" glass={false} onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
        <Text style={type.title} accessibilityRole="header">Privacy</Text>
        <Text style={type.body}>SkyLens has no account, no analytics and no server of its own.</Text>
        <Text style={type.body}>Your location, favorites and settings stay on this iPhone. Location is used only to calculate the sky for where you are.</Text>
        <Text style={type.body}>The camera is used only for AR Sky. Nothing leaves your device, and a photo is saved only when you press the shutter.</Text>
        <Text style={type.body}>Purchases are handled by Apple. SkyLens receives only whether your subscription is active.</Text>
      </ScrollView>
    </View>
  );
}

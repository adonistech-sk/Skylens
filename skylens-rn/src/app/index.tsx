import { Redirect } from 'expo-router';
import { useStore } from '../state/store';

export default function Index() {
  const onboarded = useStore((s) => s.onboarded);
  const location = useStore((s) => s.location);
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!location) return <Redirect href="/location" />;
  return <Redirect href="/sky" />;
}

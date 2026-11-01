import { router } from 'expo-router';

/** Ends the location flow. A first run clears the stack, so Back can't reopen onboarding. */
export function leaveLocationFlow(first: boolean) {
  if (first) {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/sky');
  } else {
    router.dismissTo('/more');
  }
}

import { Stack } from 'expo-router';

import { RegisterProvider } from '@/components/register';
import { colors } from '@/constants/theme';

// The 4 Register steps share one form (see RegisterProvider), so going back keeps what was typed.
export default function RegisterLayout() {
  return (
    <RegisterProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
    </RegisterProvider>
  );
}

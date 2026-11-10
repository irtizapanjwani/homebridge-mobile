import { Redirect, Stack } from 'expo-router';

import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

// Screens for people who have applied but aren't members yet. Signed-in only; once someone has a
// membership number they go to the member tabs instead.
export default function ApplicantLayout() {
  const { ready, token, me } = useSession();
  if (!ready) return null;
  if (!token) return <Redirect href="/sign-in" />;
  if (me?.memberNo) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}

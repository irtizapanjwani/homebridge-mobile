import { router } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, TextInput, View } from "react-native";

import { OFFICE_WHATSAPP } from "@/components/applicant";
import {
  Checkbox,
  Field,
  Input,
  PasswordInput,
  Segment,
  TextLink,
} from "@/components/form";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { BackButton, Button, Screen, T } from "@/components/ui";
import { colors, fonts } from "@/constants/theme";
import { api } from "@/lib/api";
import { homeFor, useSession } from "@/lib/session";

type Mode = "password" | "code";

export default function SignIn() {
  // Same two ways as the website: password, or a 6-digit code emailed to you (no password needed).
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [note, setNote] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const session = useSession();

  const canSignIn = login.trim().length > 2 && password.length > 0 && !busy;

  // Checks the details with the API (same accounts as the website). Only a correct email /
  // membership number / phone + password gets in.
  const signIn = async () => {
    if (!canSignIn) return;
    setBusy(true);
    setError("");
    try {
      const me = await session.signIn(login.trim(), password, keep);
      router.replace(homeFor(me));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not sign you in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const sendCode = async () => {
    if (!emailOk || busy) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      await api("/api/auth/code", { body: { email: email.trim() } });
      setCodeSent(true);
      setCode("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send a code. Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  };

  const signInWithCode = async () => {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{ token: string; expiresAt: string }>(
        "/api/auth/code/verify",
        { body: { email: email.trim(), code } },
      );
      const me = await session.adopt(res.token, res.expiresAt, keep);
      router.replace(homeFor(me));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "That code is not right or has expired.",
      );
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setNote("");
  };

  return (
    <Screen edges={["top", "bottom"]} contentStyle={{ gap: 16 }}>
      <BackButton />

      <View style={styles.head}>
        <Logo size={64} />
        <T serif size={28} color={colors.green}>
          Welcome back
        </T>
        <T size={14} color={colors.muted} style={{ textAlign: "center" }}>
          Sign in to see your savings, projects and votes.
        </T>
      </View>

      <Segment
        value={mode}
        onChange={switchMode}
        options={[
          { key: "password", label: "Password" },
          { key: "code", label: "Email me a code" },
        ]}
      />

      {mode === "code" ? (
        <>
          {!codeSent ? (
            <>
              <T size={13} color={colors.muted}>
                We email you a 6-digit code. No password needed.
              </T>
              <Field label="Email you registered with">
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  onSubmitEditing={sendCode}
                />
              </Field>
            </>
          ) : (
            <>
              <T size={13} color={colors.inkSoft}>
                If{" "}
                <T size={13} weight="semibold">
                  {email.trim()}
                </T>{" "}
                belongs to an account, a code is on its way. It works for 10
                minutes.
              </T>
              <Field label="6-digit code">
                <TextInput
                  value={code}
                  onChangeText={(v) =>
                    setCode(v.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  placeholder="••••••"
                  placeholderTextColor={colors.inputBorder}
                  style={styles.code}
                  accessibilityLabel="6-digit code"
                  onSubmitEditing={signInWithCode}
                />
              </Field>
              <View style={styles.between}>
                <TextLink
                  label="Send a new code"
                  onPress={async () => {
                    await sendCode();
                    setNote(
                      "A new code is on its way. The old one no longer works.",
                    );
                  }}
                />
                <TextLink
                  label="Use a different email"
                  color={colors.muted}
                  onPress={() => {
                    setCodeSent(false);
                    setCode("");
                    setError("");
                    setNote("");
                  }}
                />
              </View>
            </>
          )}
          <Checkbox checked={keep} onPress={() => setKeep(!keep)}>
            <T size={13}>Keep me signed in</T>
          </Checkbox>
          {note ? (
            <T size={13} color={colors.green}>
              {note}
            </T>
          ) : null}
          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <T size={13} color="#9A3B26">
                {error}
              </T>
            </View>
          ) : null}
          {!codeSent ? (
            <Button
              label={busy ? "Sending…" : "Email me a code"}
              variant={emailOk && !busy ? "primary" : "disabled"}
              onPress={sendCode}
            />
          ) : (
            <Button
              label={busy ? "Signing in…" : "Sign in"}
              variant={code.length === 6 && !busy ? "primary" : "disabled"}
              onPress={signInWithCode}
            />
          )}
        </>
      ) : (
        <>
          <Field label="Member ID, email or phone">
            <Input
              value={login}
              onChangeText={setLogin}
              placeholder="Email, HBC- number or phone"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />
          </Field>

          <Field label="Password">
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              autoComplete="password"
              onSubmitEditing={canSignIn ? signIn : undefined}
            />
          </Field>

          <View style={styles.between}>
            <Checkbox checked={keep} onPress={() => setKeep(!keep)}>
              <T size={13}>Keep me signed in</T>
            </Checkbox>
            <TextLink
              label="Forgot password?"
              onPress={() => router.push("/forgot-password")}
            />
          </View>

          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <T size={13} color="#9A3B26">
                {error}
              </T>
            </View>
          ) : null}

          <Button
            label={busy ? "Signing in…" : "Sign in"}
            variant={canSignIn ? "primary" : "disabled"}
            onPress={signIn}
          />
        </>
      )}

      <View
        style={{
          marginTop: "auto",
          gap: 10,
          alignItems: "center",
          paddingTop: 16,
        }}
      >
        <T size={13}>
          New to HomeBridge?{" "}
          <TextLink
            label="Become a member"
            onPress={() => router.replace("/")}
          />
        </T>
        <View style={[styles.between, { gap: 6, justifyContent: "center" }]}>
          <Icon name="chat" size={16} color={colors.muted} strokeWidth={1.8} />
          <T size={12} color={colors.muted}>
            Trouble signing in?{" "}
            <TextLink
              label="Help on WhatsApp"
              size={12}
              color={colors.muted}
              onPress={() => Linking.openURL(OFFICE_WHATSAPP)}
            />
          </T>
        </View>
        <T size={11} color={colors.muted} style={{ textAlign: "center" }}>
          Member-owned · one member, one vote · managed by VEKAT Group Ltd
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", gap: 6, marginBottom: 8 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  code: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    backgroundColor: colors.white,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 24,
    letterSpacing: 10,
    color: colors.ink,
  },
  error: {
    backgroundColor: "#FDF1EC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0D3C7",
  },
});

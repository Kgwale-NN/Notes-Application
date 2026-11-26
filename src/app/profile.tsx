import { router, usePreventRemove } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import FormField from "@/components/FormField";
import GlassIconButton from "@/components/GlassIconButton";
import { notesColors } from "@/constants/notes-theme";
import { useNotes } from "@/hooks/use-notes";
import type { UserProfile } from "@/types/account";

function profileForm(profile: UserProfile) {
  return {
    username: profile.username,
    email: profile.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export default function ProfileScreen() {
  const { profile } = useNotes();
  return profile ? <ProfileForm key={profile.id} profile={profile} /> : null;
}

function ProfileForm({ profile }: { profile: UserProfile }) {
  const { saving, signOut, updateProfile } = useNotes();
  const [form, setForm] = useState(() => profileForm(profile));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const busy = saving || signingOut;
  const changed = form.username.trim() !== profile.username ||
    form.email.trim().toLowerCase() !== profile.email ||
    form.newPassword !== "" ||
    form.confirmPassword !== "";

  usePreventRemove(saving);

  function changeField(field: keyof typeof form, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
    setError("");
    setSaved(false);
  }

  async function saveProfile() {
    if (busy || !changed) return;
    if (form.newPassword !== form.confirmPassword) {
      setError("Your new passwords do not match.");
      return;
    }

    Keyboard.dismiss();
    setError("");
    try {
      const { username, email, currentPassword, newPassword } = form;
      const updated = await updateProfile({ username, email, currentPassword, newPassword });
      setForm(profileForm(updated));
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your profile could not be saved.");
    }
  }

  function handleSignOut() {
    if (busy) return;

    Keyboard.dismiss();
    setSigningOut(true);
    // Give the loading state one frame to paint before the session closes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        signOut();
        setSigningOut(false);
      });
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassIconButton
            label="Go back"
            icon="chevronLeft"
            disabled={busy}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/categories")}
          />
          <Text accessibilityRole="header" style={styles.heading}>Profile</Text>
          <FormField
            label="Username"
            value={form.username}
            onChangeText={value => changeField("username", value)}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!busy}
          />
          <FormField
            label="Email"
            value={form.email}
            onChangeText={value => changeField("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!busy}
          />
          <FormField
            label="Current password"
            value={form.currentPassword}
            onChangeText={value => changeField("currentPassword", value)}
            autoComplete="current-password"
            autoCapitalize="none"
            secureTextEntry
            editable={!busy}
          />
          <FormField
            label="New password (optional)"
            value={form.newPassword}
            onChangeText={value => changeField("newPassword", value)}
            autoComplete="new-password"
            autoCapitalize="none"
            secureTextEntry
            editable={!busy}
          />
          {form.newPassword || form.confirmPassword ? (
            <FormField
              label="Confirm new password"
              value={form.confirmPassword}
              onChangeText={value => changeField("confirmPassword", value)}
              autoComplete="new-password"
              autoCapitalize="none"
              secureTextEntry
              editable={!busy}
            />
          ) : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {saved ? <Text accessibilityLiveRegion="polite" style={styles.status}>Profile updated.</Text> : null}
          <AppButton
            title={saving ? "Saving profile…" : "Save changes"}
            onPress={saveProfile}
            loading={saving}
            disabled={!changed || signingOut}
          />
          <AppButton
            title={signingOut ? "Logging out…" : "Log out"}
            variant="secondary"
            disabled={saving}
            loading={signingOut}
            onPress={handleSignOut}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notesColors.background },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 24, paddingTop: 12, gap: 16 },
  heading: { fontSize: 34, fontWeight: "700", color: notesColors.text },
  error: { fontSize: 15, color: "#B42318" },
  status: { fontSize: 15, color: notesColors.text },
});

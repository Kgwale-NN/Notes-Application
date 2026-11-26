import { useRef, useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import FormField from "@/components/FormField";
import { notesColors } from "@/constants/notes-theme";

import { useNotes } from "@/hooks/use-notes";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { signIn } = useNotes();
    const submitting = useRef(false);
    const [busy, setBusy] = useState(false);

    async function handleLogin() {
        if (submitting.current) return;
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        submitting.current = true;
        setBusy(true);
        try {
            await signIn(email, password);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to log in.");
        } finally {
            submitting.current = false;
            setBusy(false);
        }
    }

    function goBack() {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    }

    return (
        <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        accessibilityRole="button"
                        onPress={goBack}
                        disabled={busy}
                        style={styles.backButton}
                    >
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>

                    <Text style={styles.title}>Welcome back</Text>

                    <Text style={styles.subtitle}>
                        Your thoughts are waiting for you.
                    </Text>

                    <View style={styles.form}>
                        <FormField
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                        />

                        <FormField
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="current-password"
                        />

                        {error !== "" && (
                            <Text accessibilityRole="alert" style={styles.error}>
                                {error}
                            </Text>
                        )}

                        <AppButton
                            title={busy ? "Logging in…" : "Log in"}
                            loading={busy}
                            onPress={handleLogin}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Don’t have an account?
                        </Text>

                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.replace("/register")}
                            disabled={busy}
                            style={styles.footerButton}
                        >
                            <Text style={styles.footerLink}>Create account</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: notesColors.background,
    },
    keyboard: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
    },
    backButton: {
        minHeight: 44,
        alignSelf: "flex-start",
        justifyContent: "center",
        marginBottom: 24,
    },
    backText: {
        fontSize: 16,
        color: notesColors.text,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: notesColors.text,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: notesColors.muted,
        marginTop: 8,
    },
    form: {
        marginTop: 32,
        gap: 20,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
        color: "#B42318",
    },
    footer: {
        marginTop: "auto",
        paddingTop: 48,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 6,
    },
    footerText: {
        fontSize: 14,
        color: notesColors.text,
    },
    footerButton: {
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: "600",
        color: notesColors.text,
        textDecorationLine: "underline",
    },
});

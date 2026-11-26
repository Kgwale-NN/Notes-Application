import { useState } from "react";
import { router } from "expo-router";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerAccount } from "@/services/accountService";
import { authFeedbackDelay } from "@/services/authFeedback";

import AppButton from "@/components/AppButton";
import FormField from "@/components/FormField";
import { notesColors } from "@/constants/notes-theme";

export default function RegisterScreen() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleRegister() {
        if (isSubmitting) {
            return;
        }

        setError("");

        if (!username.trim() || !email.trim() || !password || !confirmPassword) {
            setError("Please fill in every field.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            await Promise.all([
                registerAccount({ username, email, password }),
                authFeedbackDelay(),
            ]);

            setPassword("");
            setConfirmPassword("");

            router.replace("/login");

            Alert.alert(
                "Account created",
                "Your account is saved on this device. You can now log in."
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "We could not create your account. Please try again."
            );
        } finally {
            setIsSubmitting(false);
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
                        style={styles.backButton}
                    >
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>

                    <Text style={styles.title}>Create account</Text>

                    <Text style={styles.subtitle}>
                        A little space for your thoughts.
                    </Text>

                    <View style={styles.form}>
                        <FormField
                            label="Username"
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="username"
                            editable={!isSubmitting}
                        />

                        <FormField
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            editable={!isSubmitting}
                        />

                        <FormField
                            label="Password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="new-password"
                            editable={!isSubmitting}
                        />

                        <FormField
                        editable={!isSubmitting}
                            label="Confirm password"
                            placeholder="Enter your password again"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="new-password"
                            
                        />



                        {error !== "" && (
                            <Text accessibilityRole="alert" style={styles.error}>
                                {error}
                            </Text>
                        )}

                        <AppButton
                            title={isSubmitting ? "Creating account…" : "Create account"}
                            onPress={handleRegister}
                            loading={isSubmitting}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account?</Text>

                        <Pressable
                            accessibilityRole="button"
                            onPress={() => router.replace("/login")}
                            style={styles.footerButton}
                        >
                            <Text style={styles.footerLink}>Log in</Text>
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
        paddingBottom: 32,
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

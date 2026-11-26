import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { notesColors } from "@/constants/notes-theme";

type AppButtonProps = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
    loading?: boolean;
};

export default function AppButton({
    title,
    onPress,
    variant = "primary",
    disabled = false,
    loading = false,
}: AppButtonProps) {
    const unavailable = disabled || loading;

    return (

        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={unavailable}
            accessibilityState={{ disabled: unavailable, busy: loading }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                variant === "primary"
                    ? styles.primary
                    : styles.secondary,
                pressed && styles.pressed,
                disabled && !loading && styles.disabled,
            ]}
        >
            {loading && <ActivityIndicator size="small" color={notesColors.text} />}
            <Text style={styles.title}>{title}</Text>
        </Pressable>

    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 52,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 28,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    primary: {
        backgroundColor: notesColors.accent,
    },
    secondary: {
        backgroundColor: notesColors.border,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: notesColors.text,
        textAlign: "center",
    },
    pressed: {
        opacity: 0.7,
    },

    disabled: {
        opacity: 0.5,
    },

});

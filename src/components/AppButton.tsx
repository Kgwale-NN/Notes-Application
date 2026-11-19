import { Pressable, StyleSheet, Text } from "react-native";

import { notesColors } from "@/constants/notes-theme";

type AppButtonProps = {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
};

export default function AppButton({ title, onPress, variant = "primary", disabled = false, }: AppButtonProps) {

    return (

        <Pressable
            accessibilityRole="button"
            disabled={disabled}
            accessibilityState={{ disabled }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                variant === "primary"
                    ? styles.primary
                    : styles.secondary,
                pressed && styles.pressed, disabled && styles.disabled,
            ]}
        >
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
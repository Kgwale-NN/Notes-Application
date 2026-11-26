import { useState } from "react";
import {Pressable,StyleSheet,Text,TextInput,View,type TextInputProps,} from "react-native";

import { notesColors } from "@/constants/notes-theme";

type FormFieldProps = TextInputProps & {
  label: string;
};

export default function FormField({label,secureTextEntry = false, style, ...inputProps}: FormFieldProps) {

  const [passwordVisible, setPasswordVisible] = useState(false);

  return (

    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputBox}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && !passwordVisible}
          placeholderTextColor={notesColors.muted}
          style={[styles.input, style]}
        />

        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? "Hide password" : "Show password"
            }
            onPress={() => setPasswordVisible(current => !current)}
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityText}>
              {passwordVisible ? "Hide" : "Show"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: notesColors.text,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: notesColors.border,
    borderRadius: 14,
    backgroundColor: notesColors.surface,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: notesColors.text,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  visibilityButton: {
    minWidth: 52,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  visibilityText: {
    fontSize: 13,
    fontWeight: "600",
    color: notesColors.text,
  },
});

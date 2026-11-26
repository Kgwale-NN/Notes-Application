import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";

import { notesColors } from "@/constants/notes-theme";

const icons = {
  plus: { ios: "plus", android: "add", web: "add" },
  chevronLeft: {
    ios: "chevron.left",
    android: "chevron_left",
    web: "chevron_left",
  },
  chevronRight: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
} satisfies Record<string, ComponentProps<typeof SymbolView>["name"]>;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export default function AppIcon({
  name,
  size = 20,
  color = notesColors.text,
}: AppIconProps) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}

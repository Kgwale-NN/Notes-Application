import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@notes-application:";

export async function saveData(key: string, value: unknown) {
  const text = JSON.stringify(value);

  if (text === undefined) {
    throw new Error("This value cannot be saved.");
  }

  await AsyncStorage.setItem(PREFIX + key, text);
}

export async function readData(key: string): Promise<unknown> {
  const text = await AsyncStorage.getItem(PREFIX + key);

  if (text === null) {
    return null;
  }

  return JSON.parse(text);
}

export async function removeData(key: string) {
  await AsyncStorage.removeItem(PREFIX + key);
}
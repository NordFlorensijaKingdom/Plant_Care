import React from "react";
import { Stack } from "expo-router";

export const unstable_settings = { initialRouteName: "index" };

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="today" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="add" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

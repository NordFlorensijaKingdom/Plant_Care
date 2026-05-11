import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ColorPicker, {
  HueSlider,
  OpacitySlider,
  Panel1,
  Preview,
} from "reanimated-color-picker";

import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

function isValidHex(h: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(h);
}

function normalizeHex(h: string): string {
  const clean = h.replace(/[^0-9A-Fa-f]/g, "");
  if (clean.length === 3) {
    return (
      "#" +
      clean
        .split("")
        .map((c) => c + c)
        .join("")
    ).toUpperCase();
  }
  if (clean.length === 6) return "#" + clean.toUpperCase();
  return h;
}

interface Props {
  visible: boolean;
  initialColor: string;
  title?: string;
  onClose: () => void;
  onConfirm: (hex: string) => void;
}

export function ColorPickerModal({
  visible,
  initialColor,
  title = "Pick a Color",
  onClose,
  onConfirm,
}: Props) {
  const colors = useColors();
  const theme = useTheme();
  const [pickedHex, setPickedHex] = useState(initialColor);
  const [hexInput, setHexInput] = useState(initialColor.toUpperCase());
  const [hexError, setHexError] = useState(false);

  const handleColorChange = useCallback(
    ({ hex }: { hex: string }) => {
      const upper = hex.toUpperCase();
      setPickedHex(upper);
      setHexInput(upper);
      setHexError(false);
    },
    []
  );

  function handleHexInput(text: string) {
    const formatted = text.startsWith("#") ? text : "#" + text;
    setHexInput(formatted.toUpperCase());
    setHexError(false);
  }

  function applyHexInput() {
    const normalized = normalizeHex(hexInput);
    if (isValidHex(normalized)) {
      setPickedHex(normalized);
      setHexInput(normalized);
      setHexError(false);
    } else {
      setHexError(true);
    }
  }

  function handleConfirm() {
    onConfirm(pickedHex);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textColor }]}>{title}</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.doneBtn, { backgroundColor: theme.uiColor }]}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Color Picker */}
          <ColorPicker
            value={pickedHex}
            onComplete={handleColorChange}
            style={styles.picker}
          >
            {/* 2D Saturation / Brightness panel */}
            <Panel1
              style={styles.panel}
              thumbSize={24}
              thumbShape="circle"
            />
            {/* Hue slider */}
            <HueSlider
              style={styles.slider}
              thumbSize={22}
              thumbShape="circle"
            />
            {/* Opacity slider */}
            <OpacitySlider
              style={styles.slider}
              thumbSize={22}
              thumbShape="circle"
            />
          </ColorPicker>

          {/* Hex input + live swatch */}
          <View style={styles.hexRow}>
            <View
              style={[styles.hexSwatch, { backgroundColor: pickedHex }]}
            />
            <View
              style={[
                styles.hexInputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: hexError ? "#E53E3E" : colors.border,
                },
              ]}
            >
              <Text style={[styles.hashSign, { color: colors.mutedForeground }]}>
                #
              </Text>
              <TextInput
                style={[styles.hexInput, { color: theme.textColor }]}
                value={hexInput.replace(/^#/, "")}
                onChangeText={(t) => handleHexInput(t)}
                onEndEditing={applyHexInput}
                onSubmitEditing={applyHexInput}
                placeholder="2D6A4F"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={7}
                returnKeyType="done"
              />
            </View>
            {hexError && (
              <Text style={styles.errorText}>Invalid hex</Text>
            )}
          </View>

          {/* Live preview */}
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.previewDot, { backgroundColor: pickedHex }]} />
            <View style={styles.previewLines}>
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: pickedHex, width: "70%" },
                ]}
              />
              <View
                style={[
                  styles.previewLine,
                  { backgroundColor: pickedHex + "60", width: "45%", height: 6 },
                ]}
              />
            </View>
            <Ionicons name="leaf" size={18} color={pickedHex} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4, minWidth: 64 },
  cancelText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  doneText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  body: { flex: 1, padding: 20, gap: 16 },
  picker: { gap: 14 },
  panel: {
    height: 220,
    borderRadius: 14,
    overflow: "hidden",
  },
  slider: {
    borderRadius: 10,
    overflow: "hidden",
    height: 34,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hexSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  hexInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 4,
  },
  hashSign: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  hexInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  previewDot: { width: 38, height: 38, borderRadius: 10 },
  previewLines: { flex: 1, gap: 6 },
  previewLine: { height: 8, borderRadius: 4 },
});

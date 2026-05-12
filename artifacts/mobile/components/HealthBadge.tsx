import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { HEALTH_STATUS_CONFIG, HealthStatus } from "@/context/PlantContext";

interface HealthBadgeProps {
  status: HealthStatus;
  size?: "sm" | "md";
}

export function HealthBadge({ status, size = "sm" }: HealthBadgeProps) {
  const config = HEALTH_STATUS_CONFIG[status];
  const isSmall = size === "sm";
  const Icon = config.Icon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color + "20",
          borderColor: config.color + "40",
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          gap: isSmall ? 3 : 5,
        },
      ]}
    >
      <Icon size={isSmall ? 10 : 13} color={config.color} />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
});

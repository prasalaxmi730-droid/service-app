import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

const statusColor = {
  PENDING: theme.colors.warning,
  OPEN: theme.colors.warning,
  COMPLETED: theme.colors.success,
};

const normalizeStatus = status => (status === "OPEN" ? "PENDING" : status || "PENDING");

export default function ServiceCallDetailScreen({ route, navigation }) {
  const { call } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{call.customer_name}</Text>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${statusColor[normalizeStatus(call.status)] || theme.colors.primary}22`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColor[normalizeStatus(call.status)] || theme.colors.primary },
              ]}
            >
              {normalizeStatus(call.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.subline}>Call #{call.id} - {call.priority || "MEDIUM"} Priority</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Call Information</Text>
        <Text style={styles.item}>SAP Call ID: {call.sap_call_id || "N/A"}</Text>
        <Text style={styles.item}>Technician: {call.assigned_technician || "Unassigned"}</Text>
        <Text style={styles.item}>Location: {call.location || "N/A"}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Problem Description</Text>
        <Text style={styles.problemText}>{call.problem_description || "No description"}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("ServiceReportForm", { serviceCall: call })}
      >
        <Text style={styles.buttonText}>Create Service Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 21,
    fontWeight: "800",
    color: "#fff",
  },
  subline: {
    color: "#DDEEFF",
    marginTop: 6,
    fontSize: 13,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff22",
  },
  statusText: {
    fontWeight: "800",
    fontSize: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 8,
  },
  item: {
    color: theme.colors.textMuted,
    marginBottom: 5,
  },
  problemText: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  button: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", letterSpacing: 0.2 },
});

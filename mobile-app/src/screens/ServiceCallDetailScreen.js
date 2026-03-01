import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ServiceCallDetailScreen({ route, navigation }) {
  const { call } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{call.customer_name}</Text>
        <Text style={styles.item}>Call ID: {call.id}</Text>
        <Text style={styles.item}>SAP Call ID: {call.sap_call_id || "N/A"}</Text>
        <Text style={styles.item}>Status: {call.status}</Text>
        <Text style={styles.item}>Priority: {call.priority || "MEDIUM"}</Text>
        <Text style={styles.item}>Technician: {call.assigned_technician || "Unassigned"}</Text>
        <Text style={styles.item}>Location: {call.location || "N/A"}</Text>
        <Text style={styles.notesLabel}>Problem</Text>
        <Text style={styles.notes}>{call.problem_description || "No description"}</Text>
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
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { padding: 14 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce4f3",
    borderRadius: 10,
    padding: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0b1f44",
    marginBottom: 8,
  },
  item: { color: "#2f405e", marginBottom: 4 },
  notesLabel: { marginTop: 10, fontWeight: "700", color: "#0b1f44" },
  notes: { marginTop: 4, color: "#2f405e" },
  button: {
    marginTop: 14,
    backgroundColor: "#0f62fe",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});

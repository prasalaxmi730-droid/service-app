import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { api } from "../services/api";
import { API_BASE_URL } from "../config/env";
import { theme } from "../theme";

export default function ServiceReportDetailScreen({ route }) {
  const reportId = route.params?.reportId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await api.get(`/service-reports/${reportId}`);
        setReport(response.data);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.errorText}>Report not found.</Text>
      </View>
    );
  }

  const photoUrl = report.photo_url
    ? `${API_BASE_URL}${report.photo_url}`
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Report #{report.id}</Text>
        <Text style={styles.item}>Call ID: {report.service_call_id}</Text>
        <Text style={styles.item}>Customer: {report.customer_name || "N/A"}</Text>
        <Text style={styles.item}>Technician: {report.technician_name}</Text>
        <Text style={styles.item}>Visit Date: {String(report.visit_date).slice(0, 10)}</Text>
        <Text style={styles.item}>Sync Status: {report.sync_status}</Text>

        <Text style={styles.section}>Resolution Notes</Text>
        <Text style={styles.paragraph}>{report.resolution_notes}</Text>

        <Text style={styles.section}>Signature Data</Text>
        <Text style={styles.paragraph} numberOfLines={4}>
          {report.signature_data || "No signature"}
        </Text>
      </View>

      {photoUrl ? (
        <View style={styles.card}>
          <Text style={styles.section}>Photo</Text>
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.section}>Photo</Text>
          <Text style={styles.paragraph}>No photo uploaded</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.danger,
    fontWeight: "700",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
    paddingBottom: 4,
  },
  label: {
    color: theme.colors.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  value: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  sectionHeader: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    color: theme.colors.text,
    lineHeight: 22,
    fontSize: 15,
  },
  photo: {
    width: "100%",
    height: 250,
    borderRadius: theme.radius.md,
    marginTop: 10,
    backgroundColor: "#F8FBFF",
  },
});

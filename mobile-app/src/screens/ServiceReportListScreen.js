import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../services/api";
import { theme } from "../theme";

const syncColor = {
  PENDING: theme.colors.warning,
  SYNCED: theme.colors.success,
  FAILED: theme.colors.danger,
};

export default function ServiceReportListScreen({ route, navigation }) {
  const serviceCallId = route.params?.serviceCallId;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const endpoint = serviceCallId
        ? `/service-reports?service_call_id=${serviceCallId}`
        : "/service-reports";
      const response = await api.get(endpoint);
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [serviceCallId])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {serviceCallId ? `Reports for Call #${serviceCallId}` : "Service Reports (Completed)"}
      </Text>
      <Text style={styles.subheading}>View completed calls and submitted reports.</Text>

      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReports} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 18 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ServiceReportDetail", { reportId: item.id })}
            >
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle}>Report #{item.id}</Text>
                <View
                  style={[
                    styles.syncPill,
                    { backgroundColor: `${syncColor[item.sync_status] || theme.colors.primary}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.syncText,
                      { color: syncColor[item.sync_status] || theme.colors.primary },
                    ]}
                  >
                    {item.sync_status}
                  </Text>
                </View>
              </View>

              <Text style={styles.meta}>Call ID: {item.service_call_id}</Text>
              <Text style={styles.meta}>Customer: {item.customer_name || "N/A"}</Text>
              <Text style={styles.meta}>Technician: {item.technician_name}</Text>
              <Text style={styles.meta}>Visit Date: {String(item.visit_date).slice(0, 10)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No reports found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subheading: {
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    fontSize: 16,
  },
  syncPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  syncText: {
    fontSize: 12,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    marginTop: 44,
    color: theme.colors.textMuted,
  },
});

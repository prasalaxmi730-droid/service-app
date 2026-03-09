import React, { useCallback, useLayoutEffect, useState } from "react";
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

const statusColor = {
  PENDING: theme.colors.warning,
  OPEN: theme.colors.warning,
  COMPLETED: theme.colors.success,
};

const normalizeStatus = status => (status === "OPEN" ? "PENDING" : status || "PENDING");

export default function ServiceCallListScreen({ navigation, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadServiceCalls = async () => {
    setLoading(true);
    try {
      const response = await api.get("/service-calls?status=PENDING");
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadServiceCalls();
    }, [])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("ServiceReportList")}
            style={styles.reportButton}
          >
            <Text style={styles.reportText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, onLogout]);

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Pending Calls</Text>
        <Text style={styles.subheading}>Tap a call to view details and submit report.</Text>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadServiceCalls} />}
          contentContainerStyle={{ paddingBottom: 18 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ServiceCallDetail", { call: item })}
            >
              <View style={styles.rowTop}>
                <Text style={styles.customer}>{item.customer_name}</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: `${statusColor[normalizeStatus(item.status)] || theme.colors.primary}22`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor[normalizeStatus(item.status)] || theme.colors.primary },
                    ]}
                  >
                    {normalizeStatus(item.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.meta}>#{item.id} • {item.priority || "MEDIUM"} Priority</Text>
              <Text style={styles.meta}>Technician: {item.assigned_technician || "Unassigned"}</Text>
              <Text style={styles.meta}>Location: {item.location || "No location"}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No service calls found</Text>}
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
  },
  headerBlock: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subheading: {
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 10,
  },
  customer: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  meta: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: theme.colors.textMuted,
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF5FF",
    marginLeft: 8,
  },
  logoutText: {
    color: theme.colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  reportButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EAF7F5",
  },
  reportText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
});

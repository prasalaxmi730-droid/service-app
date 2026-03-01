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

export default function ServiceCallListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadServiceCalls = async () => {
    setLoading(true);
    try {
      const response = await api.get("/service-calls");
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

  return (
    <View style={styles.container}>
      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color="#0f62fe" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadServiceCalls} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ServiceCallDetail", { call: item })}
            >
              <Text style={styles.customer}>{item.customer_name}</Text>
              <Text style={styles.meta}>Status: {item.status}</Text>
              <Text style={styles.meta}>Technician: {item.assigned_technician || "Unassigned"}</Text>
              <Text style={styles.meta}>{item.location || "No location"}</Text>
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
    backgroundColor: "#f5f7fb",
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dce4f3",
  },
  customer: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1f44",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: "#3f4f6d",
    marginBottom: 2,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7a99",
  },
});

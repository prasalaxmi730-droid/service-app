import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import SignatureScreen from "react-native-signature-canvas";
import { api } from "../services/api";
import { theme } from "../theme";

const getPhotoUploadPart = photo => {
  const uri = photo?.uri;
  if (!uri) {
    return null;
  }

  const extensionMatch = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase() || "jpg";
  const mimeType = photo.mimeType || `image/${extension === "jpg" ? "jpeg" : extension}`;

  return {
    uri,
    name: photo.fileName || `report-${Date.now()}.${extension}`,
    type: mimeType,
  };
};

export default function ServiceReportFormScreen({ route, navigation }) {
  const { serviceCall } = route.params;
  const [technicianName, setTechnicianName] = useState(serviceCall.assigned_technician || "");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [signatureData, setSignatureData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const signatureRef = useRef(null);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission", "Photo library permission is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSignatureOk = signature => {
    setSignatureData(signature);
    if (pendingSubmission) {
      submitReport(signature);
    }
  };

  const handleSignatureEmpty = () => {
    if (pendingSubmission) {
      setPendingSubmission(false);
      setSubmitting(false);
      Alert.alert("Validation", "Please add and save a signature before submitting.");
    }
  };

  const submitReport = async currentSignature => {
    const normalizedTechnicianName = technicianName.trim();
    const normalizedVisitDate = visitDate.trim();
    const normalizedResolutionNotes = resolutionNotes.trim();
    const normalizedSignature = (currentSignature ?? signatureData ?? "").trim();

    if (!normalizedTechnicianName || !normalizedVisitDate || !normalizedResolutionNotes) {
      Alert.alert("Validation", "Fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setPendingSubmission(false);

      const form = new FormData();
      form.append("service_call_id", String(serviceCall.id));
      form.append("technician_name", normalizedTechnicianName);
      form.append("visit_date", normalizedVisitDate);
      form.append("resolution_notes", normalizedResolutionNotes);
      form.append("signature_data", normalizedSignature);

      const photoUploadPart = getPhotoUploadPart(photo);
      if (photoUploadPart) {
        form.append("photo", photoUploadPart);
      }

      await api.post("/submit-report", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Service report submitted");
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPress = () => {
    if (!photo) {
      Alert.alert("Validation", "Please select a service photo before submitting.");
      return;
    }

    if (!signatureRef.current) {
      Alert.alert("Validation", "Signature pad is not ready yet. Please try again.");
      return;
    }

    setSubmitting(true);
    setPendingSubmission(true);
    signatureRef.current.readSignature();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.callSummary}>
        <Text style={styles.callTitle}>{serviceCall.customer_name}</Text>
        <Text style={styles.callMeta}>Call #{serviceCall.id}</Text>
      </View>

      <Text style={styles.label}>Technician Name</Text>
      <TextInput style={styles.input} value={technicianName} onChangeText={setTechnicianName} />

      <Text style={styles.label}>Visit Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={visitDate} onChangeText={setVisitDate} />

      <Text style={styles.label}>Resolution Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={resolutionNotes}
        onChangeText={setResolutionNotes}
        multiline
      />

      <Text style={styles.label}>Photo Upload</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={pickPhoto}>
        <Text style={styles.secondaryText}>{photo ? "Change Photo" : "Select Photo"}</Text>
      </TouchableOpacity>
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photo} />
          <Text style={styles.photoName}>{photo.fileName || "Selected image"}</Text>
        </>
      ) : null}

      <Text style={styles.label}>Signature Capture</Text>
      <View style={styles.signatureWrap}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignatureOk}
          onEmpty={handleSignatureEmpty}
          descriptionText="Sign in box"
          clearText="Clear"
          confirmText="Save"
          autoClear={false}
          webStyle={`
            .m-signature-pad--footer { display: flex; }
            body,html { width: 100%; height: 100%; }
          `}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmitPress} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Submitting..." : "Submit Report"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  callSummary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  callTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 17,
  },
  callMeta: {
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  label: {
    color: theme.colors.text,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    color: theme.colors.text,
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  secondaryButton: {
    backgroundColor: "#F1F8FF",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  secondaryText: { color: theme.colors.primary, fontWeight: "700" },
  photo: { width: "100%", height: 180, borderRadius: theme.radius.sm, marginTop: 10 },
  photoName: { marginTop: 5, color: theme.colors.textMuted, fontSize: 12 },
  signatureWrap: {
    height: 220,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
});

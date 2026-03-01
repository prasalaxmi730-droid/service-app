import axios from "axios";

const baseURL = process.env.SAP_API_BASE_URL || "";
const serviceCallsEndpoint = process.env.SAP_SERVICE_CALLS_ENDPOINT || "/service-calls";
const serviceReportsEndpoint = process.env.SAP_SERVICE_REPORT_ENDPOINT || "/service-reports";

const sapClient = axios.create({
  baseURL,
  timeout: 15000,
});

const buildHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (process.env.SAP_API_KEY) {
    headers["x-api-key"] = process.env.SAP_API_KEY;
  }
  if (process.env.SAP_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SAP_BEARER_TOKEN}`;
  }
  return headers;
};

export const fetchServiceCallsFromSAP = async () => {
  if (!baseURL) {
    return [];
  }

  const response = await sapClient.get(serviceCallsEndpoint, {
    headers: buildHeaders(),
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.data?.value)) {
    return response.data.value;
  }

  return [];
};

export const pushServiceReportToSAP = async report => {
  if (!baseURL) {
    return { skipped: true, reason: "SAP_API_BASE_URL not configured" };
  }

  const payload = {
    localReportId: report.id,
    sapCallId: report.sap_call_id,
    technicianName: report.technician_name,
    visitDate: report.visit_date,
    resolutionNotes: report.resolution_notes,
    photoUrl: report.photo_url,
    signatureData: report.signature_data,
  };

  const response = await sapClient.post(serviceReportsEndpoint, payload, {
    headers: buildHeaders(),
  });

  return response.data;
};

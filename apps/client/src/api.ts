import axios from 'axios';

// Use Render backend URL only in production; keep local dev on localhost.
const ROOT_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || "http://localhost:5001"
  : "http://localhost:5001";
export const API_BASE = `${ROOT_URL}/api`;

export const syncNodes = async (nodes: any[]) => {
  try {
    const response = await axios.post(`${API_BASE}/nodes/sync`, { nodes });
    return response.data;
  } catch (error) {
    console.error("Error syncing to server:", error);
    throw error;
  }
};

export const fetchNodes = async () => {
  const response = await axios.get(`${API_BASE}/nodes`);
  return response.data;
};
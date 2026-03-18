import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
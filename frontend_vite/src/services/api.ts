// src/services/api.ts
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

export const getProducts = async (search = '') => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/produk', {
    params: { search }
  });
  return data;
};

export const getMesin = async (search = '') => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/mesin', {
    params: { search }
  });
  return data;
};

export const addProduct = async (formData: FormData) => {
  const { data } = await api.post("/produk/add", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const addMesin = async (formData: any) => {
  const { data } = await api.post("/mesin/add", formData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
};

export const addPesan = async (formData: any) => {
  const { data } = await api.post("/pesan/add", formData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
};

export const updateProduct = async (id: string, formData: FormData) => {
  const { data } = await api.patch(`/produk/edit/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const updateMesin = async ({ id, formData }: { id: string, formData: any }) => {
  const { data } = await api.patch(`/mesin/edit/${id}`, formData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
};

// Ubah parameter dari (dataDelete: String[]) menjadi (payload: { id: string[] })
export const deleteProduct = async (payload: { id: string[] }) => {
  const { data } = await api.post(`/produk/delete`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};

export const deleteMesin = async (payload: { id: string[] }) => {
  const { data } = await api.post(`/mesin/delete`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};
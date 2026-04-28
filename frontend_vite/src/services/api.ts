// src/services/api.ts
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import type { DateType } from 'react-tailwindcss-datepicker';

const api = axios.create({ baseURL: 'https://vendo-api-0i0p.onrender.com' });
// const api = axios.create({ baseURL: 'http://localhost:3000' });

const supabase = createClient('https://gqqghwfjsokyqjxztxwk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWdod2Zqc29reXFqeHp0eHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzEzNzgsImV4cCI6MjA4NzkwNzM3OH0.tCPMutwRd3vRDxE5q6pSj38MEXbQnkLYO0QiHzGk9J4');

// api.js
api.interceptors.request.use(async (config) => {
  // Ini sangat cepat karena membaca dari LocalStorage browser
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const getProducts = async (page?: number, limit?: number, sortKey?: string | null, sortAsc?: boolean | null, search?: string | null, isActive?: string | null) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/produk', {
    params: { page, limit, sortKey, sortAsc, search, isActive }
  });
  return data;
};

export const getMesin = async (page: number, limit: number, sortKey: string | null, sortAsc: boolean | null, search: string | null, status: string | null) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/mesin', {
    params: { page, limit, sortAsc, sortKey, search, status }
  });
  return data;
};

export const getUser = async (page: number, limit: number, sortAsc: boolean | null, sortKey: string | null, search: string | null, role: string | null) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/user', {
    params: { page, limit, sortAsc, sortKey, search, role}
  });
  return data;
};

export const getTransaksi = async (page: number, limit: number, sortAsc: boolean | null, sortKey: string | null, search: string | null, statusTransaksi: string | null, statusPembayaran: string | null) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/transaksi', {
    params: { page, limit, sortAsc, sortKey, search, statusTransaksi, statusPembayaran}
  });
  return data;
};

export const getLogMesin = async (search = '', page: number, limit: number) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/mesin/logs', {
    params: { search, page, limit}
  });
  return data;
};

export const getPergerakanStok = async (page: number, limit: number, sortAsc: boolean | null, sortKey: string | null, search: string | null, tipePerubahan: string | null) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/pergerakan-stock', {
    params: { page, limit, sortAsc, sortKey, search, tipePerubahan}
  });
  return data;
};

export const getSumary = async (filter: string, dari?: DateType , sampai?: DateType) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/transaksi/summary', {
    params: { filter, dari, sampai }
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

export const addUser = async (formData: FormData) => {
  const { data } = await api.post("/user/add", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const changeRole = async (id: string, changeTo: string) => {
  const { data } = await api.patch(`/user/change_role/${id}`, { role: changeTo }, {
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

export const updateUser = async (id: string, formData: FormData) => {
  const { data } = await api.patch(`/user/update/${id}`, formData, {
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
export const de_or_activateProduct = async (payload: any[]) => {
  const { data } = await api.post(`/produk/activate-or-deactivate`, payload, {
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

export const deactivateUser = async (payload: any[] ) => {
  const { data } = await api.post(`/user/deactivate`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};
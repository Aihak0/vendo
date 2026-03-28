// src/services/api.ts
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const api = axios.create({ baseURL: 'http://localhost:3000' });

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

export const getUser = async (search = '', page: number, limit: number) => {
  // Mengirim query params ?search=... ke backend
  const { data } = await api.get('/user', {
    params: { search, page, limit}
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

export const addUser = async (formData: any) => {
  const { data } = await api.post("/user/add", formData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  console.log("datanya => ", data);
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

export const deactivateUser = async (payload: any[] ) => {
  const { data } = await api.post(`/user/deactivate`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};
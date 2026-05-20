import { type Produk } from "../Produk/interface";

export interface MesinSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataSlot: Mesin | null; // Data yang dilempar dari list
}

export interface MesinEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataEdit: Mesin | null; // Data yang dilempar dari list
}

export interface MesinAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface MesinDeleteModalProps{
    isOpen: boolean;
    onClose: () =>void;
    dataDelete: string[]
}


export interface Mesin {
    id: string; // Tambahkan ID untuk keperluan update
    nama: string;
    kode?: string
    lokasi: string;
    status: 'online' | 'maintenance' | 'offline';
    total_slot: number;
    latitude: number;
    longitude: number;
    desa: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    negara: string;
    kodePos: string;
    row_slots: number;
    column_slots: number;
    slot: SlotData[];
    teknisi_id: string;
    mesin_teknisi:any[];
}

export interface SlotData {
  id: string;
  kode: string;  // contoh: "R1C1"
  produk_id: string;
  stock: number;
  produk?: Produk; 
  metadata: {
    row_number: number;
    col_number: number;
    span: number;
    gabungan: string[];
  };
}

export interface Column {
  id?: string;
  kode: string;
  col_number: number;
  span: number;       
  gabungan: string[];
  stock?: number;
  added_stock?: number;
  produk_id?: string;
  produk?: Produk;
  changed?: boolean;
}

export interface SlotRow {
  row_number: number;
  col: Column[]; // <--- Perhatikan '[]' di sini, ini artinya array biasa
}

 
export interface DragState {
  active: boolean;
  startR: number | null;
  startC: number | null;
  curC: number | null;
}

export interface Teknisi {
  user_id: number;
  nama: string;
  email: string;
  urlPasfoto: string; // Tambahkan properti ini
  // ... properti lainnya
}
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
    lokasi: string;
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
    slot: SlotData[]
}

export interface SlotData {
  id: string;
  kode: string;  // contoh: "R1C1"
  produk_id: string;
  stock: number;
  metadata: {
    row_number: number;
    col_number: number;
    span: number;
    gabungan: string[];
  };
}

export interface Column {
  kode: string;
  col_number: number;
  span: number;       
  gabungan: string[];
  stock?: number;
  produk_id?: string;
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
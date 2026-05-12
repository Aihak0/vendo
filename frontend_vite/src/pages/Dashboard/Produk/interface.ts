export interface ProdukAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface ProdukDeleteModalProps{
    isOpen: boolean;
    onClose: () => void;
    dataDeactivate: any[]
}

export interface Produk {
    id: string; // Tambahkan ID untuk keperluan update
    nama: string;
    harga: number;
    img_url: string;
}

export interface ProdukEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataEdit: Produk | null; // Data yang dilempar dari list
}
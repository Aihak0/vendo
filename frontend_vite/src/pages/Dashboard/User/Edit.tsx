import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useState, useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import { useAlert } from "../../UiElements/Alerts";
import { FolderPen, Square, Loader2, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "../../../services/api"; // Ganti ke updateProduct

interface Produk {
    id: string; // Tambahkan ID untuk keperluan update
    nama: string;
    harga: number;
    img_url: string;
}

interface ProdukEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    dataEdit: Produk | null; // Data yang dilempar dari list
}

export function ProdukEdit({ isOpen, onClose, dataEdit }: ProdukEditModalProps) {
    const queryClient = useQueryClient();
    const alert = useAlert();
    const [isLoading, setLoading] = useState(false);

    // --- State Management ---
    const [nama, setNama] = useState("");
    const [harga, setHarga] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<Record<string, any>>({});
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Efek untuk Mengisi Data Awal (Edit Mode) ---
    useEffect(() => {
        if (dataEdit && isOpen) {
            setNama(dataEdit.nama);
            setHarga(dataEdit.harga);
            setPreviewUrl(dataEdit.img_url); // Tampilkan gambar lama sebagai preview
            setFile(null); // Reset file input karena belum ada file baru
        }
    }, [dataEdit, isOpen]);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith('image/')) {
            alert.error('Hanya file gambar yang diperbolehkan', { title: "Error" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setFile(file);
    };

    // --- Event Handlers (Drag & Drop) ---
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeImage = () => {
        setPreviewUrl(null);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Validasi ---
    function validateProductName(name: string) {
        if (name.trim().length < 2) return "Nama terlalu singkat";
        return null;
    }

    // --- Mutation ---
    const mutation = useMutation({
    
        mutationFn: (fd: FormData) => updateProduct(dataEdit?.id!, fd), 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            alert.success("Produk berhasil diperbarui");
            onClose();
        },
        onError: (err: any) => {
            alert.error(err.message || "Gagal memperbarui produk");
        },
        onSettled: () => setLoading(false)
    });

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        const errorNama = validateProductName(nama);

        if (errorNama) {
            setError({ name: errorNama });
            return;
        }

        setLoading(true);

        const fd = new FormData();
        fd.append('nama', nama);
        fd.append('harga', harga?.toString() || "0");
        
        // Hanya kirim file jika ada perubahan gambar
        if (file) {
            fd.append('image', file);
        }

        mutation.mutate(fd);
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
            <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity" />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto font-sans">
                <div className="flex min-h-full items-center justify-center p-6">
                    <DialogPanel transition className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                        
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Edit Produk</h3>
                            <span className="text-xs text-blue-600 font-mono">ID: {dataEdit?.id?.slice(0,8)}</span>
                        </div>

                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            {/* Image Upload Area */}
                            <div className="w-full">
                                {!previewUrl ? (
                                    <div
                                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                                        <p className="text-sm text-gray-500 text-center px-4">Klik atau tarik gambar baru untuk mengganti</p>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border group">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <button type="button" onClick={removeImage} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm">Hapus</button>
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm">Ganti</button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                                    </div>
                                )}
                            </div>

                            {/* Input Nama */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Produk</label>
                                <div className="relative">
                                    <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={nama}
                                        onChange={(e) => setNama(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Contoh: ESP32 OLED Case"
                                    />
                                </div>
                                {error.name && <p className="text-red-500 text-xs mt-1">{error.name}</p>}
                            </div>

                            {/* Input Harga */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga (Rp)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Rp</span>
                                    <input
                                        type="number"
                                        value={harga ?? ""}
                                        onChange={(e) => setHarga(e.target.value === '' ? null : Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 flex items-center justify-center py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-all"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Check className="w-5 h-5 mr-1" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
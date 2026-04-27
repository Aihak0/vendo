import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useAlert } from "../../UiElements/Alert";
import { FolderPen, Loader2, PenLine, Circle, Square, CloudUpload } from "lucide-react";
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

     function resetForm() {
        setNama("");
        setFile(null);
        setHarga(null);
        const errors = {
            nama: "",

        };
        setError(errors);
    }
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
    
        const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(true);
        };
    
        const handleDragLeave = () => {
            setIsDragging(false);
        };
    
        const handleDrop = (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        };
    
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
        };
    
        const handleClick = () => {
            fileInputRef.current?.click();
        };
    
        // --- Reset / remove preview ---
        const removeImage = () => {
            setPreviewUrl(null);
            if (fileInputRef.current) {
            fileInputRef.current.value = '';
            }
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
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-zinc-300/50 dark:bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                />
            

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto font-sans">
                <div className="flex min-h-full items-center justify-center p-6">
                     <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-white/10 transition-all h-fit w-fit ">
                        <div className="flex flex-col w-fit px-1 min-w-md mb-3">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                    <PenLine aria-hidden="true" className="size-4 text-green-400" />
                                </div>

                                <div className="flex items-stretch h-full ml-3">
                                    <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        Edit Produk
                                    </DialogTitle>
                                </div>
                            </div>

                            <form onSubmit={handleEdit} className="py-2 space-y-5 min-h-55 relative text-base dark:text-gray-400">
                                {/* Image Upload Area */}
                                <div className="w-full max-w-md mb-2">
                                    <label  className="block mb-2.5 text-sm font-medium text-xs">Foto Produk</label>
                                    {!previewUrl ? (
                                        // Dropzone kosong
                                        <div
                                            className={`
                                            relative flex flex-col items-center justify-center w-full h-64 
                                            border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                                            ${
                                            isDragging
                                                ? 'border-blue-500 dark:border-blue-300 bg-blue-50/60 dark:bg-slate-800 shadow-lg scale-[1.02]'
                                                : 'border-gray-300 dark:border-blue-900 bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-950 hover:border-gray-400 dark:hover:border-blue-800'
                                            }
                                        `}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={handleClick}
                                        >
                                        <input
                                            ref={fileInputRef}
                                            id="dropzone-file"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleChange}
                                        />
                                        <CloudUpload className={`w-12 h-12 mb-4 transition-colors ${
                                            isDragging ? 'text-blue-500' : 'text-gray-400'
                                            }`}/>
                                        

                                        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                                            {isDragging ? (
                                            <span className="text-blue-600">Lepaskan gambar di sini</span>
                                            ) : (
                                            <>
                                                <span className="font-semibold text-blue-600">Klik</span> atau drag & drop
                                            </>
                                            )}
                                        </p>

                                        <p className="text-xs text-gray-500 dark:text-gray-600">
                                            PNG, JPG, GIF, WEBP (maks. 10MB disarankan)
                                        </p>
                                        </div>
                                    ) : (
                                        // Tampilan preview
                                        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-blue-800 shadow-sm group">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Overlay + tombol hapus */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                            onClick={removeImage}
                                            className="px-5 py-2.5 bg-white dark:bg-red-950 text-red-600 dark:text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900 active:bg-red-100 transition-colors shadow-md"
                                            >
                                            Hapus Gambar
                                            </button>
                                        </div>

                                        {/* Tombol ganti gambar (pojok kanan atas) */}
                                        <label
                                            htmlFor="dropzone-file"
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-gray-900 hover:bg-white text-gray-700 dark:text-gray-300 text-sm rounded-md cursor-pointer shadow-sm transition-colors"
                                        >
                                            Ganti
                                            <input
                                            ref={fileInputRef}
                                            id="dropzone-file"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleChange}
                                            />
                                        </label>
                                        </div>
                                    )}
                                </div>

                                 <div className="mb-2">
                                    <label  className="block mb-2.5 text-sm font-medium text-xs">Nama Produk</label>
                                    <div className="relative mb-1">
                                        <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={nama}
                                            onChange={(e) => 
                                                setNama(e.target.value)}
                                            className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900  outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all ${error.nama ? `border-red-300 focus:border-red-400 focus:ring-red-100` : `border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500`} `}
                                            placeholder="Masukkan Nama "
                                        
                                        />
                                    </div>
                                    {error.nama && <p className="text-red-500 text-sm text-shadow-md px-1">{error.nama}</p>}
                                </div>

                                {/* Input Harga */}
                                <div className="mb-6">
                                    <label className="block mb-2.5 text-sm font-medium text-xs">Harga (Rp)</label>
                                    <div className="relative mb-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Rp</span>
                                        <input
                                            type="number"
                                            value={harga ?? ""}
                                            onChange={(e) => setHarga(e.target.value === '' ? null : Number(e.target.value))}
                                            className="min-w-0 w-full bg-blue-50/50 dark:bg-slate-900  outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex bottom-0 w-full">
                                    <button
                                        type="button"
                                        data-autofocus
                                        onClick={() => {onClose(); resetForm();}}
                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-l-lg"
                                        >
                                        <Square/>
                                    </button>
                                    <button
                                        type="submit"

                                        disabled={isLoading}
                                        className={`flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 text-white font-medium rounded-r-lg transition-colors
                                            ${ isLoading
                                                ? 'bg-blue-900 dark:bg-blue-950 cursor-not-allowed' // Style saat tombol mati
                                                : 'bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 cursor-pointer dark:hover:bg-blue-900' // Style saat tombol aktif
                                            } text-white`}
                                        >
                                        {isLoading ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        )  : (
                                        <Circle/>
                                        )}
                                    </button>
                                </div>
                               
                            </form>
                        </div>      
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useAlert } from "../../UiElements/Alert";
import { FolderPen, Square, Loader2, Check} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addProduct } from "../../../services/api";

interface ProdukAddModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProdukAdd ({isOpen, onClose} : ProdukAddModalProps){
    const queryClient = useQueryClient();
    const [isLoading, setLoading] = useState(false);

    const [error, setError] = useState<Record<string, any>>({});
    const [nama, setNama] = useState("");
    const [harga, setHarga] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!file.type.startsWith('image/')) {
        alert.error('Hanya file gambar yang diperbolehkan (PNG, JPG, GIF, WEBP, dll)', {title: "Error"});
        return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setFile(file);
    };

    // --- Event Handlers ---
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

    const alert = useAlert();

    function validateProductName(name: string) {
        const cleanName = name.trim();

        if (cleanName.length < 2) return "Nama Terlalu Singkat, jnagan gunakna singkatan";
        if (cleanName.length > 100) return "Nama terlalu panjang (max. 100 karakter)";
        if (/[^aeiouy\s]{6,}/i.test(cleanName)) return "Nama terdeteksi sebagai karakter acak";

        const symbolCount = (cleanName.match(/[^a-zA-Z0-9\s]/g) || []).length;
        if (symbolCount > 3) return "Terlalu banyak simbol, gunakan nama yang wajar";

        // 4. Blacklist Kata Sampah
        const blacklist = ["test", "testing", "asdf", "nama produk", "coba", "jancok", "bnagsat", "biadab"];
        if (blacklist.some(word => cleanName.toLowerCase() === word)) return "Masukkan nama produk yang valid";

        return null;
    }

    function resetForm() {
        setNama("");
    }

      const mutation = useMutation({
        mutationFn: addProduct,
        onSuccess: () => {
            // 1. Refresh data
            queryClient.invalidateQueries({ queryKey: ['products'] });
            console.log("Data berhasil masuk!");
            
            // 2. Tutup Modal di sini (Ganti 'setOpen' dengan fungsi tutup modal kamu)
            onClose(); 
            
            // 3. Reset form jika perlu
            resetForm(); 
        },
        onError: (err: any) => {
            console.error("Gagal simpan:", err.message);
            // Bisa tambahkan toast error di sini
        },
        onSettled: () => {
            // 4. Loading STOP (Jalan baik saat sukses maupun error)
            setLoading(false);
        }
        });

        async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        
        // Validasi awal
        if (!file) return;
        const errorNama = validateProductName(nama);

        if (errorNama) {
            setError({ name: errorNama });
            return; // Tidak perlu setLoading(false) karena loading belum dimulai
        }

        // Mulai Loading
        setLoading(true);

        const fd = new FormData();
        fd.append('nama', nama);
        fd.append('harga', harga?.toString() || "0");
        fd.append('image', file);

        // Eksekusi mutasi
        mutation.mutate(fd);
        }

    return(
        <Dialog open={isOpen} onClose={onClose} className="relative z-10">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-300/50 dark:bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-6 text-center sm:items-center sm:p-0">
                            <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-sm bg-gray-100 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-20 sm:w-full lg:max-w-150 data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                            <div className=" px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-lime-500/10 sm:mx-0 sm:size-10">
                                    {/* <FilePlusCorner aria-hidden="true" className="size-6 text-lime-400" /> */}
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                   
                                    <div className="mt-2">
                                    <p className="text-sm text-gray-400">
                                         "Tambah"
                                        
                                    </p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div>
                                <form onSubmit={handleAdd} className="py-2 px-4 space-y-5">
                                        
                                        <div className="w-full max-w-md mx-auto">
                                            {!previewUrl ? (
                                                // Dropzone kosong
                                                <div
                                                className={`
                                                    relative flex flex-col items-center justify-center w-full h-64 
                                                    border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                                                    ${
                                                    isDragging
                                                        ? 'border-blue-500 bg-blue-50/60 shadow-lg scale-[1.02]'
                                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
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

                                                <svg
                                                    className={`w-12 h-12 mb-4 transition-colors ${
                                                    isDragging ? 'text-blue-500' : 'text-gray-400'
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                    />
                                                </svg>

                                                <p className="mb-2 text-sm font-medium text-gray-700">
                                                    {isDragging ? (
                                                    <span className="text-blue-600">Lepaskan gambar di sini</span>
                                                    ) : (
                                                    <>
                                                        <span className="font-semibold text-blue-600">Klik</span> atau drag & drop
                                                    </>
                                                    )}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, GIF, WEBP (maks. 10MB disarankan)
                                                </p>
                                                </div>
                                            ) : (
                                                // Tampilan preview
                                                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Overlay + tombol hapus */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                    onClick={removeImage}
                                                    className="px-5 py-2.5 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 active:bg-red-100 transition-colors shadow-md"
                                                    >
                                                    Hapus Gambar
                                                    </button>
                                                </div>

                                                {/* Tombol ganti gambar (pojok kanan atas) */}
                                                <label
                                                    htmlFor="dropzone-file"
                                                    className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-sm rounded-md cursor-pointer shadow-sm transition-colors"
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

                                        <div className="mb-0">
                                            <label  className="block mb-2.5 text-sm font-medium text-xs">Nama</label>
                                            <div className="relative mb-3 border-x border-gray-400">
                                                <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={nama}
                                                    onChange={(e) => 
                                                        setNama(e.target.value)}
                                                    className={`w-full pl-11 pr-4 py-2 border border-transparent placeholder:text-stone-400 focus-visible:ring-transparent text-sm  focus-visible:outline-none bg-gray-200 `}
                                                    placeholder="Nama"
                                                
                                                />
                                                { error.nama && <p className="text-red-500 text-xs mt-1">{error.nama}</p>}
                                            </div>
                                        </div>
                                        <div className="mb-0">
                                            <label  className="block mb-2.5 text-sm font-medium text-xs">Harga</label>
                                            <div className="relative mb-3 border-x border-gray-400">
                                                <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={harga ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setHarga(val === '' ? null : Number(val));
                                                    }}
                                                    className={`w-full pl-11 pr-4 py-2 border border-transparent placeholder:text-stone-400 focus-visible:ring-transparent text-sm  focus-visible:outline-none bg-gray-200 `}
                                                    placeholder="Harga"
                                                
                                                />
                                            
                                            </div>
                                        </div>
                                        <div className="flex">
            
                                        <button
                                            type="button"
                                            data-autofocus
                                            onClick={() => onClose()}
                                            className="flex-1 flex items-center justify-center text-center py-3 px-4 bg-zinc-600 text-white font-medium hover:bg-zinc-700 cursor-pointer transition-colors"
                                            >
                                            <Square/>
                                        </button>
                                        <button
                                        type="submit"

                                        disabled={isLoading}
                                        className={`flex-1 flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-medium rounded-r-lg transition-colors
                                                    ${ isLoading
                                                        ? 'bg-blue-900 cursor-not-allowed' // Style saat tombol mati
                                                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer' // Style saat tombol aktif
                                                    } text-white`}
                                        >
                                            {isLoading ? (
                                                 <Loader2 size={24} className="animate-spin" />
                                            )  : (
                                               <Check/>
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
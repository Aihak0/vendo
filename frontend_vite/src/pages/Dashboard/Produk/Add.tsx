import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useAlert } from "../../UiElements/Alert";
import { FolderPen, Square, Loader2, Plus, Circle, CloudUpload} from "lucide-react";
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
        setFile(null);
        setHarga(null);
        const errors = {
            nama: "",

        };
        setError(errors);
    }

      const mutation = useMutation({
        mutationFn: addProduct,
        onSuccess: (s: any) => {
            // 1. Refresh data
            queryClient.invalidateQueries({ queryKey: ['products'] });
            alert.success(s.message, {title: "Berhasil"})
            
            // 2. Tutup Modal di sini (Ganti 'setOpen' dengan fungsi tutup modal kamu)
            onClose(); 
            
            // 3. Reset form jika perlu
            resetForm(); 
        },
        onError: (err: any) => {
            alert.error(`${err.message}`, { title: "Error" });
            // Bisa tambahkan toast error di sini
        },
        onSettled: () => {
            // 4. Loading STOP (Jalan baik saat sukses maupun error)
            setLoading(false);
        }
        });

        async function handleAdd(e: React.FormEvent) {
        e.preventDefault();

        console.log("jajajajja")
        
        // Validasi awal
        if (!file) return;
        console.log("ga kereturn")

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
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
                <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-zinc-300/50 dark:bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                        />

                   
                        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                            <div className="flex min-h-full items-end justify-center p-6 text-center sm:items-center sm:p-0">
                                 <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-white/10 transition-all h-fit w-fit ">
                                
                                 <div className="flex flex-col w-fit px-1 min-w-md mb-3">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                            <Plus aria-hidden="true" className="size-6 text-green-400" />
                                        </div>

                                        <div className="flex items-stretch h-full ml-3">
                                            <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                                Tambahkan Produk
                                            </DialogTitle>
                                        </div>
                                    </div>
                                    <form onSubmit={handleAdd} className="py-2 space-y-5 min-h-55 relative text-base dark:text-gray-400">
                                            
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
                                                <label  className="block mb-2.5 text-sm font-medium text-xs">Nama</label>
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
                                            <div className="mb-6">
                                                <label  className="block mb-2.5 text-sm font-medium text-xs">Harga</label>
                                                <div className="relative mb-1">
                                                    <FolderPen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={harga ?? ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setHarga(val === '' ? null : Number(val));
                                                        }}
                                                        className={`min-w-0 w-full bg-blue-50/50 dark:bg-slate-900  outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                                                        placeholder="Harga"
                                                    
                                                    />
                                                
                                                </div>
                                            </div>
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
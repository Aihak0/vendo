import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { type MesinSlotModalProps, type SlotRow, type Column} from "./Interface"
import { Table, ChevronDown, Apple, FileBox, Square, Loader2, Circle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getProducts } from '../../../services/api';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMesin } from "../../../services/api"; 
import { useAlert } from "../../UiElements/Alert";

export function MesinSlot({isOpen, onClose, dataSlot}: MesinSlotModalProps){
    const [isLoading, setLoading] = useState(false);
    const [slot, setSlot] = useState<SlotRow[]>([]);

    const [selectedSlot, setSelectedSlot] = useState<Column | null>(null);

    const { data: products, error: errorGetProduk } = useQuery({
        // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
        queryKey: ['products'], 
        queryFn: () => getProducts(),
    });


    const idMesin = dataSlot?.id || "";
    const queryClient = useQueryClient();
    const alert = useAlert();

    const handleSlotChange = (kode: string, event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;

        
        let finalValue: any = value;

        if (name === "stock") {
    
            finalValue = value === "" ? "" : Number(value);
        }
        setSlot((prev) => 
            // 1. Map baris (row/slot group)
            prev.map((row) => ({
                ...row,
                // 2. Map kolom di dalam baris tersebut
                col: row.col.map((c) => {
                    if (c.kode === kode) {
                        // 3. Update hanya kolom yang kodenya cocok
                        return { ...c, [name]: finalValue };
                    }
                    return c; // Kembalikan kolom lain apa adanya
                })
            }))
        );
        setSelectedSlot((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                [name]: finalValue
            } as Column;
        });
    };
        
    const resetSemua = () => {
        setSlot((prev) =>
            prev.map((row) => ({
                ...row,
                col: row.col.map((item) => ({
                    ...item, 
                    produk_id: "",
                    stock: 0
                }))
            }))
        );
    };

    useEffect(() => {
        console.log("Slot nyaaaa", slot);
        console.log("Slot sekete", selectedSlot);
    }, [slot]);

    useEffect(() =>{
         if (dataSlot && isOpen) {
            const slots = dataSlot.slot;
            const groupedByRow = slots.reduce((acc:SlotRow[], curr) => {
              const rowNum = curr.metadata.row_number;

              // Cari apakah row_number ini sudah ada di accumulator
              let row = acc.find((r) => r.row_number === rowNum);

              // Jika belum ada, buat baris baru
              if (!row) {
                row = {
                  row_number: rowNum,
                  col: [],
                };
                acc.push(row);
              }

              // Masukkan data slot ke dalam array 'col'
              row.col.push({
                kode: curr.kode,
                col_number: curr.metadata.col_number,
                span: curr.metadata.span,
                gabungan: curr.metadata.gabungan,
                produk_id: curr.produk_id,
                stock: curr.stock
              });

              // Urutkan kolom berdasarkan col_number agar rapi
              row.col.sort((a, b) => a.col_number - b.col_number);

              return acc;
            }, []);

            groupedByRow.sort((a, b) => a.row_number - b.row_number);

            setSlot(groupedByRow);
            console.log("slot yang dis et", groupedByRow)
        }
    },[dataSlot, isOpen])

    const mutation = useMutation({
    
        mutationFn: updateMesin, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mesin'] });
            alert.success("Mesin berhasil diperbarui");
            onClose();
        },
        onError: (err: any) => {
            alert.error(err.message || "Gagal memperbarui Data");
        },
        onSettled: () => setLoading(false)
    });

    const handleUpdateSlot = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = {   
            slots: slot
        };
        mutation.mutate({ id: idMesin, formData: payload });
    }
    return (
        <Dialog open={isOpen} onClose={() => {onClose(); setSelectedSlot(null);}} className="relative z-50">
               <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity" />
               <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className={`flex min-h-full justify-center p-4 items-center sm:p-0`}>
                        <DialogPanel className={`${selectedSlot ? `flex` : ``} gap-6 relative p-6 transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-blue-50 dark:outline-blue-950 transition-all h-fit mt-10 mb-10`}>
                           
                            {errorGetProduk ? ( <div className="p-10 text-red-500 ">Gagal memuat data: {(errorGetProduk as any).message}</div>) :
                            (
                                <>
                                    <div className="flex flex-col w-fit px-1 min-w-md ">
                                        <div className="sm:flex sm:items-start mb-3">
                                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                                <Table aria-hidden="true" className="size-6 text-green-400" />
                                            </div>
                                            <div className="items-center h-full ml-3">
                                                <div className="flex items-center gap-2">
                                                    <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                                        Slot Mesin
                                                    </DialogTitle>
                                                    <span className=" text-xs text-blue-600 dark:text-gray-500 font-mono">ID: {idMesin.slice(0,8)}</span>
                                                </div>
                                                <h4 className="text-sm dark:text-gray-500">Silahkan Pilih Dan ubah prop Slot</h4>
                                               
                                            </div>
                                        </div>
                                        {selectedSlot && (

                                            <form onSubmit={handleUpdateSlot} className="py-2 space-y-5 min-h-55 relative text-base dark:text-gray-400">
                                                { products && (
                                                    <div className="mb-3">
                                                        <label className="block mb-2.5 text-sm text-xs">Produk</label>
                                                        <div className="relative flex-1">
                                                            <Apple className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"/>
                                                            <select name="produk_id" value={selectedSlot.produk_id || ""} onChange={(e) => handleSlotChange(selectedSlot.kode, e)} className="min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all appearance-none cursor-pointer">
                                                                <option value="" disabled>Pilih Produk</option>
                                                                {products.data.map((p: any) => (
                                                                    <option key={p.id} value={p.id}>{p.nama}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown size={17} className="absolute top-2.5 right-2.5 text-gray-500"/>
                                                        </div>
                                                    </div>

                                                )}
                                                <div className="mb-2">
                                                    <label className="block mb-2.5 text-sm text-xs">Stok</label>
                                                    <div className="relative flex-1">
                                                        <FileBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"/>
                                                        <input type="number" name="stock" value={selectedSlot.stock === 0 ? "" : selectedSlot.stock} 
                                                            onKeyDown={(e) => {
                                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                            }} 
                                                            onChange={(e) => handleSlotChange(selectedSlot.kode, e)} 
                                                            placeholder="Stok"
                                                            className="min-w-0 w-full bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded pl-10 px-4 py-2 text-sm dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all"/>
                                                    </div>
                                                </div>
                                                <div className="flex absolute bottom-0 w-full">
                                                    <button
                                                        type="button"
                                                        data-autofocus
                                                        onClick={() => {
                                                            onClose();
                                                            setSelectedSlot(null);
                                                        }}
                                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-l-lg"
                                                        >
                                                        <Square/>
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className={`flex-1 flex items-center justify-center py-2 px-4 text-white font-medium rounded-r-lg transition-colors
                                                                    ${ isLoading
                                                                        ? 'bg-blue-900 dark:bg-blue-950 cursor-not-allowed' // Style saat tombol mati
                                                                        : 'bg-blue-600 dark:bg-blue-800 hover:bg-blue-700 cursor-pointer dark:hover:bg-blue-900' // Style saat tombol aktif
                                                                    } text-white`}>
                                                        {isLoading ? (
                                                            <Loader2 size={24} className="animate-spin" />
                                                        )  : (
                                                            <Circle/>
                                                        )}
                                                    </button>
                                                
                                                </div>
                                            </form>
                                        ) }
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                       
                                          
                                       
                                        <div className="mb-3">
                                            <div className="flex justify-between">
                                                <button onClick={() => resetSemua()} className="py-1 px-3 bg-amber-400 dark:bg-amber-900/50 text-xs rounded text-white dark:text-amber-400 hover:bg-amber-500  dark:hover:bg-amber-900">
                                                Reset semua
                                                </button>
                                            </div>
                                            {/* <div className="flex text-xs text-gray-400 items-center">
                                                Total Slot : {totalSlot}
                                            </div> */}
                                        </div>
                                        <div className="w-full flex flex-col gap-2">
                                            {slot.map((s) => (
                                                <div key={s.row_number} className="flex justify-between gap-2">
                                                    <div className="flex w-full gap-2">
                                                        {s.col.map(c => {
                                                            const isMerged = c.span > 1;
                                                            const totalCols = s.col.length;
                                                            const isSelected = c.kode == selectedSlot?.kode;
                                                            const widthPercent = (c.span / totalCols) * 100;
                                                            const produkTerkait = products ? products.data.find((p:any) => p.id === c.produk_id) : null;
                                                            
                                                            return (  
                                                                <label key={c.kode} className="cursor-pointer"  style={{ width: `calc(${widthPercent}% - ${(8 * (totalCols - c.span)) / totalCols}px)` }}>
                                                                    <input type="radio" name="slot" className="peer hidden" onChange={() => setSelectedSlot(c)}/>      
                                                                    <div
                                                                    
                                                                        className={`
                                                                            min-h-20 flex flex-col gap-1
                                                                            rounded-lg border-[1.5px] px-3 py-2
                                                                            transition-colors duration-100 select-none relative
                                                                            ${isMerged
                                                                                ? isSelected ? "bg-emerald-100 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:text-emerald-400 min-w-50" : "bg-emerald-50 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-700 text-emerald-900 dark:text-emerald-400 min-w-50"
                                                                                : isSelected 
                                                                                    ? "bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-800 text-gray-400 min-w-30" 
                                                                                    : "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 min-w-30"
                                                                            }
                                                                            `}>
                                                                        {isMerged ? (
                                                                            produkTerkait ? (
                                                                                <>
                                                                                    
                                                                                <div className="flex mt-6 gap-2">
                                                                                    <img src={`${produkTerkait?.img_url}` } className="w-10 h-10" alt="" />

                                                                                    <div className="flex items-center">
                                                                                        <p className="text-xs dark:text-gray-300 p-auto">{produkTerkait?.nama}</p> 
                                                                                        <span className="absolute left-3 top-2 text-xs">{c.kode}</span>

                                                                                    </div> 
                                                                                </div>
                                                                                
                                                                                <div className="absolute right-1 top-1 flex items-center gap-2">
                                                                                        <span className="text-xs font-medium dark:text-gray-300 top-2 right-3"> {c.stock}</span>
                                                                                            <span className="text-[8px] py-0.5 px-2 bg-emerald-500 rounded-sm text-white dark:bg-emerald-700">
                                                                                                {c.span} kolom
                                                                                            </span>

                                                                                </div>
                                                                                
                                                                                </>

                                                                            ) : (
                                                                                <>
                                                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 absolute right-1 top-1 rounded-sm text-white dark:bg-emerald-700">
                                                                                        {c.span} kolom
                                                                                    </span>
                                                                                    <span className=" absolute left-3 top-2 text-xs font-medium">{c.kode}</span>
                                                                                    <p className="w-full h-full m-auto text-xs text-center">No Product</p>
                                                                                </>
                                                                            )
                                                                        ) : (
                                                                            produkTerkait ? (
                                                                                
                                                                                <div className="flex mt-6 gap-2">
                                                                                    <img src={`${produkTerkait?.img_url}` } className="w-10 h-10" alt="" />

                                                                                    <div className="flex items-center">
                                                                                        <p className="text-xs dark:text-gray-300 p-auto">{produkTerkait?.nama}</p> 
                                                                                        <span className="absolute left-3 top-2 text-xs">{c.kode}</span>
                                                                                        <span className="text-xs font-medium dark:text-gray-300 absolute top-2 right-3"> {c.stock}</span>

                                                                                    </div> 
                                                                                </div>
                                                                                

                                                                            ) : (
                                                                                <>
                                                                                    <span className="absolute left-3 top-2 text-xs">{c.kode}</span>
                                                                                    <p className="w-full h-full m-auto text-xs text-center">No Product</p>
                                                                        
                                                                                </>
                                                                            )
                                                                            
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogPanel>
                    </div>
               </div>
        </Dialog>
    );
}
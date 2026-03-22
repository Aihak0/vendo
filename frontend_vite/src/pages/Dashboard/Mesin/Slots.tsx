import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { type MesinSlotModalProps, type SlotRow, type Column} from "./Interface"
import { Table, ChevronDown, Apple, FileBox, Square, Loader2, Circle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getProducts } from '../../../services/api';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMesin } from "../../../services/api"; 
import { useAlert } from "../../UiElements/Alerts";

export function MesinSlot({isOpen, onClose, dataSlot}: MesinSlotModalProps){
    const [isLoading, setLoading] = useState(false);
    const [slot, setSlot] = useState<SlotRow[]>([]);

    const [selectedSlot, setSelectedSlot] = useState<Column>();

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
        console.log("==>>", name)
        console.log("==>>", finalValue)
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
            if (!prev) return undefined;
            return {
                ...prev,
                [name]: finalValue
            } as Column;
        });
    };

    useEffect(() => {
        console.log("selectedSl", selectedSlot);
        console.log("Slot nyaaaa", slot);
    }, [slot, selectedSlot]);

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
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
               <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity" />
               <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                        <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-gray-100 text-left shadow-xl outline outline-white/10 transition-all h-fit w-fit">
                            {errorGetProduk ? ( <div className="p-10 text-red-500 bg-[#121212] min-h-screen">Gagal memuat data: {(errorGetProduk as any).message}</div>) :
                            (
                                <>
                                    <div className="flex flex-col w-fit px-1 min-w-md">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 sm:mx-0 sm:size-10">
                                                <Table aria-hidden="true" className="size-6 text-green-400" />
                                            </div>
                                            <div className="flex items-stretch h-full ml-3">
                                                <DialogTitle className=" flex items-center text-base font-semibold">
                                                    Slot Mesin
                                                </DialogTitle>
                                            </div>
                                        </div>
                                        {selectedSlot ? (

                                            <form onSubmit={handleUpdateSlot} className="py-2 space-y-5 relative h-full min-h-55">
                                                <div className="mb-3">
                                                    <label className="block mb-2.5 text-sm font-medium text-xs">Produk</label>
                                                    <div className="relative flex-1">
                                                        <Apple className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"/>
                                                        <select name="produk_id" value={selectedSlot.produk_id || ""} onChange={(e) => handleSlotChange(selectedSlot.kode, e)} className="w-full bg-slate-200 py-2 placeholder:text-slate-400 text-gray-700 text-sm border-0 rounded pl-10 pr-8 transition duration-300 ease focus:ring-4 focus:outline-none focus:ring-slate-400/50 focus:ring-offset-1 shadow-sm focus:shadow-md appearance-none cursor-pointer">
                                                            <option value="" disabled>Pilih Produk</option>
                                                            {products.map((p: any) => (
                                                                <option key={p.id} value={p.id}>{p.nama}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={17} className="absolute top-2.5 right-2.5 text-gray-500"/>
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <label className="block mb-2.5 text-sm font-medium text-xs">Stok</label>
                                                    <div className="relative flex-1">
                                                        <FileBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"/>
                                                        <input type="number" name="stock" value={selectedSlot.stock === 0 ? "" : selectedSlot.stock} 
                                                            onKeyDown={(e) => {
                                                                if (e.key === '-' || e.key === 'e') e.preventDefault();
                                                            }} 
                                                            onChange={(e) => handleSlotChange(selectedSlot.kode, e)} 
                                                            placeholder="Stok"
                                                            className="w-full bg-slate-200 py-2 placeholder:text-slate-400 text-gray-700 text-sm border-0 rounded pl-10 pr-8 transition duration-300 ease focus:ring-4 focus:outline-none focus:ring-slate-400/50 focus:ring-offset-1 shadow-sm focus:shadow-md appearance-none"/>
                                                    </div>
                                                </div>
                                                <div className="flex absolute bottom-0 w-full">
                                                    <button
                                                        type="button"
                                                        data-autofocus
                                                        onClick={() => onClose()}
                                                        className="flex-1 flex items-center justify-center text-center py-2 px-4 bg-slate-400 text-white font-medium hover:bg-slate-500 cursor-pointer transition-colors rounded-l shadow-lg focus:shadow-md"
                                                        >
                                                        <Square/>
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className={`flex-1 flex items-center justify-center py-2 px-4 bg-blue-500 text-white font-medium rounded-r transition-colors
                                                                    ${ isLoading
                                                                        ? 'bg-blue-200 cursor-not-allowed' 
                                                                        : 'bg-blue-300 hover:bg-blue-600 cursor-pointer'
                                                                    } text-white`}>
                                                        {isLoading ? (
                                                            <Loader2 size={24} className="animate-spin" />
                                                        )  : (
                                                            <Circle/>
                                                        )}
                                                    </button>
                                                
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="py-2 space-y-5 relative h-full min-h-55">
                                                <h4>Silahkan Pilih Slot</h4>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col ml-6 ">
                                        <div className="flex">
                                            <div className=" mb-3">
                                                <DialogTitle className="text-base text-xl">
                                                    Slot Mesin
                                                </DialogTitle>
                                                <p className="text-sm text-gray-400 mt-2">
                                                    Seret slot ke kiri atau kanan untuk menggabungkan. Klik slot hijau untuk memisahkan.
                                                </p>
                                            </div>
                                            <span className="text-xs text-blue-600 font-mono">ID: {idMesin.slice(0,8)}</span>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex justify-between">
                                                <button  className="py-1 px-3 bg-amber-400 text-xs rounded text-white hover:bg-amber-500 shadow-md shadow-amber-300/50">
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
                                                            const widthPercent = (c.span / totalCols) * 100;

                                                            return (  
                                                                <label key={c.kode} className="cursor-pointer"  style={{ width: `calc(${widthPercent}% - ${(8 * (totalCols - c.span)) / totalCols}px)` }}>
                                                                    <input type="radio" name="slot" className="peer hidden" onChange={() => setSelectedSlot(c)}/>      
                                                                    <div
                                                                    
                                                                        className={`
                                                                        min-h-20 flex flex-col items-center justify-center gap-1
                                                                        rounded-lg border-[1.5px] text-center px-3 py-2
                                                                        transition-colors duration-100 select-none relative
                                                                        peer-checked:border-blue-500 
                                                                        peer-checked:bg-blue-50 
                                                                        hover:border-gray-400
                                                                        ${isMerged
                                                                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 "
                                                                            : "bg-white border-gray-300 text-gray-400 "
                                                                        }
                                                                        `}>
                                                                        {isMerged ? (
                                                                        <>
                                                                            <span className="text-xs font-medium">{c.kode}</span>
                                                                            <span className="text-[8px] py-0.5 px-2 bg-emerald-500 absolute right-1 top-1 rounded-sm text-white">
                                                                                {c.span} kolom
                                                                            </span>
                                                                            <span className="text-[10px] text-emerald-700 opacity-70">klik untuk pisah</span>
                                                                        </>
                                                                        ) : (
                                                                            <span className="text-xs">{c.kode}</span>
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
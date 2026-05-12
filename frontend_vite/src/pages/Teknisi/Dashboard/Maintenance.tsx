import { useEffect, useState } from "react";
import type { MesinInfoModalProps, MesinMaintenanceModalProps } from "./interface";
import type { Column, SlotRow } from "../../Dashboard/Mesin/Interface";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Circle, Info, Loader2, Minus, Plus, Square } from "lucide-react";
import { MapContainer } from "../../../components/MapLokasi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, updatedSlot } from "../../../services/api";
import { useAlert } from "../../UiElements/Alert";

export function MesinMaintenanceModal({isOpen, onClose, dataMesin}: MesinMaintenanceModalProps){
  
  const { data: products, error: errorGetProduk, isLoading: produkLoading } = useQuery({
      // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
      queryKey: ['products'], 
      queryFn: () => getProducts(undefined, undefined, undefined, null, null, "true"),
  });
  
  const [slot, setSlot] = useState<SlotRow[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Column | null>(null);
  const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();
    const alert = useAlert();
  const formatIDR = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  });

  const handleSlotChange = (kode: string, event: any) => {
    console.log("dijalankan")
      const { name, value } = event.target;

      
      let finalValue: any = value;

      if (name === "added_stock") {
  
          finalValue = value === "" ? "" : Number(value);
      }
      setSlot((prev) => 
    
          prev.map((row) => ({
              ...row,
              col: row.col.map((c) => {
                  if (c.kode === kode) {
                      return { ...c, [name]: finalValue, changed: true };
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

  const mutation = useMutation({
      
        mutationFn: updatedSlot, 
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ManagedMesin'] });
            alert.success("Mesin berhasil diperbarui");
            onClose();
        },
        onError: (err: any) => {
            alert.error(err.message || "Gagal memperbarui Data");
        },
        onSettled: () => setIsLoading(false)
    });

  const handleUpdateSlot = () => {
    setIsLoading(true);
    if(!dataMesin) return;
    const dataSlot = slot.flatMap((r) => 
        r.col
            .filter((c) => c.changed) // Filter dulu agar tidak ada data kosong
            .map((c) => ({
                slot_id: c.id,
                qty: c.added_stock || 0,
                ...(c.produk && {
                    produk_id: c.produk_id || c.produk.id,
                    nama_produk: c.produk.nama
                })
            }))
    );
    
    const payload = {
        mesin_id: dataMesin.id,
        dataSlot
    }
    console.log("datapayload apa ini? =>", payload);
    mutation.mutate(payload);
  } 
  

    useEffect(() => {
          if (dataMesin && isOpen) {
              const slots = dataMesin.slot;
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
                    id: curr.id,
                    stock: curr.stock || 0,
                    ...(curr.produk && {
                        produk_id: curr.produk_id,
                        produk: curr.produk
                    }),
                });
  
                // Urutkan kolom berdasarkan col_number agar rapi
                row.col.sort((a, b) => a.col_number - b.col_number);
  
                return acc;
              }, []);
  
              groupedByRow.sort((a, b) => a.row_number - b.row_number);
  
              setSlot(groupedByRow);
              setSelectedSlot(null);
          }
      }, [dataMesin, isOpen]);
      useEffect(() =>{
        console.log("dataSlot => ", slot);
      },[slot])
      return(
         <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop transition className="fixed inset-0 bg-zinc-900/50 transition-opacity" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full justify-center p-4 items-center sm:p-0">
                  <DialogPanel className="flex relative p-6 transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline outline-blue-50 dark:outline-blue-950 transition-all h-fit mt-10 mb-10 ">
                      
                      {/* Form Section */}
                    <div className="flex flex-col w-fit px-1 min-w-md">
                        <div className="sm:flex sm:items-start mb-3">
                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 sm:mx-0 sm:size-10">
                                <Info aria-hidden="true" className="size-6 text-blue-400" />
                            </div>
                            <div className="items-stretch w-full ml-3">
                                { dataMesin ? (
                                    <>
                                    <div className="flex items-center w-full justify-between">
                                      <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        {dataMesin?.nama}
                                      </DialogTitle>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dataMesin.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : dataMesin.status === 'offline' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }`} >
                                        {dataMesin.status}
                                      </span>
                                    </div>
                                    <div className="text-gray-400 flex items-center">
                                      <p className="text-sm text-blue-400 dark:text-blue-500">{dataMesin.kode}</p>
                                    </div>
                                    <p className="text-sm text-gray-400">{[
                                                                                    dataMesin.desa,
                                                                                    dataMesin.kecamatan,
                                                                                    dataMesin.kabupaten,
                                                                                    dataMesin.provinsi,
                                                                                    dataMesin.negara,
                                                                                    dataMesin.kodePos,
                                                                                ]
                                                                                .filter(Boolean)
                                                                                .join(", ")}</p>
                                    
                                    </>
                                ): (
                                    <DialogTitle className=" flex items-center text-base dark:text-gray-300 font-semibold">
                                        Mesin tidak ditemukan
                                    </DialogTitle>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex md:flex-col lg:flex-row gap-3 mb-4">
                            <div className="pr-2">

                                <div className="overflow-y-auto max-h-[400px] w-[500px]">
                                    <div className="flex items-center gap-3 py-1 mb-2">
                                        <div className="flex-1 h-px bg-blue-400 dark:bg-slate-600" />
                                            <span className="block text-sm text-xs text-blue-400 dark:text-slate-500">
                                                Slot Mesin
                                            </span>
                                        <div className="flex-1 h-px bg-blue-400 dark:bg-slate-600" />
                                    </div>
                                    <div className="flex flex-col">

                                        {slot.map((s) => (
                                            <div key={s.row_number} className="flex justify-between mb-2">
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
                                                                        h-18 flex flex-col gap-1
                                                                        rounded-lg border-[1.5px] 
                                                                        transition-colors duration-100 select-none relative
                                                                        ${isSelected && 'brightness-120'}
                                                                        ${c.produk && c.stock === 0 ? 'bg-red-200 dark:bg-red-950  border-red-300 dark:border-red-700 text-red-500' :  c.stock && c.stock <= 5 ? 'bg-yellow-200 dark:bg-yellow-950  border-yellow-300 dark:border-yellow-700 text-yellow-500' : c.produk && c.stock && c.stock > 5 ? 'bg-green-200 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-400 ' : 
                                                                         "bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 "
                                                                        }
                                                                        `}>
                                                                    {
                                                                        
                                                                        produkTerkait ? (
                                                                            
                                                                            <div className="flex  gap-2 justify-center items-center">
                                                                                <img src={`${produkTerkait?.img_url}` } className={`w-full h-10 aspect-square rounded-t-lg object-cover mb-1 brightness-70 `}  alt="" />
                                                                                <span className="absolute left-3 bottom-2 text-xs">{c.kode}</span>
                                                                                <span className="text-xs font-medium dark:text-gray-300 absolute bottom-2 right-3"> {(c.stock || 0) } {c.added_stock && `+${c.added_stock}`}</span>
                                                                                {isMerged &&           
                                                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 absolute right-1 top-1 rounded-sm text-white dark:bg-emerald-700">
                                                                                        {c.span} kolom
                                                                                    </span>
                                                                                }
                                                                            </div>
                                                                            

                                                                        ) : (
                                                                            <div className="flex h-full items-center justify-center">
                                                                                <p className="text-xs text-center">No Product</p>
                                                                                <span className="absolute left-3 bottom-2 text-xs">{c.kode}</span>
                                                                                {isMerged &&           
                                                                                    <span className="text-[8px] py-0.5 px-2 bg-emerald-500 absolute right-1 top-1 rounded-sm text-white dark:bg-emerald-700">
                                                                                        {c.span} kolom
                                                                                    </span>
                                                                                }
                                                                            </div>
                                                                        )
                                                                        
                                                                    }
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                          <div className="lg:max-w-100 md:w-[500px]">
                            
                            {produkLoading ? (
                              <p>memuat</p>
                            ) : (
                              selectedSlot &&
                              <>
                          
                              <div className="flex justify-between items-center items-stretch gap-3">
                                <button disabled={ !selectedSlot.stock || selectedSlot.stock === 0} onClick={() => handleSlotChange(selectedSlot.kode, {target: {name:"stock", value: (selectedSlot.stock || 0)- 1}})} 
                                        className="bg-slate-900 px-3 py-6 rounded-lg text-gray-300 border border-slate-700 disabled:text-gray-400"><Minus /></button>
                                <input type="text" disabled value={selectedSlot.stock ? selectedSlot.stock : 0} className="min-w-0 w-full text-gray-300 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded px-4 py-2 text-xl text-center  placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all" />
                                <input type="number" value={!selectedSlot.added_stock || selectedSlot.added_stock === 0 ? "" : selectedSlot.added_stock} 
                                    onKeyDown={(e) => {
                                        if (e.key === '-' || e.key === 'e') e.preventDefault();}} 
                                    onChange={(e) => handleSlotChange(selectedSlot.kode, {target: {name:"added_stock", value: e.target.value}})}
                                    placeholder="Masukkan Penambahan stock"   
                                    className="min-w-0 w-full text-gray-300 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded px-4 py-2 text-xl text-center  placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-50 dark:focus:ring-slate-500/20 transition-all"/>
                                <button 
                                     onClick={() => handleSlotChange(selectedSlot.kode, {target: {name:"added_stock", value: (selectedSlot.added_stock || 0) + 1}})}
                                    className="bg-slate-900 px-3 py-6 rounded-lg text-gray-400"><Plus /></button>
                              </div>
                                <div className="flex items-center gap-3 py-1 mb-2">
                                    <div className="flex-1 h-px bg-blue-400 dark:bg-slate-600" />
                                        <span className="block text-sm text-xs text-blue-400 dark:text-slate-500">
                                            Produk
                                        </span>
                                    <div className="flex-1 h-px bg-blue-400 dark:bg-slate-600" />
                                </div>
                                <div className="grid grid-cols-4 gap-4"> {/* Container utama */}
                                    {products.data.map((p: any) => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => {
                                        // Kita "tembak" fungsi handleSlotChange dengan objek buatan
                                        handleSlotChange(selectedSlot.kode, {
                                            target: {
                                            name: "produk_id", 
                                            value: p.id         
                                            }
                                        } as any
                                        ); 
                                        handleSlotChange(selectedSlot.kode, {
                                            target: {
                                            name: "produk", 
                                            value: p
                                            }
                                        } as any
                                        ); 
                                        }}
                                        className={`group relative h-fit bg-slate-900 text-gray-300 rounded-lg transition-all duration-300  brightness-60 ${selectedSlot.produk_id === p.id ? 'scale-120 brightness-110' : 'hover:scale-120 hover:brightness-110'} hover:shadow-xl hover:shadow-black/50 z-0 hover:z-10 cursor-pointer`}
                                    >
                                        <img 
                                        src={p.img_url} 
                                        className="w-full aspect-square rounded-t-lg object-cover mb-1 transition-transform duration-300 g" 
                                        />
                                        <div className="p-2 w-full">
                                            <p className={`text-sm ${selectedSlot.produk_id === p.id ? 'whitespace-normal' : 'truncate group-hover:whitespace-normal'}`}>{p.nama}</p>
                                            <p className="font-medium text-[10px] text-blue-400">{formatIDR.format(p.harga)}</p>

                                        </div>

                                        {/* Efek Popup Tambahan (Opsional: Munculkan tombol saat hover) */}
                                        
                                    </div>
                                    ))}
                                </div>
                              </>
                            ) }
                          </div>
                        </div>
                       <div className="flex bottom-0 w-full">
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
                                onClick={() => {
                                    handleUpdateSlot();
                                }}
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
                       
                    </div>
                  </DialogPanel>
              </div>
            </div>
        </Dialog>
      );

}
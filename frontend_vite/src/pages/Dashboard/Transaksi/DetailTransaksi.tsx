import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Calendar, CreditCard, DollarSign, Eye, Package, Square } from "lucide-react";
import dayjs from "dayjs";
import 'dayjs/locale/id';
interface DetailTransaksiProps {
    isOpen: boolean;
    onClose: () => void;
    dataDetail: any; // Ganti dengan tipe data yang sesuai untuk detail transaksi
}
export function DetailTransaksi({isOpen, onClose, dataDetail}: DetailTransaksiProps) {
    if (!dataDetail) return null;
    dayjs.locale('id'); 

     const formatPrice = (price: number): string => {
        return price ? price.toLocaleString('id-ID') : '0';
    };
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <DialogBackdrop transition className="fixed inset-0 bg-zinc-300/50 dark:bg-zinc-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"/>
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-6 text-center sm:items-center sm:p-0">
                    <DialogPanel transition className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 dark:outline-blue-950 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-20 sm:w-full lg:max-w-150 data-closed:sm:translate-y-0 data-closed:sm:scale-95">
                    <div className=" px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-slate-700">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 sm:mx-0 sm:size-10">
                                <Eye aria-hidden="true" className="size-6 text-blue-500" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <div className="">
                                    <DialogTitle className="text-xl font-bold text-slate-700 dark:text-gray-300 font-semibold">
                                        Detail Transaksi
                                    </DialogTitle>
                                    <p className="text-sm text-gray-600 mt-1 dark:text-gray-500">
                                        Order ID: {dataDetail.order_id}
                                    </p>

                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Status Transaksi</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium  ${dataDetail.status === 'complete' ? `text-emerald-500 bg-emerald-500/20` : dataDetail.status === 'cancel' ? `text-red-500 bg-red-500/20` : `text-slate-500 dark:text-gray-400 bg-slate-500/20`}  px-3 py-0.5 rounded-full`}>
                                        {dataDetail.status}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={14} className="text-gray-400 dark:text-gray-400" />
                                        <p className="text-sm text-slate-500 dark:text-gray-400 ">Waktu Transaksi</p>
                                    </div>
                                    <p className="text-slate-600 font-medium dark:text-gray-300">{dayjs(dataDetail.updated_at).format('dddd, DD MMMM YYYY HH:mm')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard size={14} className="text-slate-500 dark:text-gray-400" />
                                        <p className="text-sm text-slate-500 dark:text-gray-400">Status Pembayaran</p>
                                    </div>
                                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dataDetail.status_pembayaran === 'settlement' ? `text-emerald-500 bg-emerald-500/20` : ( dataDetail.status_pembayaran === 'cancel' || dataDetail.status_pembayaran === 'deny' || dataDetail.status_pembayaran === 'refund') ? `text-red-500 bg-red-500/20` : dataDetail.status_pembayaran === 'expire' ? `text-yellow-500 bg-yellow-500/20` : `text-slate-500 bg-slate-500/20`}`}>
                                        {dataDetail.status_pembayaran}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign size={14} className="text-slate-500 dark:text-gray-400" />
                                        <p className="text-sm text-slate-500 dark:text-gray-400">Total</p>
                                    </div>
                                    <p className={`text-2xl font-bold text-emerald-500 dark:text-green-500`}>
                                        Rp {formatPrice(dataDetail.total)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        {dataDetail.detail_transaksi && dataDetail.detail_transaksi.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Package size={18} className="text-slate-500 dark:text-gray-400" />
                                    <h3 className="text-lg font-semibold text-slate-500 dark:text-gray-400">
                                        Item Transaksi ({dataDetail.detail_transaksi.length})
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {dataDetail.detail_transaksi.map((item: any, index: number) => (
                                        <div 
                                            key={item.id} 
                                            className="bg-blue-50/50 dark:bg-slate-900 rounded-lg p-4 hover:bg-gray-200 transition-colors border border-blue-100 dark:border-blue-950"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs bg-white dark:bg-slate-800/70 text-slate-500 dark:text-gray-300 px-2 py-0.5 rounded">
                                                            #{index + 1}
                                                        </span>
                                                        <p className="text-slate-500 font-medium dark:text-gray-300">{item.produk_nama}</p>
                                                    </div>
        
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300 dark:border-slate-800">
                                                <div className="flex gap-4 text-sm">
                                                    <div className="flex gap-1">
                                                        <span className="text-slate-500 dark:text-gray-400">Qty: </span>
                                                        <span className="text-slate-700 font-semibold dark:text-gray-300">{item.qty}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <span className="text-slate-500 dark:text-gray-400">Harga: </span>
                                                        <span className="text-slate-700 dark:text-gray-300">Rp {formatPrice(item.produk_harga)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 dark:text-gray-400">Subtotal</p>
                                                    <p className="text-lg font-bold text-slate-500 dark:text-gray-300">
                                                        Rp {formatPrice(item.subtotal)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                        {/* Jika tidak ada items */}
                        {(!dataDetail.detail_transaksi || dataDetail.detail_transaksi.length === 0) && (
                            <div className="text-center py-8 text-gray-400">
                                <Package size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Tidak ada detail item untuk transaksi ini</p>
                            </div>
                        )}
                        <button
                            type="button"
                            data-autofocus
                            onClick={() => onClose()}
                            className="flex-1 flex w-full items-center justify-center text-center py-2 px-4 bg-gray-500 dark:bg-slate-600 text-white dark:text-gray-300 font-medium hover:bg-gray-600 dark:hover:bg-slate-700 cursor-pointer transition-colors rounded-lg"
                            >
                            <Square/>
                        </button>
                    </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
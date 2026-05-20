import { useQuery } from '@tanstack/react-query';
import { getTransaksi } from '../../../services/api';
import { Search, ChevronDown, Eye} from 'lucide-react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { DetailTransaksi } from './DetailTransaksi';
import { FilterDropdown } from '../../../components/ui/dropdown/Dropdown';

const filterStatusTransaksiStyles = {
  complete: { label: "Complete", dot: "bg-green-400"},
  cancel: { label: "Cancel",  dot: "bg-red-400" },
  process: { label: "Process", dot: "bg-blue-400" },
  pending: { label: "Pending", dot: "bg-gray-400"},
  all: { label: "Semua Status Transaksi"}
}
const filterStatusTransaksiTypes = ["all", "pending", "process", "cancel", "complete"];

const filterStatusPembayaranStyles = {
  settlement: { label: "Settlement", dot: "bg-green-400"},
  cancel: { label: "Cancel",  dot: "bg-red-400" },
  refund: { label: "Refund",  dot: "bg-red-400" },
  deny: { label: "Deny",  dot: "bg-red-400" },
  expire: { label: "Expire",  dot: "bg-yellow-400" },
  pending: { label: "Pending", dot: "bg-gray-400"},
  all: { label: "Semua Status Pembayaran"}
}
const filterStatusPembayaranTypes = ["all", "pending", "settlement", "cancel", 'refund', "deny", "expire"];


export default function TransaksiPage() {
  dayjs.locale('id'); 
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeStatusTransaksi, setActiveStatusTransaksi] = useState('all');
  const [activeStatusPembayaran, setActiveStatusPembayaran] = useState('all');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<any[]>([]);
  const [ openModalDetail, setOpenModalDetail] = useState(false);
  const [ dataDetail, setDataDetail] = useState<any>(null);
  
  const columns = [
    { key: "order_id", label: "Order ID" },
    { key: "mesin", label: "Mesin" },
    { key: "status", label: "Status Order" },
    { key: "status_pembayaran", label: "Status Pembayaran" },
    { key: "total", label: "total" },
    { key: "tanggal", label: "Waktu Transaksi" },
  ];
  const { data: transaksi, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['transaksi', page, limit, sortAsc, sortKey, searchTerm, activeStatusTransaksi, activeStatusPembayaran], 
    queryFn: () => getTransaksi(page, limit, sortAsc, sortKey, searchTerm, activeStatusTransaksi, activeStatusPembayaran),
  });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };
  const handleReset = () => {
    setInputValue('');
    setSearchTerm('');
    setActiveStatusPembayaran("all");
    setActiveStatusTransaksi("all");
    setSortKey(null);
    setSortAsc(true);
    setPage(1);
    setLimit(10);
    setSelected([]);
  }

  
  useEffect(() => {
    console.log("transaksi data =>", transaksi);
  },[transaksi])
  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-300">Transaksi</h1>
          { isLoading ? (
            <div className=' px-20 py-2 bg-slate-800 mt-1 rounded-full'/>
          ) : (
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{transaksi?.data?.length} dari {transaksi?.metadata?.totalData} Transaksi ditampilkan</p>  
          )}
        </div>
        
    
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-blue-100 dark:border-blue-950 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-blue-900">
        
          <div className="flex gap-2">
               <FilterDropdown activeFilter={activeStatusTransaksi} onChange={setActiveStatusTransaksi}  style={filterStatusTransaksiStyles} filter={filterStatusTransaksiTypes}/>
               <FilterDropdown activeFilter={activeStatusPembayaran} onChange={setActiveStatusPembayaran}  style={filterStatusPembayaranStyles} filter={filterStatusPembayaranTypes}/>
               <div className="relative">
                <select
                    className={`overflow-hidden appearance-none transition duration-300 ease-in-out truncate p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none dark:text-gray-200 bg-blue-50/50 dark:bg-slate-900 cursor-pointer`}
                    value={limit}
                    onChange={(e) => {
                    setLimit(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 30].map((n) => (
                    <option key={n} value={n}>
                        {n}
                    </option>
                    ))}
                    { isLoading ? <option value={limit}>Loading...</option> :  <option key={transaksi?.metadata?.totalData} value={transaksi?.metadata?.totalData}>
                        Semua
                    </option> }
                   
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2`}>
                    <ChevronDown size={12}/>
                </div>
              </div>
             <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <input 
                  type="text" 
                  placeholder="Cari Transaksi dan tekan enter..." 
                  className="transition duration-300 ease-in-out pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg w-full focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none dark:text-gray-200 bg-blue-50/50 dark:bg-slate-900"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                
              </div>
              
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Cari
              </button>
            </form>
              <button 
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 dark:bg-gray-700 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Reset semua
              </button>
            </div>
            
          <div className="flex gap-3">
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{selected.length} dipilih</span>
                <button
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition">Hapus</button>
              </div>
            )}
           

          
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-700 border-b border-blue-100 dark:border-blue-900">
                {/* <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === transaksi?.data?.length && transaksi?.data?.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer rounded border transition-all duration-200
                                        appearance-none 
                                        bg-white border-slate-300 
                                        checked:bg-blue-500 checked:border-blue-500
                                        checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                                        bg-center bg-no-repeat bg-[length:12px_12px]
                                        dark:bg-slate-900 dark:border-slate-700 
                                        dark:checked:bg-blue-600 dark:checked:border-blue-600"
                  />
                </th> */}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <span className="text-slate-500 dark:text-gray-400 group-hover:text-slate-500 transition">
                        {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                  <>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length + 1} className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length} className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length - 1  } className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  </>
                )}
                {error && (
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length + 2} className="text-center py-12 text-red-400 dark:text-red-800 text-sm">
                      Gagal Memuat Data: {(error as any).message}
                    </td>
                  </tr>
                )}
              {transaksi?.data?.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                transaksi?.data?.map((row: any) => (
                  <tr
                    key={row.id}
                    className={`transition-colors border-b border-slate-200 dark:border-blue-900 hover:bg-slate-50 dark:hover:bg-slate-700 ${selected.some(item => item.id === row.id) ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                  >
                    {/* <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.some(item => item.id === row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className={ `w-4 h-4 cursor-pointer rounded border transition-all duration-200
                                        appearance-none 
                                        bg-white border-slate-300 
                                        checked:bg-blue-500 checked:border-blue-500
                                        checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%2220%206%209%2017%204%2012%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
                                        bg-center bg-no-repeat bg-[length:12px_12px]
                                        dark:bg-slate-900 dark:border-slate-700 
                                        dark:checked:bg-blue-600 dark:checked:border-blue-600`}
                      />
                    </td> */}
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">...{row.order_id.slice(-9)}</td>
                    <td className="text-sm font-medium text-slate-800 dark:text-gray-300">{row.mesin_nama}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'complete' ? `text-emerald-500 bg-emerald-500/20` : row.status === 'cancel' ? `text-red-500 bg-red-500/20` : row.status === 'process' ? `text-blue-500 bg-blue-500/20` : `text-slate-500 bg-slate-500/20`}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status_pembayaran === 'settlement' ? `text-emerald-500 bg-emerald-500/20` : ( row.status_pembayaran === 'cancel' || row.status_pembayaran === 'deny' || row.status_pembayaran === 'refund') ? `text-red-500 bg-red-500/20` : row.status_pembayaran === 'expire' ? `text-yellow-500 bg-yellow-500/20` : `text-slate-500 bg-slate-500/20`}`}>
                        {row.status_pembayaran}
                      </span>
                    </td>
                    <td className="text-sm font-medium text-slate-800 dark:text-gray-300">{row.total}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">{!row.updated_at ? ("nihil") : dayjs(row.updated_at).format('dddd, DD MMMM YYYY HH:mm')}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setDataDetail(row);
                            setOpenModalDetail(true);
                          }}
                              className={`p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-100/60 dark:hover:bg-slate-800 transition`}>
                              <Eye size={14}/>
                        </button>
                      
                      </div>
                    
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
          <div className="px-6 py-3 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <span className="text-xs text-slate-400">Menampilkan {transaksi?.data?.length} entri</span>
            <div className="flex gap-1">
              {Array.from({ length: transaksi?.metadata?.totalPages }, (_, i)  => {
                const p = i+1;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === transaksi?.metadata?.currentPage ? "bg-blue-600 dark:bg-slate-900 text-gray-300" : "text-slate-500 hover:bg-slate-100"}`}>
                  {p}
                </button>
              )})}
            </div>
          </div>
        </div>
    </div>
    <DetailTransaksi
      isOpen={openModalDetail}
      onClose={() => setOpenModalDetail(false)}
      dataDetail={dataDetail}
    />
    </>
  );
}
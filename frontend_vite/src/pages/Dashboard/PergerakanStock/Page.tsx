import { useQuery } from '@tanstack/react-query';
import { getPergerakanStok } from '../../../services/api';
import { Search, ChevronDown} from 'lucide-react';
import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { FilterDropdown } from '../../../components/ui/dropdown/Dropdown';

const filterTipePerubahanStyles = {
  sale: { label: "Penjualan", dot: "bg-green-400"},
  restock: { label: "Restock",  dot: "bg-yellow-400" },
  adjust: { label: "Penyesuaian", dot: "bg-blue-400" },
  all: { label: "Semua Tipe Perubahan"}
}
const filterTipePerubahanTypes = ["all", "adjust", "restock", "sale"];


export default function PergerakanStockPage() {
  dayjs.locale('id'); 
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTipePerubahan, setActiveTipePerubahan] = useState('all');

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<any[]>([]);
  
  const columns = [
    { key: "no", label: "No" },
    { key: "nama_mesin", label: "Mesin" },
    { key: "kode_slot", label: "Kode Slot" },
    { key: "tipe_perubahan", label: "Tipe Perubahan" },
    { key: "nama_produk", label: "Produk" },
    { key: "qty", label: "Jumlah" },
    { key: "created_at", label: "Waktu" },
  ];

  const handleReset = () => {
    setInputValue('');
    setSearchTerm('');
    setActiveTipePerubahan("all");
    setSortKey(null);
    setSortAsc(true);
    setPage(1);
    setLimit(10);
    setSelected([]);
  }

  const getBadgeStyle = (kode: string) => {
    // Ambil huruf pertama (misal: 'a' dari 'a1')
    const prefix = kode.charAt(0).toLowerCase();

    switch (prefix) {
      case 'a':
        return 'text-emerald-500 bg-emerald-500/20';
      case 'b':
        return 'text-blue-500 bg-blue-500/20';
      case 'c':
        return 'text-amber-500 bg-amber-500/20';
      case 'd':
        return 'text-rose-500 bg-rose-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20'; // Warna default
    }
  };

  const { data: pergerakanStock, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['pergerakan-stock', page, limit, sortAsc, sortKey, searchTerm, activeTipePerubahan], 
    queryFn: () => getPergerakanStok( page, limit, sortAsc, sortKey, searchTerm, activeTipePerubahan),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-300">Pergerakan Stok</h1>
          { isLoading ? (
            <div className=' px-20 py-2 bg-slate-800 mt-1 rounded-full'/>
          ) : (
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{pergerakanStock?.data?.length} dari {pergerakanStock?.metadata?.totalData} Transaksi ditampilkan</p>  
          )}
        </div>
      </div>
    
      <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-blue-100 dark:border-blue-950 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-blue-900">
        
           <div className="flex gap-2">
              <FilterDropdown activeFilter={activeTipePerubahan} onChange={setActiveTipePerubahan}  style={filterTipePerubahanStyles} filter={filterTipePerubahanTypes}/>
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
                    { isLoading ? <option value={limit}>Loading...</option> :  <option key={pergerakanStock?.metadata?.totalData} value={pergerakanStock?.metadata?.totalData}>
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
                
                {columns.map((col) => {
                   const isSortable = col.key !== "no";
                    const onClickProps = isSortable ? { onClick: () => toggleSort(col.key) } : {};
                  return(
                  <th
                    key={col.key}
                    {...onClickProps}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {isSortable && (
                        <span className="text-slate-500 dark:text-gray-400 group-hover:text-slate-500 transition">
                          {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                )})}
              
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
                    <td colSpan={columns.length - 1 } className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
                      <div className='bg-slate-100 dark:bg-slate-700 p-3 rounded-full'>

                      </div>
                    </td>
                  </tr>
                  <tr className='border-b border-slate-200 dark:border-blue-900'>
                    <td colSpan={columns.length - 2  } className="animate-pulse text-center px-4 py-5 text-slate-400 text-sm ">
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
              {pergerakanStock?.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                pergerakanStock?.data?.map((row: any, index: number) => (
                  <tr
                    key={row.id}
                    className={`transition-colors border-b border-slate-200 dark:border-blue-900 hover:bg-slate-50 dark:hover:bg-slate-700 ${selected.some(item => item.id === row.id) ? "bg-blue-50 dark:bg-blue-950" : ""}`}
                  >
                   
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">{row.nama_mesin}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">
                      {row.kode_slot ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium  ${getBadgeStyle(row.kode_slot)}`}>
                          {row.kode_slot}
                        </span>
                        
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-gray-500 bg-gray-500/20`}>
                          null
                        </span>

                      )}
                      </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.tipe_perubahan === 'sale' ? `text-emerald-500 bg-emerald-500/20` : row.tipe_perubahan === 'restock' ? `text-yellow-500 bg-yellow-500/20` : row.status === 'adjust' ? `text-blue-500 bg-blue-500/20` : `text-slate-500 bg-slate-500/20`}`}>
                        {row.tipe_perubahan === 'sale' ? 'Penjualan' : row.tipe_perubahan === 'restock' ? 'Restock' : 'Penyesuaian' }
                      </span>
                     </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300 flex items-center gap-2">
                       {row.produk.img_url ? (
                          <img src={row.produk.img_url} className='h-7' alt="" />
                      ) : 
                          <div className="w-8 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            no image
                          </div>
                        
                      }
                      {row.produk.nama}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-300">{row.qty}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-gray-400">{!row.created_at ? ("nihil") : dayjs(row.created_at).format('dddd, DD MMMM YYYY HH:mm')}</td>
                  
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
          <div className="px-6 py-3 border-t border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <span className="text-xs text-slate-400">Menampilkan {pergerakanStock?.data?.length} entri</span>
            <div className="flex gap-1">
              {Array.from({ length: pergerakanStock?.metadata?.totalPages }, (_, i)  => {
                const p = i+1;
              return (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === pergerakanStock?.metadata?.currentPage ? "bg-blue-600 dark:bg-slate-900 text-gray-300" : "text-slate-500 hover:bg-slate-100"}`}>
                  {p}
                </button>
              )})}
            </div>
          </div>
        </div>
    </div>
  
    </>
  );
}
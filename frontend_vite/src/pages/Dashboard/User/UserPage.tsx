import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, getUser } from '../../../services/api';
import { Plus, Search, Filter, PenLine, Activity, EllipsisVertical, CircleSlash, ChevronDown, ArrowUp, ArrowDown} from 'lucide-react';
import { ProdukAdd } from './Add';
import { ProdukEdit} from './Edit';
import { ProdukDelete } from './Delete';
import {  useEffect, useState } from 'react';
import CustomDropdown, {type DropdownItem} from '../../../components/ui/dropdown/Dropdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
import { UserChangeRole } from './ChangeRole';
import { useAuth } from '../../../context/AuthContext';


export default function UserPage() {
  dayjs.extend(relativeTime);
  dayjs.locale('id'); 
  const {user: userLogin, profile, loading} = useAuth(); 
  const queryClient = useQueryClient();
  const [ openModalAdd, setOpenModalAdd] = useState(false);
  const [ openModalEdit, setOpenModalEdit] = useState(false);
  const [ openModalDelete, setOpenModalDelete] = useState(false);
  const [ dataEdit, setDataEdit] = useState();
  const [ dataChange, setDataChange] = useState<{data: any, changeToRole: string} | null>(null);
  const [ openModalConfirmChangeRole, setopenModalConfirmChangeRole] = useState(false);
  const [ dataActivateorDeactivateUser, setDataDeactivate] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<any[]>([]);
  
  const columns = [
    { key: "nama", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "last_signin", label: "Terakhir login" },
    { key: "is_default_password", label: "Password Bawaan" },
  ];
  const { data: user, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['user', searchTerm, page, limit], 
    queryFn: () => getUser(searchTerm, page, limit),
  });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };
  const toggleSelect = (user_id: string, is_active: boolean) =>
    setSelected((prev) =>
    prev.some(item => item.user_id === user_id) ? prev.filter((x) => x.user_id !== user_id) : [...prev, { user_id: user_id, is_active: is_active }]
  );

  const toggleAll = () => setSelected(selected.length === user.data.length ? [] : user.data.map((r:any) => ({ user_id: r.user_id, is_active: r.is_active })));

  if (isLoading) return <div className="p-10 text-white bg-[#121212] min-h-screen">Loading...</div>;
  
  if (error) return <div className="p-10 text-red-500 bg-[#121212] min-h-screen">Gagal memuat data: {(error as any).message}</div>;

  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">USER</h1>
        <p className="text-slate-500 text-sm mt-1">{user.data.length} dari {user.metadata.totalData} user ditampilkan</p>  
      </div>
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        
          <div className="relative">
            <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <input 
                type="text" 
                placeholder="Cari produk dan tekan enter..." 
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Cari
            </button>
          </form>
          </div>
          <div className="flex gap-3">
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{selected.length} dipilih</span>
                <button onClick={() => {
                          setDataDeactivate(selected);
                          setOpenModalDelete(true);
                        }} 
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition">Hapus</button>
              </div>
            )}
            <button onClick={() => setOpenModalAdd(true)} className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition text-white">
              <Plus size={24} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border  rounded-lg">
              <Filter size={18} />
              <span>semua</span>
            </button>
            <div className="relative">
              <select
                  className={`overflow-hidden pr-8 truncate h-full appearance-none block px-3 py-1 bg-zinc-50 border border-gray-300 text-xs rounded-base focus:outline-hidden focus:ring-0 shadow-xs placeholder:text-body rounded-md cursor-pointer`}
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
                  <option key={user.metadata.totalData} value={user.metadata.totalData}>
                      Semua
                  </option>
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2`}>
                  <ChevronDown size={12}/>
              </div>
          </div>

          
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.length === user.data.length && user.data.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-violet-500 cursor-pointer"
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 transition group"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <span className="text-slate-300 group-hover:text-slate-500 transition">
                        {sortKey === col.key ? (sortAsc ? "↑" : "↓") : "↕"}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {user.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                user.data.map((row: any) => (
                  <tr
                    key={row.user_id}
                    className={`transition-colors hover:bg-slate-50 ${selected.some(item => item.user_id === row.user_id) ? "bg-violet-50" : ""}`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.some(item => item.user_id === row.user_id)}
                        onChange={() => toggleSelect(row.user_id, row.is_active)}
                        className="w-4 h-4 rounded border-slate-300 accent-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {row.nama.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{row.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.email}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium `}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.last_signin === null ? ("Tidak Pernah login") : dayjs(row.last_signin).fromNow()}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.is_default_password ? ("Ya") : "Tidak"}</td>
                    <td className="px-4 py-3.5">
                      { profile.user_id !== row.user_id && (

                        <div className="flex items-center gap-1">
                          <button onClick={() => {
                            setDataEdit(row);
                            setOpenModalEdit(true);

                          }} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                            <PenLine size={14}/>
                          </button>
                          <button onClick={() => {
                                            setDataDeactivate([{user_id: row.user_id, is_active: row.is_active}]);
                                            setOpenModalDelete(true);
                                          }}
                                  className={`p-1.5 rounded-lg text-slate-400 ${ row.is_active ? `hover:text-red-500 hover:bg-red-50` : `hover:text-emerald-500 hover:bg-emerald-100/60`}  transition`}>
                            { row.is_active ? (
                              <CircleSlash size={14}/>
                            ) : (
                              <Activity size={14}/>
                            )}
                          </button>
                          {((row.role === "ADMIN" && Number(user.metadata.totalDataAdmin) > 1) ||(row.role === "TEKNISI"))&& (
                            <button onClick={() => {
                                        const targetRole = row.role === "TEKNISI" ? "ADMIN" : "TEKNISI";
                                        setDataChange({ data: row, changeToRole: targetRole });
                                        setopenModalConfirmChangeRole(true);
                                      }}
                                    className={`p-1.5 rounded-lg text-slate-400 ${row.role === "TEKNISI" ? `hover:text-green-600 hover:bg-green-100/60` : `hover:text-yellow-600 hover:bg-yellow-100/60`}  transition`}>
                              {row.role === "TEKNISI" ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
                            </button>
                          )}
                        
                        </div>
                      ) }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Menampilkan {user.length} entri</span>
          <div className="flex gap-1">
            {Array.from({ length: user.metadata.totalPages }, (_, i)  => {
              const p = i+1;
            return (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === user.metadata.currentPage ? "bg-violet-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                {p}
              </button>
            )})}
          </div>
        </div>
    </div>
    </div>
    <ProdukAdd
      isOpen={openModalAdd}
      onClose={() => {
        setOpenModalAdd(false);
      }}
    />
    <ProdukEdit
      isOpen={openModalEdit}
      onClose={() => {
        setOpenModalEdit(false);
      }}
      dataEdit={dataEdit || null}
    />
    <ProdukDelete
      isOpen={openModalDelete}
      onClose={() => {
        setOpenModalDelete(false);
      }}
      dataDeactivate={dataActivateorDeactivateUser}
    />
  {dataChange && (
    <UserChangeRole
      isOpen={openModalConfirmChangeRole}
      onClose={() => {
        setopenModalConfirmChangeRole(false);
      }}
      dataToChange={dataChange} // TypeScript sekarang tahu dataChange pasti bukan null
    />
  )}
    </>
  );
}
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../../services/api';
import { Plus, Search, Filter, PenLine, Trash, EllipsisVertical} from 'lucide-react';
import { ProdukAdd } from './Add';
import { ProdukEdit} from './Edit';
import { ProdukDelete } from './Delete';
import { useState } from 'react';
import CustomDropdown from '../../../components/ui/dropdown/Dropdown';

export default function ProductPage() {
  const [ openModalAdd, setOpenModalAdd] = useState(false);
  const [ openModalEdit, setOpenModalEdit] = useState(false);
  const [ openModalDelete, setOpenModalDelete] = useState(false);
  const [ dataEdit, setDataEdit] = useState();
  const [ dataDelete, setDataDelete] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: products, isLoading, error } = useQuery({
    // Sangat penting: masukkan searchTerm ke queryKey agar otomatis refetch saat ketik
    queryKey: ['products', searchTerm], 
    queryFn: () => getProducts(searchTerm),
  });
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setSearchTerm(inputValue); // Set trigger untuk React Query
  };
  if (isLoading) return <div className="p-10 text-white bg-[#121212] min-h-screen">Loading...</div>;
  
  if (error) return <div className="p-10 text-red-500 bg-[#121212] min-h-screen">Gagal memuat data: {(error as any).message}</div>;

  return (
    <>
    <div className="min-h-scree p-8 ">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">PRODUK</h1>
               
        
        <div className="flex gap-3">
          <button onClick={() => setOpenModalAdd(true)} className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition text-white">
            <Plus size={24} />
          </button>
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
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border  rounded-lg">
            <Filter size={18} />
            <span>semua</span>
          </button>
        </div>
      </div>

      {/* 2. Content Section */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="bg-zinc-100 rounded-xl border border-gray-800 hover:border-gray-600 transition-all p-4">
              {/* Image Placeholder */}
              <div className="aspect-square bg-zinc-300 rounded-lg mb-4 flex items-center justify-center text-gray-600">
                {product.img_url ? (
                  <img src={product.img_url} alt={product.nama} className="w-full h-full object-cover rounded-lg" />
                ) : "No Image"}
              </div>
              <div className='flex'>
                <div className='flex-1'>

              <h3 className="font-semibold text-lg">{product.nama || "Tanpa Nama"}</h3>
              <p className="text-gray-400">
                Rp {new Intl.NumberFormat('id-ID').format(product.harga || 0)}
              </p>
                </div>
                <CustomDropdown 
                items={[
                    {
                      label: "edit",
                      icon: <PenLine size={12}/>,
                      onClick: () => {
                        setDataEdit(product);
                        setOpenModalEdit(true);
                      }
                    },
                    {
                      label: "hapus",
                      icon: <Trash/>,
                      onClick: () => {
                        setDataDelete([product.id]);
                        setOpenModalDelete(true);
                      }
                    },
                  ]} 
                icon={<EllipsisVertical size={13}/>}
                />
                </div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. Empty State */
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-800 rounded-2xl">
          <Plus className="text-gray-600 rotate-45 size-12 mb-4" />
          <h2 className="text-xl font-semibold text-gray-300">Belum ada produk</h2>
          <p className="text-gray-500 mt-1">Data di database masih kosong.</p>
        </div>
      )}
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
      dataDelete={dataDelete}
    />
    </>
  );
}
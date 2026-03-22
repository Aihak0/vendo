
import { useAuth } from '../../context/AuthContext';


export default function Home() {
  const { profile } = useAuth();

  return (
    <div className="p-6">
      { !profile ? (
         <p>Loading profile...</p>
      ): (
        <h1 className="text-2xl font-bold mb-6">Hai {profile.nama}</h1>
      )}

      {/* Placeholder grid seperti dashboard biasa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg h-32 flex items-center justify-center"
          >
            <p className="text-gray-500">Card {i}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
        <p className="text-gray-500">Chart Area</p>
      </div>

      {/* Uncomment ini kalau sudah yakin halaman muncul */}
      {/* <EcommerceMetrics /> */}
      {/* <MonthlySalesChart /> */}
    </div>
  );
}
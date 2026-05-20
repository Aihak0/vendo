import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useAdvancedMarkerRef, InfoWindow, ColorScheme } from '@vis.gl/react-google-maps';
import { useTheme } from '../context/ThemeContext';
interface MapLocasiProps {
    locations: Coords[];
}

interface Coords {
    id: string;
    nama: string;
    status: string;
    latitude: number;
    longitude: number;
    user_profiles?: any[];
}

export const MapContainer = ({ locations }: MapLocasiProps) => {
  const { theme } = useTheme() 
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAP_API_KEY}>
      <div style={{ width: "100%" }}>
         {isLoadingMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <MapSkeleton/>
          </div>
        )}
        <Map
          mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
          disableDefaultUI={true}
          onTilesLoaded={() => setIsLoadingMap(false)}
          colorScheme={theme === "dark" ? "DARK" : theme === 'system' ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "DARK" : "LIGHT") : "LIGHT"}
          style={{ width: '100%', height: '350px'}}
          >
          <MapBounds locations={locations} />
          {locations.map((loc) => (
            <MapMarker key={loc.id} loc={loc}/>
           
          ))}
        </Map>
      </div>
    </APIProvider>
  );
};

const MapMarker = ({ loc }: any) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: loc.latitude, lng: loc.longitude }}
      />
      <InfoWindow
          anchor={marker}
        
          headerContent={
          
            <div className='flex gap-3 items-center'>
              <span className='text-gray-700 font-medium'>
                {loc?.nama || "loading..."}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ loc.status === 'online' ? 'bg-green-100 text-green-800' : loc.status === 'offline' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800 ' } `}>
                {loc.status}
              </span>
            </div>
        
          }
          >
            { loc.user_profiles && (

              <div className='flex items-center gap-3'>
                <p>Teknisi</p>
                {loc.user_profiles.urlPasfoto ? (
                  <div className="flex items-center gap-1">
                    <img src={loc.user_profiles.urlPasfoto} className='w-5 h-5 rounded-full' alt="" />
                    <span className="text-sm font-medium text-slate-800 text-xs">{loc.user_profiles.nama}</span>
                  </div>
                ) :
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {loc.user_profiles.nama.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-800 text-xs">{loc.user_profiles.nama}</span>
                  </div>
                }

              </div>
            )}
      </InfoWindow>
    </>
  );
};

const MapBounds = ({ locations }: MapLocasiProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    // 1. Buat objek LatLngBounds
    const bounds = new window.google.maps.LatLngBounds();

    // 2. Masukkan semua koordinat lokasi ke dalam bounds
    locations.forEach((loc) => {
      bounds.extend({ lat: loc.latitude, lng: loc.longitude });
    });

    // 3. Panggil fitBounds agar peta menyesuaikan zoom dan posisi
    map.fitBounds(bounds);
  }, [map, locations]);

  return null;
};

 function MapSkeleton(){
  return(
    <div className="w-full h-[300px] overflow-hidden relative bg-slate-200 dark:bg-slate-950 animate-pulse">
      <div className="absolute w-full h-px bg-slate-300/50 dark:bg-slate-900 top-[80px]" />
      <div className="absolute w-full h-px bg-slate-300/50 dark:bg-slate-900 top-[160px]" />
      <div className="absolute w-full h-px bg-slate-300/50 dark:bg-slate-900 top-[240px]" />
      <div className="absolute w-full h-px bg-slate-300/50 dark:bg-slate-900 top-[320px]" />

      {/* Grid lines vertical */}
      <div className="absolute h-full w-px bg-slate-300/50 dark:bg-slate-900 left-1/4" />
      <div className="absolute h-full w-px bg-slate-300/50 dark:bg-slate-900 left-1/2" />
      <div className="absolute h-full w-px bg-slate-300/50 dark:bg-slate-900 left-3/4" />

      {/* Road horizontal */}
      <div className="absolute w-full h-8 bg-slate-300/70 dark:bg-slate-800 top-[185px]" />

      {/* Road vertical */}
      <div className="absolute h-full w-8 bg-slate-300/70 dark:bg-slate-800 left-[355px]" />

      {/* Block areas - top */}
      <div className="absolute top-5 left-5 w-28 h-14 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-5 left-40 w-20 h-14 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-5 left-[420px] w-36 h-14 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-5 right-28 w-20 h-14 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-5 right-4 w-24 h-14 bg-slate-300/50 dark:bg-slate-900 rounded" />

      {/* Block areas - bottom */}
      <div className="absolute top-[230px] left-5 w-24 h-20 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-[230px] left-36 w-16 h-20 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-[230px] left-[420px] w-28 h-20 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-[230px] right-28 w-24 h-20 bg-slate-300/50 dark:bg-slate-900 rounded" />
      <div className="absolute top-[230px] right-4 w-24 h-20 bg-slate-300/50 dark:bg-slate-900 rounded" />

      {/* Pin marker */}
      <div className="absolute top-[200px] left-[200px] w-8 h-8 bg-slate-400/80 dark:bg-slate-700 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-500 dark:bg-slate-600 rounded-full" />
      </div>

  
      {/* Attribution bar */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-300/60 dark:bg-slate-900/80 flex items-center px-2">
        <div className="w-20 h-1.5 bg-slate-400 dark:bg-slate-700/80 rounded" />
      </div>
    </div>
  )
}
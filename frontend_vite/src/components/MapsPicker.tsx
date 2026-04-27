import { APIProvider, Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import {  useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Coords {
  lat: number;
  lng: number;
  address?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  negara?: string;
  kodePos?: string;
}

interface MapPickerProps {
  onLocationSelected: (coords: Coords) => void;
  set_position?: { lat: number; lng: number } | null;
  onLoadingChange?: (loading: boolean) => void;
}

export default function MapPicker({ onLocationSelected, set_position, onLoadingChange }: MapPickerProps) {
  const { theme } = useTheme() 
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(set_position || null);

  const initialCenter = set_position || {
    lat: -8.135591830992043,
    lng: 113.68351956652367
  };

  const [markerRef, marker] = useAdvancedMarkerRef();
  const [dataLokasi, setDataLokasi] = useState<any>();
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoadingMap);
    }
  }, [isLoadingMap]);
  useEffect(() => {
    setPosition(set_position || null);
  }, [set_position]);

  const getAddressComponent = (components: google.maps.GeocoderAddressComponent[], type: string) => {
    const res = components.find(item => item.types.includes(type));
    return res ? res.long_name : "";
  };

  const handleMapClick = (lat: number, lng: number) => {
    const newCoords = { lat, lng };

    setPosition(newCoords);

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: newCoords }, (results: any, status:string) => {
      if (status === "OK" && results && results[0]) {
        const components = results[0].address_components;

        const data: Coords = {
          ...newCoords,
          address: results[0].formatted_address,
          desa: getAddressComponent(components, "sublocality_level_1") || getAddressComponent(components, "village"),
          kecamatan: getAddressComponent(components, "administrative_area_level_3"),
          kabupaten: getAddressComponent(components, "administrative_area_level_2"),
          provinsi: getAddressComponent(components, "administrative_area_level_1"),
          negara: getAddressComponent(components, "country"),
          kodePos: getAddressComponent(components, "postal_code"),
        };

        onLocationSelected(data);
        setDataLokasi(data);
      } else {
        console.error("Geocode gagal:", status);
      }
    });
  };

  return (
    <APIProvider apiKey="AIzaSyC5UQlT_g-rMsndNB1kN1aKWCi9zmjbCLY">
      <div className="map-wrapper cursor-pointer relative" >
        {isLoadingMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <MapSkeleton/>
          </div>
        )}
        <Map
          defaultCenter={initialCenter}
          defaultZoom={8}
          onTilesLoaded={() => setIsLoadingMap(false)}
          onClick={(e) => {
            const lat = e.detail.latLng?.lat;
            const lng = e.detail.latLng?.lng;

            if (lat && lng) {
              handleMapClick(lat, lng);
            }
          }}
          
          mapId="f1cc353e6ab6f01c5f111d9b"
          gestureHandling="greedy"
          disableDefaultUI={true}
          colorScheme={theme === "dark" ? "DARK" : theme === 'system' ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "DARK" : "LIGHT") : "LIGHT"}
          style={{ width: '100%', height: '400px'}}
        >
          {position && (
            <>
              <AdvancedMarker 
                ref={markerRef}
                position={position} 
                >
          
              </AdvancedMarker>
              <InfoWindow
                anchor={marker}
                maxWidth={200}
                headerContent={
                    <span className='text-gray-700 font-medium'>
                      {dataLokasi?.kabupaten || "loading..."}
                    </span>
                }
                >
                  <div className='text-gray-700'>
                    {dataLokasi?.address || "Loading..."}
                  </div>
                
            </InfoWindow>
            </>
          )}
        </Map>
      </div>

    </APIProvider>
  );
}

function MapSkeleton(){
  return(
    <div className="w-full h-[400px] overflow-hidden relative bg-slate-200 dark:bg-slate-950 animate-pulse">
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
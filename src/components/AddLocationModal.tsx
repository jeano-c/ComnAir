import React, { useState, useEffect, useRef, useMemo } from "react";
import Modal from "./Modal";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocations } from "../hooks/useLocation";
import {
  LANDMARKS,
  REGIONS,
  Landmark,
  RegionName,
} from "../constants/landmarks";
import {
  FaMagnifyingGlass,
  FaLocationCrosshairs,
  FaLocationDot,
  FaXmark,
  FaArrowsRotate,
} from "react-icons/fa6";

// Fix for default marker icon in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

// Map Controller for smooth fly-to animations
function MapController({
  targetCenter,
}: {
  targetCenter: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, 16, { animate: true, duration: 1.2 });
    }
  }, [targetCenter, map]);

  return null;
}

// Invalidate size to ensure Leaflet renders correctly inside a modal
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Location Marker with drag & click capabilities
function LocationMarker({
  position,
  onPinChange,
}: {
  position: [number, number] | null;
  onPinChange: (pos: [number, number]) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useMapEvents({
    click(e) {
      onPinChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onPinChange([latlng.lat, latlng.lng]);
        }
      },
    }),
    [onPinChange]
  );

  if (position === null) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>
        <div className="text-xs">
          <p className="font-bold text-gray-800">Selected Location</p>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Drag this pin to fine-tune exact position.
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function AddLocationModal({
  isOpen,
  onClose,
}: AddLocationModalProps) {
  const { createLocation, isCreating } = useLocations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(
    null
  );

  // Flexible landmarks states
  const [selectedRegion, setSelectedRegion] =
    useState<RegionName>("Metro Manila");
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(
    null
  );
  const [isSuggestedName, setIsSuggestedName] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const reverseGeocodeRef = useRef<number>(0);

  // Default Map center (Metro Manila)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setPosition(null);
      setTargetCenter(null);
      setSelectedLandmarkId(null);
      setIsSuggestedName(false);
      setSearchQuery("");
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter landmarks for currently selected region
  const regionLandmarks = useMemo(() => {
    return LANDMARKS.filter((lm) => lm.region === selectedRegion);
  }, [selectedRegion]);

  // Reverse geocoding helper: converts coordinates to a human-readable address & name
  const reverseGeocode = async (coords: [number, number]) => {
    const [lat, lng] = coords;
    const currentRequestId = ++reverseGeocodeRef.current;
    setIsSearching(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&zoom=18&format=json&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!res.ok) throw new Error("Nominatim reverse failed");
      const data = await res.json();

      // Avoid race conditions if user clicked or dragged again
      if (reverseGeocodeRef.current !== currentRequestId) return;

      const addr = data.address || {};
      const primary =
        data.name ||
        addr.amenity ||
        addr.building ||
        addr.shop ||
        addr.tourism ||
        addr.leisure;
      const street = addr.road || addr.pedestrian || addr.footway;
      const area =
        addr.suburb ||
        addr.quarter ||
        addr.neighbourhood ||
        addr.village ||
        addr.city_district;
      const city =
        addr.city || addr.town || addr.municipality;

      const parts = [
        primary,
        street && street !== primary ? street : null,
        area,
        city,
      ].filter(Boolean);

      // Clean duplicates
      const cleanParts: string[] = [];
      parts.forEach((p) => {
        if (!cleanParts.includes(p)) cleanParts.push(p);
      });

      const formattedAddress =
        cleanParts.length > 0
          ? cleanParts.join(", ")
          : data.display_name?.split(",").slice(0, 3).join(",") ||
            `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

      // Update Search Bar with the pinned location address
      setSearchQuery(formattedAddress);

      // Also suggest for Location Name if user hasn't typed a custom one
      if (!name || isSuggestedName) {
        const shortTitle =
          primary || street || area || city || "Station Location";
        setName(shortTitle);
        setIsSuggestedName(true);
      }
    } catch {
      // Fallback to Photon Reverse Geocoding
      try {
        const pRes = await fetch(
          `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`
        );
        const pData = await pRes.json();

        if (reverseGeocodeRef.current !== currentRequestId) return;

        const feature = pData.features?.[0];
        if (feature) {
          const props = feature.properties || {};
          const parts = [
            props.name,
            props.street && props.street !== props.name ? props.street : null,
            props.district || props.locality,
            props.city,
          ].filter(Boolean);

          const formattedAddress =
            parts.length > 0
              ? parts.join(", ")
              : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

          setSearchQuery(formattedAddress);

          if (!name || isSuggestedName) {
            const shortTitle =
              props.name || props.street || props.city || "Station Location";
            setName(shortTitle);
            setIsSuggestedName(true);
          }
        } else {
          setSearchQuery(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      } catch {
        if (reverseGeocodeRef.current === currentRequestId) {
          setSearchQuery(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        }
      }
    } finally {
      if (reverseGeocodeRef.current === currentRequestId) {
        setIsSearching(false);
      }
    }
  };

  // Called when user clicks the map or drags the marker
  const handleManualPin = (coords: [number, number]) => {
    setPosition(coords);
    setSelectedLandmarkId(null);
    reverseGeocode(coords);
  };

  // Handle Search Input with debounce (Nominatim with Photon fallback)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=json&limit=5&countrycodes=ph&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        if (!res.ok) throw new Error("Nominatim failed");
        const data = await res.json();
        const formatted: SearchResult[] = data.map((item: any) => ({
          name: item.name || item.display_name.split(",")[0],
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSearchResults(formatted);
        setShowDropdown(formatted.length > 0);
      } catch (err) {
        // Fallback to Photon
        try {
          const pRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(
              query
            )}&limit=5&lat=14.5995&lon=120.9842`
          );
          const pData = await pRes.json();
          const fallbackResults: SearchResult[] = (pData.features || []).map(
            (f: any) => ({
              name: f.properties.name || f.properties.city || "Location",
              displayName: [
                f.properties.name,
                f.properties.city,
                f.properties.state,
                f.properties.country,
              ]
                .filter(Boolean)
                .join(", "),
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            })
          );
          setSearchResults(fallbackResults);
          setShowDropdown(fallbackResults.length > 0);
        } catch {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select Search Result
  const handleSelectSearchResult = (result: SearchResult) => {
    const coords: [number, number] = [result.lat, result.lng];
    setPosition(coords);
    setTargetCenter(coords);
    setSelectedLandmarkId(null);
    setShowDropdown(false);
    setSearchQuery(result.name);

    if (!name || isSuggestedName) {
      setName(result.name);
      setIsSuggestedName(true);
    }
  };

  // Select a preset landmark
  const handleSelectLandmark = (lm: Landmark) => {
    const coords: [number, number] = [lm.lat, lm.lng];
    setPosition(coords);
    setTargetCenter(coords);
    setSelectedLandmarkId(lm.id);
    setSearchQuery(`${lm.name}, ${lm.city}`);

    if (!name || isSuggestedName) {
      setName(lm.name);
      setIsSuggestedName(true);
    }
  };

  // Geolocation button (My Location)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(coords);
        setTargetCenter(coords);
        setSelectedLandmarkId(null);
        setIsLocatingUser(false);
        // Reverse geocode GPS position to fill search bar & name
        reverseGeocode(coords);
      },
      (err) => {
        setIsLocatingUser(false);
        alert(`Could not get your location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Clear pin
  const handleClearPin = () => {
    setPosition(null);
    setSelectedLandmarkId(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      alert("Please select a location on the map.");
      return;
    }

    try {
      await createLocation({
        name,
        description,
        latitude: position[0].toString(),
        longitude: position[1].toString(),
      });
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Failed to create location", error);
      alert("Failed to create location. Check console for details.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Location"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* LEFT COLUMN: Inputs & Landmark Shortcuts */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Location Name <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F8F22] focus:border-transparent outline-none transition text-sm"
                placeholder="e.g. Quezon City - Main Station"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsSuggestedName(false);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F8F22] focus:border-transparent outline-none transition text-sm"
                placeholder="Details, landmarks, or notes about this station..."
                value={description}
                rows={2}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Flexible Landmark Quick Jumper */}
            <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FaLocationDot className="text-emerald-600 text-xs" />
                  Landmark Quick Jumper
                </span>
                <span className="text-[11px] text-gray-500">1-click pin</span>
              </div>

              {/* Region Selector for Flexibility */}
              <div className="mb-2.5">
                <label className="block text-[11px] text-gray-500 font-medium mb-1">
                  Select Region / Island:
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value as RegionName);
                    setSelectedLandmarkId(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#1F8F22] font-medium text-gray-700 cursor-pointer"
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Landmark Chips for the Chosen Region */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {regionLandmarks.map((lm) => {
                  const isSelected = selectedLandmarkId === lm.id;
                  return (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => handleSelectLandmark(lm)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium text-left flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{lm.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pinned Coordinates Summary Badge */}
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Pinned Location Status
                </span>
                {position ? (
                  <span className="text-xs font-mono text-gray-800 font-bold mt-0.5">
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </span>
                ) : (
                  <span className="text-xs text-amber-700 italic mt-0.5">
                    No pin placed yet. Click the map or choose a landmark.
                  </span>
                )}
              </div>

              {position && (
                <button
                  type="button"
                  onClick={handleClearPin}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                >
                  Clear Pin
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Map + Search Bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Pin on Map
              </label>
              <span className="text-[11px] text-gray-500">
                Draggable pin & search enabled
              </span>
            </div>

            {/* Search Bar & GPS Locate Me Tool */}
            <div className="relative z-10" ref={searchContainerRef}>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Search address or click/drag pin on map..."
                    className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1F8F22] focus:border-transparent outline-none transition shadow-sm font-medium text-gray-800 placeholder:font-normal"
                  />
                  <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  {isSearching ? (
                    <FaArrowsRotate className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 text-xs animate-spin" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowDropdown(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <FaXmark className="text-xs" />
                    </button>
                  ) : null}
                </div>

                {/* GPS Locate Me Button */}
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={isLocatingUser}
                  title="Locate my current position (GPS)"
                  className="p-2 text-xs bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl transition shadow-sm flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <FaLocationCrosshairs
                    className={`text-sm text-emerald-700 ${
                      isLocatingUser ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(res)}
                      className="w-full px-3 py-2 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition flex flex-col cursor-pointer"
                    >
                      <span className="text-xs font-bold text-gray-800">
                        {res.name}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">
                        {res.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="w-full h-72 md:h-[350px] rounded-2xl overflow-hidden border border-gray-300 shadow-inner relative z-0">
              {isOpen && (
                <MapContainer
                  center={defaultCenter}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapResizer />
                  <MapController targetCenter={targetCenter} />
                  <LocationMarker
                    position={position}
                    onPinChange={handleManualPin}
                  />
                </MapContainer>
              )}
            </div>

            <p className="text-[11px] text-gray-500 italic mt-0.5">
              Tip: Click anywhere to pin, drag the pin to adjust, or search for any location.
            </p>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2 rounded-xl font-bold text-white bg-[#1F8F22] hover:bg-[#1a7a1d] transition-colors shadow-[#1F8F22]/30 shadow-lg disabled:opacity-50 text-sm cursor-pointer"
          >
            {isCreating ? "Adding..." : "Add Location"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

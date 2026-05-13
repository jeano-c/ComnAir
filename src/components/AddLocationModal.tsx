import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocations } from "../hooks/useLocation";

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

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export default function AddLocationModal({
  isOpen,
  onClose,
}: AddLocationModalProps) {
  const { createLocation, isCreating } = useLocations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState<[number, number] | null>(null);

  // Default Map center (Metro Manila)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setPosition(null);
    }
  }, [isOpen]);

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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Name
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8F22] focus:border-transparent outline-none transition"
            placeholder="e.g. Quezon City - Main"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F8F22] focus:border-transparent outline-none transition"
            placeholder="Details about this location..."
            value={description}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pin on Map{" "}
            <span className="text-gray-400 font-normal">
              (Click to set location)
            </span>
          </label>

          <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-300 shadow-inner z-0">
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
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            )}
          </div>

          {position && (
            <p className="text-xs text-gray-500 font-mono mt-1">
              Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#1F8F22] hover:bg-[#1a7a1d] transition-colors shadow-[#1F8F22]/30 shadow-lg disabled:opacity-50"
          >
            {isCreating ? "Adding..." : "Add Location"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { OlaMaps } from "olamaps-web-sdk";
import { debounce } from "../utils/debounce";
import polyline from "@mapbox/polyline";

const OlaMapWithRoute = () => {
  const [olaMaps, setOlaMaps] = useState<any>(null);
  const [map, setMap] = useState<any>(null);

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupCoords, setPickupCoords] = useState<any>(null);
  const [dropCoords, setDropCoords] = useState<any>(null);

  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);

  const apiKey = "MIFFOdi3As35nCmFho0GyxgUl4giTjHdRIJbx2YH";

  // useEffect(() => {
  //   const instance = new OlaMaps({ apiKey });
  //   const myMap = instance.init({
  //     style:
  //       "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
  //     container: "map",
  //     center: [77.61648476788898, 12.931423492103944],
  //     zoom: 13,
  //   });

  //   setOlaMaps(instance);
  //   myMap.scrollZoom.disable();
  //   myMap.boxZoom.disable();
  //   myMap.dragPan.disable();
  //   myMap.dragRotate.disable();
  //   myMap.keyboard.disable();
  //   myMap.doubleClickZoom.disable();
  //   myMap.touchZoomRotate.disable();
  //   setMap(myMap);
  // }, []);

  const fetchAutocomplete = async (text: string, type: "pickup" | "drop") => {
    if (!text) {
      if (type === "pickup") setPickupSuggestions([]);
      else setDropSuggestions([]);
      return;
    }

    const res = await fetch(
      `https://api.olamaps.io/places/v1/autocomplete?input=${text}&api_key=${apiKey}`
    );
    const data = await res.json();

    if (data?.predictions) {
      if (type === "pickup") setPickupSuggestions(data.predictions);
      else setDropSuggestions(data.predictions);
    }
  };

  const debouncedFetchAutocomplete = useCallback(
    debounce(fetchAutocomplete, 700),
    []
  );

  const fetchCoords = async (placeId: string) => {
    const res = await fetch(
      `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${apiKey}`
    );
    const data = await res.json();

    if (data?.result?.geometry?.location) {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      };
    }
    return null;
  };
  const drawRoute = async () => {
    if (!pickupCoords || !dropCoords) return;

    // init map only once
    let myMap = map;
    if (!myMap) {
      const instance = new OlaMaps({ apiKey });
      myMap = instance.init({
        style:
          "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: "map",
        center: [pickupCoords.lng, pickupCoords.lat], // start at pickup
        zoom: 13,
      });

      // Disable interactions
      myMap.scrollZoom.disable();
      myMap.boxZoom.disable();
      myMap.dragPan.disable();
      myMap.dragRotate.disable();
      myMap.keyboard.disable();
      myMap.doubleClickZoom.disable();
      myMap.touchZoomRotate.disable();

      setOlaMaps(instance);
      setMap(myMap);

      // ✅ Wait for map to load before drawing
      await new Promise<void>((resolve) => {
        myMap.on("load", () => resolve());
      });
    }

    // fetch route
    const origin = `${pickupCoords.lat},${pickupCoords.lng}`;
    const destination = `${dropCoords.lat},${dropCoords.lng}`;

    const url = `https://api.olamaps.io/routing/v1/directions?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}&mode=driving&steps=true&overview=full&api_key=${apiKey}`;

    const res = await fetch(url, { method: "POST" });
    const data = await res.json();

    const overviewPolyline = data.routes[0]?.overview_polyline;
    if (!overviewPolyline) return;

    const coordinates = polyline
      .decode(overviewPolyline, 5)
      .map(([lat, lng]) => [lng, lat]);

    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    };

    if (myMap.getSource("route")) {
      (myMap.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      myMap.addSource("route", { type: "geojson", data: geojson });
      myMap.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#007bff", "line-width": 5 },
      });
    }

    // fit route into screen
    const lats = coordinates.map((c) => c[1]);
    const lngs = coordinates.map((c) => c[0]);
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];

    myMap.fitBounds([sw, ne], { padding: 60, animate: true });
  };

  // const drawRoute = async () => {
  //   if (!pickupCoords || !dropCoords) return;
  //   const origin = `${pickupCoords.lat},${pickupCoords.lng}`;
  //   const destination = `${dropCoords.lat},${dropCoords.lng}`;

  //   const mode = "driving";
  //   const steps = true;
  //   const overview = "full";

  //   const url = `https://api.olamaps.io/routing/v1/directions?origin=${encodeURIComponent(
  //     origin
  //   )}&destination=${encodeURIComponent(
  //     destination
  //   )}&mode=${mode}&steps=${steps}&overview=${overview}&api_key=${apiKey}`;

  //   const res = await fetch(url, {
  //     method: "POST",
  //   });

  //   const data = await res.json();
  //   const overviewPolyline = data.routes[0]?.overview_polyline;

  //   let myMap = map;
  //   if (!myMap) {
  //     const instance = new OlaMaps({ apiKey });
  //     myMap = instance.init({
  //       style:
  //         "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
  //       container: "map",
  //       center: [pickupCoords.lng, pickupCoords.lat], // start at pickup
  //       zoom: 13,
  //     });

  //     myMap.scrollZoom.disable();
  //     myMap.boxZoom.disable();
  //     myMap.dragPan.disable();
  //     myMap.dragRotate.disable();
  //     myMap.keyboard.disable();
  //     myMap.doubleClickZoom.disable();
  //     myMap.touchZoomRotate.disable();

  //     setOlaMaps(instance);
  //     setMap(myMap);
  //   }

  //   if (map && overviewPolyline) {
  //     const coordinates = polyline
  //       .decode(overviewPolyline, 5)
  //       .map(([lat, lng]) => [lng, lat]);

  //     const geojson = {
  //       type: "Feature",
  //       properties: {},
  //       geometry: {
  //         type: "LineString",
  //         coordinates,
  //       },
  //     };

  //     if (map.getSource("route")) {
  //       (map.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson);
  //     } else {
  //       map.addSource("route", {
  //         type: "geojson",
  //         data: geojson,
  //       });

  //       map.addLayer({
  //         id: "route-line",
  //         type: "line",
  //         source: "route",
  //         paint: {
  //           "line-color": "#007bff",
  //           "line-width": 5,
  //         },
  //       });
  //     }
  //     const lats = coordinates.map((c) => c[1]);
  //     const lngs = coordinates.map((c) => c[0]);

  //     const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
  //     const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];

  //     map.fitBounds([sw, ne], {
  //       padding: 60,
  //       animate: true,
  //     });
  //   }
  // };

  // Handle save route
  const handleSaveRoute = async () => {
    if (pickupCoords && dropCoords) {
      await drawRoute();
    } else {
      alert("Please select both pickup and drop from suggestions.");
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Floating Input Box */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "white",
          borderRadius: "12px",
          padding: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "90%",
          maxWidth: "400px",
          zIndex: 2000,
        }}
      >
        {/* Pickup Input */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#34c759",
                marginRight: "8px",
              }}
            />
            <input
              type="text"
              placeholder="Enter Pickup Location"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                debouncedFetchAutocomplete(e.target.value, "pickup");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                width: "100%",
              }}
            />
          </div>
          {pickupSuggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "42px",
                left: "18px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginTop: "4px",
                listStyle: "none",
                padding: "6px 0",
                width: "90%",
                maxHeight: "160px",
                overflowY: "auto",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                zIndex: 2500,
              }}
            >
              {pickupSuggestions.map((sug: any) => (
                <li
                  key={sug.place_id}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#333",
                  }}
                  onClick={async () => {
                    setPickup(sug.description);
                    setPickupSuggestions([]);
                    const coords = sug.geometry.location;
                    if (coords) setPickupCoords(coords);
                  }}
                >
                  {sug.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drop Input */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#ff3b30",
                marginRight: "8px",
              }}
            />
            <input
              type="text"
              placeholder="Enter Drop Location"
              value={drop}
              onChange={(e) => {
                setDrop(e.target.value);
                debouncedFetchAutocomplete(e.target.value, "drop");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                width: "100%",
              }}
            />
          </div>
          {dropSuggestions.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "42px",
                left: "18px",
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginTop: "4px",
                listStyle: "none",
                padding: "6px 0",
                width: "90%",
                maxHeight: "160px",
                overflowY: "auto",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                zIndex: 2500,
              }}
            >
              {dropSuggestions.map((sug: any) => (
                <li
                  key={sug.place_id}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#333",
                  }}
                  onClick={async () => {
                    setDrop(sug.description);
                    setDropSuggestions([]);
                    const coords = sug.geometry.location;
                    if (coords) setDropCoords(coords);
                  }}
                >
                  {sug.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={handleSaveRoute}
        style={{
          position: "absolute",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#000",
          color: "#fff",
          border: "none",
          padding: "14px 28px",
          borderRadius: "30px",
          fontSize: "16px",
          fontWeight: "bold",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
          zIndex: 2000,
        }}
      >
        Save Route
      </button>

      {/* Map */}
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

export default OlaMapWithRoute;

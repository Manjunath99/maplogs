import React, { useEffect } from "react";
import { OlaMaps } from "olamaps-web-sdk";

const OlaMap = () => {
  useEffect(() => {
    const olaMaps = new OlaMaps({
      apiKey: "MIFFOdi3As35nCmFho0GyxgUl4giTjHdRIJbx2YH",
    });

    olaMaps.init({
      style:
        "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: "map",
      center: [77.61648476788898, 12.931423492103944],
      zoom: 15,
    });
  }, []);

  return (
    <div
      id="map"
      style={{ width: "100%", height: "100vh", border: "1px solid #ccc" }}
    />
  );
};

export default OlaMap;

//  useEffect(() => {
//     const instance = new OlaMaps({ apiKey });
//     const myMap = instance.init({
//       style:
//         "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
//       container: "map",
//       center: [77.61648476788898, 12.931423492103944],
//       zoom: 13,
//     });

//     setOlaMaps(instance);
//     myMap.scrollZoom.disable(); // disables scroll wheel zoom
//     myMap.boxZoom.disable(); // disables shift+drag zoom
//     myMap.dragPan.disable(); // disables panning
//     myMap.dragRotate.disable(); // disables rotation
//     myMap.keyboard.disable(); // disables keyboard interactions
//     myMap.doubleClickZoom.disable(); // disables double-click zoom
//     myMap.touchZoomRotate.disable(); //
//     setMap(myMap);
//   }, []);

// const fetchCoords = async (placeId: string) => {
//   const res = await fetch(
//     `https://api.olamaps.io/places/v1/details?place_id=${placeId}&api_key=${apiKey}`
//   );
//   const data = await res.json();

//   if (data?.result?.geometry?.location) {
//     return {
//       lat: data.result.geometry.location.lat,
//       lng: data.result.geometry.location.lng,
//     };
//   }
//   return null;
// };

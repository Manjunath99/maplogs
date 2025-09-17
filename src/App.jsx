import { useState } from "react";

import OlaMapWithRoute from "./components/OlaMapWithRoute";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <OlaMapWithRoute />
    </>
  );
}

export default App;

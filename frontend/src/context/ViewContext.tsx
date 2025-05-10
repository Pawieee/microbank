/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const ViewContext = createContext<{
  view: string;
  setView: (view: string) => void;
}>({
  view: "",
  setView: () => {},
});

export const ViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState("");

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => useContext(ViewContext);

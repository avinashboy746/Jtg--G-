import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const SettingsContext = createContext<any>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [panelName, setPanelName] = useState<string>("JTG Panel");

  const fetchSettings = async () => {
    try {
      const res = await axios.get("/api/settings");
      if (res.data.panelName) {
        setPanelName(res.data.panelName);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ panelName, setPanelName, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

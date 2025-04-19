import { createContext, useContext, useState, ReactNode } from "react"

type AlertContextType = {
  showAlert: boolean
  triggerAlert: () => void
  closeAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [showAlert, setShowAlert] = useState(false)

  const triggerAlert = () => setShowAlert(true)
  const closeAlert = () => setShowAlert(false)

  return (
    <AlertContext.Provider value={{ showAlert, triggerAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  )
}

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) throw new Error("useAlert must be used within AlertProvider")
  return context
}

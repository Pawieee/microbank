import { createContext, useContext, useState, ReactNode } from "react"

type AlertData = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  timeout?: number
}

type AlertContextType = {
  showAlert: boolean
  alertData: AlertData
  triggerAlert: (data: AlertData) => void
  closeAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState<AlertData>({})

  const triggerAlert = (data: AlertData) => {
    setAlertData(data)
    setShowAlert(true)
  }

  const closeAlert = () => {
    setShowAlert(false)
    setAlertData({})
  }

  return (
    <AlertContext.Provider value={{ showAlert, alertData, triggerAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  )
}

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) throw new Error("useAlert must be used within AlertProvider")
  return context
}

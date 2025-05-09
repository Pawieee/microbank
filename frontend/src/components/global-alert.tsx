import { Alert } from "@/components/ui/alert";
import { useAlert } from "@/context/AlertContext";
import { AnimatePresence } from "framer-motion";

export default function GlobalAlert() {
  const { showAlert, alertData, closeAlert } = useAlert();

  return (
    <AnimatePresence>
      {showAlert && (
        <Alert
          title={alertData.title}
          description={alertData.description}
          variant={alertData.variant}
          timeout={alertData.timeout || 3000}
          onClose={closeAlert}
        />
      )}
    </AnimatePresence>
  );
}

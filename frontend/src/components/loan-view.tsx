import { useParams } from "react-router-dom";
import { useApplication } from "@/hooks/useApplication";
import { LoanDetails } from "./loan-details";

const LoanView = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  const { data, loading, error } = useApplication(numericId); // FIX THIS ONEEEEEEEEEEEEEEEEEEEEEEEE

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No loan found.</div>;

  return <LoanDetails {...data} />;
};

export default LoanView;

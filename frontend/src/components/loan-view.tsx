import { useParams } from "react-router-dom";
import { LoanDetails } from "./loan-details";
import { useLoanDetails } from "@/hooks/useLoanDetails";

const LoanView = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  const { data, loading, error } = useLoanDetails(numericId)

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No loan found.</div>;

  return <LoanDetails loan_id={numericId} />;
};

export default LoanView;

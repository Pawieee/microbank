import { useParams } from "react-router-dom";
import { useLoan } from "@/hooks/useLoan";
import { LoanDetailsView } from "./loan-details";

const LoanDetailsPage = () => {
  const { id } = useParams(); // Fix: use 'id' not 'loanId'
  const { data, loading, error } = useLoan(id); // Pass id to the hook

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No loan found.</div>;

  return <LoanDetailsView {...data} />;
};

export default LoanDetailsPage;

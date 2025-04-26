import { useParams } from "react-router-dom";
import { useLoan } from "@/hooks/useLoan";
import { LoanDetailsView } from "./loan-details";

const LoanDetailsPage = () => {
  const { id } = useParams<{ id: string }>(); // Explicitly typing 'id' as a string
  const { data, loading, error } = useLoan(id as string); // 'id' passed to hook as string

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No loan found.</div>;

  return <LoanDetailsView {...data} />; // Spread data to LoanDetailsView
};

export default LoanDetailsPage;

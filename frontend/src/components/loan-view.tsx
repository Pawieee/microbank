import { useParams } from "react-router-dom";
import { LoanDetails } from "./loan-details";

const LoanView = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  return <LoanDetails loan_id={numericId} />;
};

export default LoanView;
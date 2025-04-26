import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";  // Import useNavigate hook

interface LoanStatusNotificationProps {
  status: "approved" | "rejected";
}

export function LoanStatusNotification({ status }: LoanStatusNotificationProps) {
  const navigate = useNavigate();  // Initialize the navigate function
  const isApproved = status === "approved";

  // Example static criteria — you can later pass this dynamically if needed
  const evaluationCriteria = [
    { title: "Credit Score", percentage: "30%", score: "27/30" },
    { title: "Income Verification", percentage: "25%", score: "22/25" },
    { title: "Employment Stability", percentage: "20%", score: "18/20" },
    { title: "Debt-to-Income Ratio", percentage: "15%", score: "13/15" },
    { title: "Collateral", percentage: "10%", score: "9/10" },
  ];

  const handleDone = () => {
    // Navigate back to the dashboard
    navigate("/pages/dashboard");  // Adjust the path as needed
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-start bg-background p-10 pt-24 text-center">
      {isApproved ? (
        <CheckCircle className="h-28 w-28 text-green-500 mb-6" />
      ) : (
        <XCircle className="h-28 w-28 text-red-500 mb-6" />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {isApproved ? "The loan request is approved" : "The loan request was rejected"}
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {isApproved
          ? "After careful evaluation, the applicant has met all the requirements and the loan has been successfully approved."
          : "After thorough review, the applicant did not meet the necessary criteria for loan approval at this time."}
      </p>

      {/* Criteria List */}
      <div className="w-full max-w-md bg-muted p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Evaluation Criteria</h2>
        <div className="space-y-3">
          {evaluationCriteria.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.percentage} - {item.score}</span>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleDone} className="mt-2">
        Done
      </Button>
    </div>
  );
}

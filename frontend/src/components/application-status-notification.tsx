import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ApplicationStatusNotificationProps {
  status: "Approved" | "Rejected";
  onDone: () => void;
}

export function ApplicationStatusNotification({
  status,
}: ApplicationStatusNotificationProps) {
  const navigate = useNavigate();
  const isApproved = status === "Approved";

  const evaluationCriteria = [
    { title: "Credit Score", percentage: "30%", score: "27/30" },
    { title: "Income Verification", percentage: "25%", score: "22/25" },
    { title: "Employment Stability", percentage: "20%", score: "18/20" },
    { title: "Debt-to-Income Ratio", percentage: "15%", score: "13/15" },
    { title: "Collateral", percentage: "10%", score: "9/10" },
  ];

  const handleDone = () => {
    if (isApproved) {
      navigate("/pages/applications");
    } else {
      navigate("/pages/dashboard");
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-start bg-background p-10 pt-24 text-center">
      {isApproved ? (
        <CheckCircle className="h-28 w-28 text-green-500 mb-6" />
      ) : (
        <XCircle className="h-28 w-28 text-red-500 mb-6" />
      )}
      <h1 className="text-2xl font-bold mb-2">
        {isApproved
          ? "The loan request is approved"
          : "The loan request was rejected"}
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
              <span className="text-muted-foreground">
                {item.percentage} - {item.score}
              </span>
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

import { useNavigate } from "react-router-dom";
import { 
  IconArrowLeft,
  IconLock
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  onBack?: () => void;
}

export function AccessDenied({ 
  title = "Access Denied", 
  message = "You do not have the necessary permissions to view this resource.",
  onBack
}: AccessDeniedProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-4">
      
      {/* 403 CARD */}
      <div className="w-full max-w-[400px] bg-card border border-red-100 rounded-xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-red-500" />

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Red Icon Badge */}
          <div className="mb-5 p-4 bg-red-50 rounded-full border border-red-100 shadow-sm">
            <IconLock className="w-8 h-8 text-red-600" stroke={1.5} />
          </div>

          {/* 403 Label */}
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
            403 Forbidden
          </span>

          {/* Main Title */}
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-3">
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {message} Please contact your administrator for assistance.
          </p>

          {/* Back Button */}
          <Button 
            onClick={handleBack} 
            variant="outline"
            className="w-full gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <IconArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

        </div>
      </div>
    </div>
  );
}
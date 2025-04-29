import { useParams } from "react-router-dom";
import { useApplication } from "@/hooks/useApplication";
import { ApplicationDetails } from "./application-details";

const ApplicationView = () => {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  const { data, loading, error } = useApplication(numericId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No loan found.</div>;

  return <ApplicationDetails {...data} />;
};

export default ApplicationView;

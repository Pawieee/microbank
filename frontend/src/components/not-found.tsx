import { useNavigate } from "react-router-dom";
import { IconMapQuestion } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md text-center space-y-6">

                {/* Icon Container */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 border border-gray-200 shadow-sm">
                    <IconMapQuestion className="h-10 w-10 text-gray-500" stroke={1.5} />
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                        404
                    </h1>
                    <p className="text-lg font-medium text-gray-900">Page not found</p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">

                    <Button
                        onClick={() => navigate("/")}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
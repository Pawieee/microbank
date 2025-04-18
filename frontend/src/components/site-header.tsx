import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { data } from "./app-sidebar"; // Import your sidebar data

interface SiteHeaderProps {
  activeView: string; // The active view passed from parent (the current view)
}

export function SiteHeader({ activeView }: SiteHeaderProps) {
  const [viewTitle, setViewTitle] = useState<string>("Dashboard");

  // A helper function to get the view title from the navMain items
  const getViewTitle = (view: string) => {
    const matchedItem = data.navMain.find((item) => item.view === view);
    return matchedItem ? matchedItem.title : "Dashboard"; // Default to "Documents" if no match
  };

  useEffect(() => {
    const title = getViewTitle(activeView); // Get the title based on the active view
    setViewTitle(title); // Set the view title
  }, [activeView]); // Re-run this effect whenever the active view changes

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{viewTitle}</h1>{" "}
        {/* Dynamically set the header title */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
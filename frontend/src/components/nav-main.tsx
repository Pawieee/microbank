import { type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

export function NavMain({
  items,
  onNavigate,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  onNavigate?: (url: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // Get the current pathname without query parameters or hash
            const currentPath = location.pathname.split("?")[0].split("#")[0];

            // Check if the current pathname contains the item URL substring
            const isActive = currentPath.includes(item.url);

            return (
              <SidebarMenuItem
                key={item.title}
                className="flex items-center gap-2"
              >
                <SidebarMenuButton
                  tooltip={item.title}
                  className={cn(
                    "text-[#18181B]",
                    isActive && "bg-[#18181B] text-white rounded-md hover:bg-[#27272A] hover:text-white"
                  )}
                  
                  onClick={() => {
                    document.title = item.title;
                    navigate(item.url);
                    onNavigate?.(item.url);
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

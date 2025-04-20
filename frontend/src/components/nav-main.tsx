import { type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type View = string;

export function NavMain({
  items,
  onNavigate,
  activeView,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    view?: View;
  }[];
  onNavigate?: (view: View) => void;
  activeView: View;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              className="flex items-center gap-2"
            >
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(
                  "text-[#18181B]", // Default: black text
                  activeView === (item.view ?? item.title.toLowerCase())
                    ? "bg-[#18181B] text-white rounded-md hover:bg-[#27272A] hover:text-white" // Active + hover
                    : "" // Inactive: no hover effect
                )}
                onClick={() => {
                  const viewKey =
                    item.view ?? item.title.toLowerCase().replace(/\s+/g, "-");
                  document.title = `${item.title}`;
                  onNavigate?.(viewKey as View);
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

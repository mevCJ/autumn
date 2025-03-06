"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStripe } from "@fortawesome/free-brands-svg-icons";
import toast from "react-hot-toast";
import { TabButton } from "./TabButton";

export function SidebarContact() {
  const email = "hey@useautumn.com";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <TabButton
            value="chat"
            icon={<FontAwesomeIcon icon={faStripe} />}
            title="Chat with us"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        <span className="text-xs text-t3 p-2">👋 We respond within 30 minutes</span>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.location.href = `mailto:${email}`} className="cursor-pointer">
          <span>{email}</span>
          <FontAwesomeIcon
            icon={faStripe}
            className="ml-2 cursor-pointer hover:text-primary"
            onClick={handleCopy}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open("https://cal.com/ayrod", "_blank")} className="cursor-pointer">
          {/* <FontAwesomeIcon icon={faStripe} className="mr-2" /> */}
          Book a call
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-progress h-[30px] flex justify-between">
            Discord <Badge>Soon</Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
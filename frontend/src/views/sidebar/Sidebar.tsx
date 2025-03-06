import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";

import React from "react";
import { TabButton } from "./TabButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStripe } from "@fortawesome/free-brands-svg-icons";

import { Organization } from "@clerk/nextjs/server";
import { SidebarTop } from "./SidebarTop";
import { EnvDropdown } from "./EnvDropdown";
import { AppEnv } from "@autumn/shared";

import SidebarBottom from "./SidebarBottom";
import { createClient } from "@supabase/supabase-js";

function HomeSidebar({
  user,
  org,
  path,
  env,
}: {
  user: {
    first_name: string;
    email: string;
  };
  org: Organization;
  path: string;
  env: AppEnv;
}) {
  return (
    <Sidebar collapsible="icon" className=" bg-zinc-100">
      <SidebarTop orgName={org?.name || " "} env={env} />
      <SidebarContent>
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {<EnvDropdown env={env} />}

              <TabButton
                value="features"
                icon={<FontAwesomeIcon icon={faStripe} />}
                title="Features"
                env={env}
              />
              {/* <TabButton
                value="credits"
                icon={<FontAwesomeIcon icon={faStripe} />}
                title="Credits"
                env={env}
              /> */}
              <TabButton
                value="products"
                icon={<FontAwesomeIcon icon={faStripe} />}
                title="Products"
                env={env}
              />
              <TabButton
                value="customers"
                icon={<FontAwesomeIcon icon={faStripe} />}
                title="Customers"
                env={env}
              />
              <TabButton
                value="dev"
                icon={<FontAwesomeIcon icon={faStripe} />}
                title="Developer"
                env={env}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarBottom
        userName={user?.first_name || " "}
        userEmail={user?.email || " "}
        env={env}
      />
    </Sidebar>
  );
}

export default HomeSidebar;

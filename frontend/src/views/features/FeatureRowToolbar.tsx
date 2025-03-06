import SmallSpinner from "@/components/general/SmallSpinner";
import { faStripe } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cn } from "@nextui-org/theme";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

import { useAxiosInstance } from "@/services/useAxiosInstance";
import { Feature } from "@autumn/shared";
import { useFeaturesContext } from "./FeaturesContext";
import { FeatureService } from "@/services/FeatureService";
import { getBackendErr } from "@/utils/genUtils";

export const FeatureRowToolbar = ({
  className,
  feature,
}: {
  className?: string;
  feature: Feature;
}) => {
  const { env, mutate } = useFeaturesContext();
  const axiosInstance = useAxiosInstance({ env });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await FeatureService.deleteFeature(axiosInstance, feature.id);
      await mutate();
    } catch (error) {
      toast.error(getBackendErr(error, "Failed to delete feature"));
    }

    setDeleteLoading(false);
    setDeleteOpen(false);
  };
  return (
    <DropdownMenu open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          isIcon
          variant="ghost"
          dim={6}
          className={cn("rounded-full", className)}
        >
          <FontAwesomeIcon icon={faStripe} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-t2">
        <DropdownMenuItem
          className="flex items-center"
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await handleDelete();
          }}
        >
          <div className="flex items-center justify-between w-full gap-2">
            Delete
            {deleteLoading ? (
              <SmallSpinner />
            ) : (
              <FontAwesomeIcon icon={faStripe} size="sm" />
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

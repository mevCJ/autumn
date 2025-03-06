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

import { Product } from "@autumn/shared";
import { faStripe } from "@fortawesome/free-brands-svg-icons";
import { ProductService } from "@/services/products/ProductService";
import { useRouter } from "next/navigation";
import { useAxiosInstance } from "@/services/useAxiosInstance";
import { useProductContext } from "./ProductContext";
import { navigateTo } from "@/utils/genUtils";

export const EditFreeTrialToolbar = ({
  className,
  product,
}: {
  className?: string;
  product: Product;
}) => {
  const { mutate, env, setProduct, product: curProduct } = useProductContext();
  const axiosInstance = useAxiosInstance(env);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setProduct({ ...product, free_trial: null });
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
          <FontAwesomeIcon icon={faStripe} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-t2">
        <DropdownMenuItem
          className="flex items-center bg-red-500 text-white"
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

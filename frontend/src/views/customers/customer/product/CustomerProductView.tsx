"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AppEnv,
  FrontendProduct,
  FullCusProduct,
  Organization,
} from "@autumn/shared";

import {
  BreadcrumbItem,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { useAxiosSWR } from "@/services/useAxiosSwr";

import LoadingScreen from "@/views/general/LoadingScreen";
import { useRouter, useSearchParams } from "next/navigation";
import { useAxiosInstance } from "@/services/useAxiosInstance";
import { CustomToaster } from "@/components/general/CustomToaster";
import { ManageProduct } from "@/views/products/product/ManageProduct";
import { ProductContext } from "@/views/products/product/ProductContext";

import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleDollar, faUpload } from "@fortawesome/pro-duotone-svg-icons";
import { CusService } from "@/services/customers/CusService";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import {
  getBackendErr,
  getBackendErrObj,
  getRedirectUrl,
  navigateTo,
} from "@/utils/genUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ErrCode } from "@autumn/shared";
import { AddProductButton } from "../add-product/AddProductButton";
import ErrorScreen from "@/views/general/ErrorScreen";
import { ProductOptionsButton } from "./ProductOptionsButton";
import { ProductService } from "@/services/products/ProductService";
import RequiredOptionsModal from "./RequiredOptionsModal";
import { ProductOptions } from "./ProductOptions";
import { Breadcrumbs } from "@nextui-org/react";
import { keyToTitle } from "@/utils/formatUtils/formatTextUtils";

interface OptionValue {
  feature_id: string;
  threshold?: number;
  quantity?: number;
}

export default function CustomerProductView({
  product_id,
  customer_id,
  env,
  org,
}: {
  product_id: string;
  customer_id: string;
  env: AppEnv;
  org: Organization;
}) {
  const router = useRouter();
  const axiosInstance = useAxiosInstance({ env });
  const [product, setProduct] = useState<FrontendProduct | null>(null);
  const [options, setOptions] = useState<OptionValue[]>([]);

  const { data, isLoading, mutate, error } = useAxiosSWR({
    url: `/customers/${customer_id}/data`,
    env,
  });

  const [url, setUrl] = useState<any>(null);

  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [requiredOptions, setRequiredOptions] = useState<OptionValue[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [useInvoice, setUseInvoice] = useState(false);
  const initialProductRef = useRef<FrontendProduct | null>(null);

  const searchParams = useSearchParams();

  const cusProductId = searchParams.get("id");
  // Get product from customer data and check if it is active
  useEffect(() => {
    if (!data?.products || !data?.customer) return;

    const foundProduct = data.products.find((p) => p.id === product_id);
    // console.log("Found Product: ", foundProduct);
    if (!foundProduct) return;

    const customerProduct = data.customer.products.find(
      (p: FullCusProduct) => p.id === cusProductId
    );

    console.log("customerProduct", customerProduct);

    const enrichedProduct = enrichProduct(foundProduct, customerProduct);
    // console.log("enrichedProduct", enrichedProduct);

    setOptions(enrichedProduct.options);
    setProduct(enrichedProduct);
    initialProductRef.current = enrichedProduct;
  }, [data, product_id]);

  // Pure function to handle product enrichment
  const enrichProduct = (
    baseProduct: FrontendProduct,
    customerProduct?: {
      status?: string;
      options?: OptionValue[];
      entitlements?: typeof baseProduct.entitlements;
      prices?: typeof baseProduct.prices;
    }
  ) => {
    if (!customerProduct) {
      // console.log("baseProduct", baseProduct);
      return {
        ...baseProduct,
        isActive: false,
        options: [],
      };
    }
    // console.log("baseProduct", baseProduct);
    // console.log("customerProduct", customerProduct);

    return {
      ...baseProduct,
      isActive: customerProduct.status === "active",
      options: customerProduct.options ?? [],
      ...(customerProduct.entitlements && {
        entitlements: customerProduct.entitlements,
      }),
      ...(customerProduct.prices && {
        prices: customerProduct.prices,
      }),
    };
  };

  //check if the user has made changes to the product state
  useEffect(() => {
    if (!initialProductRef.current || !product) {
      setHasChanges(false);
      return;
    }

    const hasChanged =
      JSON.stringify({
        prices: product.prices,
        entitlements: product.entitlements,
      }) !==
      JSON.stringify({
        prices: initialProductRef.current.prices,
        entitlements: initialProductRef.current.entitlements,
      });

    setHasChanges(hasChanged);
  }, [product]);

  if (error) {
    console.log("Use Axios SWR Error: ", error);
    return (
      <ErrorScreen>
        <p>
          Customer {customer_id} or product {product_id} not found
        </p>
      </ErrorScreen>
    );
  }

  if (isLoading) return <LoadingScreen />;

  const { customer } = data;

  if (!product) {
    return <div>Product not found</div>;
  }

  const handleCreateProduct = async (useInvoiceLatest?: boolean) => {
    try {
      const { data } = await ProductService.getRequiredOptions(axiosInstance, {
        prices: product.prices,
        entitlements: product.entitlements,
      });

      if (data.options && data.options.length > 0) {
        // console.log("options", data.options);
        setRequiredOptions(data.options);
        return;
      }

      // Continue with product creation if no required options
      await createProduct(
        useInvoiceLatest !== undefined ? useInvoiceLatest : useInvoice
      );
    } catch (error) {
      toast.error(getBackendErr(error, "Error checking required options"));
    }
  };

  const createProduct = async (useInvoiceLatest?: boolean) => {
    try {
      const { data } = await CusService.addProduct(axiosInstance, customer_id, {
        product_id,
        prices: product.prices,
        entitlements: product.entitlements,
        free_trial: product.free_trial,
        options: requiredOptions,
        is_custom: true,
        invoice_only:
          useInvoiceLatest !== undefined ? useInvoiceLatest : useInvoice,
      });

      await mutate();
      toast.success("Product created successfully");

      if (data.checkout_url) {
        setUrl({
          type: "checkout",
          value: data.checkout_url,
        });
        setCheckoutDialogOpen(true);
      }

      if (data.invoice_url) {
        setUrl({
          type: "invoice",
          value: data.invoice_url,
        });
        setCheckoutDialogOpen(true);
      }
    } catch (error) {
      console.log("Error creating product: ", error);
      const errObj = getBackendErrObj(error);

      if (errObj?.code === ErrCode.StripeConfigNotFound) {
        toast.error(errObj?.message);
        const redirectUrl = getRedirectUrl(`/customers/${customer_id}`, env);
        navigateTo(`/integrations/stripe?redirect=${redirectUrl}`, router, env);
      } else {
        toast.error(getBackendErr(error, "Error creating product"));
      }
    }
  };

  const getProductActionState = () => {
    if (product.isActive && !hasChanges && !product.is_add_on) {
      return {
        buttonText: "Update Product",
        tooltipText: "No changes have been made to update",
        disabled: true,
      };
    }
    if (product.isActive && !product.is_add_on) {
      return {
        buttonText: "Update Product",
        tooltipText: `You're editing the live product ${product.name} and updating it to a custom version for ${customer.name}`,
        disabled: true, //TODO: remove this
      };
    }
    if (hasChanges) {
      return {
        buttonText: "Create Custom Version",
        tooltipText: `You have edited product ${product.name} and are creating a custom version for ${customer.name}`,
        disabled: false,
      };
    }
    return {
      buttonText: "Enable Product",
      tooltipText: `Enable product ${product.name} for ${customer.name}`,
      disabled: false,
    };
  };

  const actionState = getProductActionState();

  return (
    <ProductContext.Provider
      value={{
        ...data,
        mutate,
        env,
        product,
        setProduct,
        // prices: product.prices,
        // entitlements: product.entitlements,
        org,
      }}
    >
      <CustomToaster />

      <RequiredOptionsModal
        requiredOptions={requiredOptions}
        createProduct={createProduct}
        setRequiredOptions={setRequiredOptions}
      />

      <Dialog
        open={checkoutDialogOpen}
        onOpenChange={() => {
          setCheckoutDialogOpen(false);
          setUrl(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{url && keyToTitle(url.type)}</DialogTitle>
          </DialogHeader>

          {url && <CopyUrl url={url.value} isInvoice={url.type == "invoice"} />}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-2">
        <Breadcrumb className="text-t3">
          <BreadcrumbList className="text-t3 text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer"
                onClick={() => navigateTo("/customers", router, env)}
              >
                Customers
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() =>
                navigateTo(`/customers/${customer_id}`, router, env)
              }
            >
              {customer.name}
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{product.name}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {product && <ManageProduct product={product} customerData={data} />}
      </div>

      {options.length > 0 && <ProductOptions options={options} />}
      <div className="flex justify-end gap-2">
        {/* <ProductOptionsButton /> */}
        <AddProductButton
          handleCreateProduct={handleCreateProduct}
          actionState={actionState}
          setUseInvoice={setUseInvoice}
        />
      </div>
    </ProductContext.Provider>
  );
}

export const CopyUrl = ({
  url,
  isInvoice = false,
}: {
  url: string;
  isInvoice: boolean;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {!isInvoice && (
        <p className="text-sm text-gray-500">
          This link will expire in 24 hours
        </p>
      )}
      <div className="w-full bg-gray-100 p-3 rounded-md">
        <Link
          className="text-xs text-t2 break-all hover:underline"
          href={url}
          target="_blank"
        >
          {url}
        </Link>
      </div>
    </div>
  );
};

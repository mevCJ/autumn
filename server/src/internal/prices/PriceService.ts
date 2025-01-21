import { ErrCode } from "@/errors/errCodes.js";
import RecaseError from "@/utils/errorUtils.js";
import { AppEnv, Price } from "@autumn/shared";
import { SupabaseClient } from "@supabase/supabase-js";
import { StatusCodes } from "http-status-codes";

export class PriceService {
  static async insert({
    sb,
    data,
  }: {
    sb: SupabaseClient;
    data: Price | Price[];
  }) {
    const { data: price, error } = await sb
      .from("prices")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new RecaseError({
        message: "Failed to create price",
        code: ErrCode.CreatePriceFailed,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: error,
      });
    }

    return price;
  }

  static async upsert({
    sb,
    data,
  }: {
    sb: SupabaseClient;
    data: Price | Price[];
  }) {
    const { data: price, error } = await sb
      .from("prices")
      .upsert(data)
      .select();

    if (error) {
      throw new RecaseError({
        message: "Failed to upsert price",
        code: ErrCode.CreatePriceFailed,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: error,
      });
    }

    return price;
  }

  static async deleteIfNotIn({
    sb,
    productId,
    priceIds,
  }: {
    sb: SupabaseClient;
    productId: string;
    priceIds: string[];
  }) {
    // if (priceIds.length === 0) {
    //   const { error } = await sb
    //     .from("prices")
    //     .delete()
    //     .eq("product_id", productId);
    //   if (error) {
    //     throw error;
    //   }
    //   return;
    // }

    const { error } = await sb
      .from("prices")
      .delete()
      .not("id", "in", `(${priceIds.join(",")})`)
      .eq("product_id", productId);

    if (error) {
      throw error;
    }
  }

  static async getPricesFromIds({
    sb,
    priceIds,
  }: {
    sb: SupabaseClient;
    priceIds: string[];
  }) {
    const { data, error } = await sb
      .from("prices")
      .select("*")
      .in("id", priceIds);

    if (error) {
      throw error;
    }
    return data || [];
  }

  static async getPricesByProductId(sb: SupabaseClient, productId: string) {
    const { data, error } = await sb
      .from("prices")
      .select("*")
      .eq("product_id", productId)
      .eq("is_custom", false);

    if (error) {
      if (error.code !== "PGRST116") {
        return [];
      }
      throw error;
    }

    return data || [];
  }

  static async deletePriceByProductId(sb: SupabaseClient, productId: string) {
    const { error } = await sb
      .from("prices")
      .delete()
      .eq("product_id", productId);

    if (error) {
      throw error;
    }
  }

  static async getPriceStrict({
    sb,
    priceId,
    orgId,
    env,
  }: {
    sb: SupabaseClient;
    priceId: string;
    orgId: string;
    env: AppEnv;
  }) {
    const { data: price, error: priceError } = await sb
      .from("prices")
      .select(`*, product:products(org_id, env)`)
      .eq("id", priceId)
      .eq("product.org_id", orgId)
      .eq("product.env", env)
      .single();

    if (priceError) {
      if (priceError.code === "PGRST116") {
        throw new RecaseError({
          message: "Price not found",
          code: ErrCode.PriceNotFound,
        });
      }
      throw priceError;
    }

    if (!price || !price.product) {
      throw new RecaseError({
        message: "Price / product not found",
        code: ErrCode.PriceNotFound,
      });
    }

    // console.log("Price", price);
    return price;
  }

  static async deletePriceStrict({
    sb,
    priceId,
    orgId,
    env,
  }: {
    sb: SupabaseClient;
    priceId: string;
    orgId: string;
    env: AppEnv;
  }) {
    // 1. Get price and product and org
    await this.getPriceStrict({ sb, priceId, orgId, env });

    // 2. Delete price
    const { error } = await sb.from("prices").delete().eq("id", priceId);
    if (error) {
      throw error;
    }
  }
}

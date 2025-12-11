import {
  getProductById,
  updateProductById,
  deleteProductById,
} from "@/service/supabase/ProductsService";
import ProductValidator from "@/validator/products";
import { checkAuth } from "@/app/utils/auth";
import { successResponse, errorResponse } from "@/app/utils/response";
import { handleImageUpload } from "@/app/utils/fileupload";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const item = await getProductById(id);

    return successResponse(item, "Successfully retrieved product");
  } catch (error: any) {
    return errorResponse(error, "Failed to retrieve product");
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");

    const { id } = await context.params;

    const contentType = req.headers.get("content-type") || "";

    let productData;
    let productImageUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const productDataJson = formData.get("productData") as string;

      if (!productDataJson) {
        throw new Error("productData is missing in form data");
      }

      productData = JSON.parse(productDataJson);

      const imageFile = formData.get("image") as File;
      if (imageFile) {
        productImageUrl = await handleImageUpload(imageFile);
      } else if (productData.product_image) {
        productImageUrl = productData.product_image;
      } else {
        productImageUrl = "";
      }
    } else {
      const body = await req.json();
      productData = body;
      productImageUrl = body.product_image || "";
    }

    console.log("UPDATE BODY API:", productData);

    const { product_name, quantity, category_id, units } = productData;

    const payloadToValidate = {
      ...productData,
      product_image: productImageUrl,
    };

    await ProductValidator.validateProductPayload(payloadToValidate);

    const result = await updateProductById(id, {
      product_name,
      product_image: productImageUrl,
      quantity,
      category_id,
      units,
    });

    return successResponse(result, "Product updated successfully", 200);
  } catch (error: any) {
    console.error("🔥 ERROR updating product:", error);
    return errorResponse(error, "Failed to update product");
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");

    const { id } = await context.params;

    await deleteProductById(id);

    return successResponse(undefined, "Product deleted successfully");
  } catch (error: any) {
    return errorResponse(error, "Failed to delete product");
  }
}

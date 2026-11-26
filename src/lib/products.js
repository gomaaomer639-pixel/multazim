export function mapActiveProducts(remoteProducts, fallbackProducts = []) {
  if (!Array.isArray(remoteProducts)) return [];

  return remoteProducts
    .filter(product => product?.active === true && product.id && product.price != null &&
      Number.isFinite(Number(product.price)) && Number(product.price) >= 0)
    .map(product => {
      const price = Number(product.price);
      const oldPrice = product.old_price == null || product.old_price === ''
        ? null
        : Number(product.old_price);
      const fallback = fallbackProducts.find(item => item.id === product.id) || {};

      return {
        ...fallback,
        ...product,
        price,
        old_price: oldPrice !== null && Number.isFinite(oldPrice) && oldPrice >= 0
          ? oldPrice
          : null,
      };
    });
}

export function getProductDiscount(product) {
  if (!product || product.old_price == null || product.old_price === '') return null;

  const price = Number(product.price);
  const oldPrice = Number(product.old_price);
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(oldPrice) || oldPrice <= price) {
    return null;
  }

  return {
    oldPrice,
    percentage: Math.round(((oldPrice - price) / oldPrice) * 100),
  };
}

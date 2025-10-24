// Lightweight mock implementations for development without network calls.
// Exports the same shape as `src/api/entities.js` but returns empty data or no-op functions.

export const Product = {
  async filter(/* query */) {
    // return small sample set so UI can render lists during local development
    return [
      {
        id: 'prod_1',
        name: 'Sample Product One',
        created_by: 'alice@example.com',
        retailer: 'Amazon',
        category: 'electronics',
        current_price: 99.99,
        original_price: 129.99,
        image_url: '',
        url: 'https://example.com/product/1',
        is_active: true,
        deleted: false,
        created_date: new Date().toISOString(),
      },
    ];
  },
  async get(/* id */) {
    return null;
  },
};

export const PriceHistory = {
  async list() { return []; }
};

export const Alert = {
  async list() { return []; }
};

export const Review = {
  async list() { return []; }
};

export const Retailer = {
  async list() { return []; }
};

export const User = {
  async me() {
    // return a dummy authenticated user for local development
    return {
      id: 'user_1',
      full_name: 'Alice Developer',
      email: 'alice@example.com',
      roles: ['admin'],
    };
  },
  async logout() {
    return true;
  }
};

export default { Product, PriceHistory, Alert, Review, Retailer, User };

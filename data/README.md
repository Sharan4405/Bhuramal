# Catalog Excel File Structure

Place your Excel file at: `data/catalog.xlsx`

## Required Column Structure:

Your Excel file should have these columns (case-insensitive):

| Category | Item Name | Availability |
|----------|-----------|-------------|
| Electronics | Laptop Dell XPS | In Stock |
| Electronics | Mouse Logitech | 50 units |
| Clothing | T-Shirt Blue | Out of Stock |
| Clothing | Jeans Black | In Stock |
| Food | Pizza Margherita | Available |

## Column Details:

1. **Category** - The product category (e.g., Electronics, Clothing, Food)
2. **Item Name** or **Item** - The name of the product
3. **Availability** - Stock status (e.g., "In Stock", "Out of Stock", "50 units", etc.)

## Alternative Column Names (supported):

- Category: `Category` or `category`
- Item: `Item Name`, `Item`, `item`, `name`
- Availability: `Availability`, `availability`, `stock`

## Notes:

- The first row should be headers
- Excel file must be named `catalog.xlsx`
- Place it in the `data/` folder
- The bot will automatically load it on startup

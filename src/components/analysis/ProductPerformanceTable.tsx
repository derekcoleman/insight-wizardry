import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  name: string;
  id: string;
  views: number;
  purchases: number;
  revenue: number;
}

interface ProductPerformanceTableProps {
  products: {
    current: Product[];
    previous?: Product[];
  };
}

export function ProductPerformanceTable({ products }: ProductPerformanceTableProps) {
  if (!products?.current?.length) return null;

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
  };

  const findPreviousProduct = (currentProduct: Product) => {
    if (!products.previous) return null;
    return products.previous.find(p => p.id === currentProduct.id);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Revenue Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.current.map((product) => {
            const previousProduct = findPreviousProduct(product);
            const revenueChange = calculateChange(product.revenue, previousProduct?.revenue || 0);

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{product.views.toLocaleString()}</TableCell>
                <TableCell className="text-right">{product.purchases.toLocaleString()}</TableCell>
                <TableCell className="text-right">${product.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {revenueChange !== null ? (
                    <span className={revenueChange >= 0 ? "text-green-600" : "text-red-600"}>
                      {revenueChange >= 0 ? "↑" : "↓"} {Math.abs(revenueChange).toFixed(1)}%
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
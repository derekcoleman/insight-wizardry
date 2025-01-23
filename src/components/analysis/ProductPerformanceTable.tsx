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
  products: Product[];
}

export function ProductPerformanceTable({ products }: ProductPerformanceTableProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id || product.name}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-right">{product.views.toLocaleString()}</TableCell>
              <TableCell className="text-right">{product.purchases.toLocaleString()}</TableCell>
              <TableCell className="text-right">${product.revenue.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
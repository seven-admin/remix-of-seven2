import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUnidades } from '@/hooks/useUnidades';
import { formatarMoeda } from '@/lib/formatters';
import { ordenarUnidadesPorBlocoENumero } from '@/lib/unidadeUtils';

interface ValoresReadOnlyTableProps {
  empreendimentoId: string;
}

export function ValoresReadOnlyTable({ empreendimentoId }: ValoresReadOnlyTableProps) {
  const { data: unidades, isLoading } = useUnidades(empreendimentoId);

  const unidadesOrdenadas = ordenarUnidadesPorBlocoENumero(unidades || []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!unidadesOrdenadas.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Nenhuma unidade cadastrada neste empreendimento.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quadra</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unidadesOrdenadas.map((unidade) => (
            <TableRow key={unidade.id}>
              <TableCell className="font-medium">
                {unidade.bloco?.nome || '-'}
              </TableCell>
              <TableCell>{unidade.numero}</TableCell>
              <TableCell className="text-right font-semibold">
                {unidade.valor ? formatarMoeda(unidade.valor) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

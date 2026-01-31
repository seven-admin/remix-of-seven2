import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Loader2, Eye } from 'lucide-react';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { EMPREENDIMENTO_STATUS_LABELS, EMPREENDIMENTO_TIPO_LABELS } from '@/types/empreendimentos.types';

export default function PortalEmpreendimentos() {
  const navigate = useNavigate();
  const { data: empreendimentos, isLoading: loadingEmps } = useEmpreendimentos();

  // Filtrar empreendimentos com status relevantes para corretores
  const empreendimentosFiltrados = useMemo(() => {
    return empreendimentos?.filter(e => ['lancamento', 'obra'].includes(e.status)) || [];
  }, [empreendimentos]);

  if (loadingEmps) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {empreendimentosFiltrados && empreendimentosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empreendimentosFiltrados.map((emp) => (
            <Card key={emp.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1">{emp.nome}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {EMPREENDIMENTO_TIPO_LABELS[emp.tipo]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-1">
                    {emp.endereco_cidade}, {emp.endereco_uf}
                  </span>
                </div>
                
                <Badge variant="outline">
                  {EMPREENDIMENTO_STATUS_LABELS[emp.status]}
                </Badge>

                {emp.descricao_curta && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {emp.descricao_curta}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/portal-corretor/empreendimentos/${emp.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">Nenhum empreendimento disponível</h3>
          <p className="text-muted-foreground">
            Não há empreendimentos em lançamento no momento.
          </p>
        </div>
      )}
    </>
  );
}

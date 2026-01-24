import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, Loader2, Target } from 'lucide-react';
import type { MembroEquipe } from '@/hooks/useEquipeMarketing';

interface MembroEquipeCardProps {
  membro: MembroEquipe;
}

export function MembroEquipeCard({ membro }: MembroEquipeCardProps) {
  const cargaAtual = membro.emProducao + membro.aguardando + membro.revisao;
  const cargaMaxima = 10; // Capacidade máxima estimada
  const cargaPercent = Math.min((cargaAtual / cargaMaxima) * 100, 100);
  
  const getCargaColor = () => {
    if (cargaPercent >= 80) return 'bg-destructive';
    if (cargaPercent >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={membro.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(membro.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{membro.nome}</h3>
            {membro.cargo && (
              <p className="text-xs text-muted-foreground truncate">{membro.cargo}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {membro.totalTickets} tickets atribuídos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status dos tickets */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{membro.emProducao}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em Produção</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-semibold">{membro.aguardando + membro.revisao}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pendentes</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-semibold">{membro.concluidos}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Concluídos</p>
          </div>
        </div>

        {/* Métricas de performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Tempo médio
            </span>
            <span className="font-medium">
              {membro.tempoMedio !== null ? `${membro.tempoMedio} dias` : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              No prazo
            </span>
            <Badge 
              variant={membro.taxaNoPrazo >= 80 ? 'default' : membro.taxaNoPrazo >= 50 ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {membro.taxaNoPrazo}%
            </Badge>
          </div>
        </div>

        {/* Barra de carga de trabalho */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Carga de trabalho</span>
            <span className="font-medium">{cargaAtual}/{cargaMaxima}</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div 
              className={`h-full transition-all ${getCargaColor()}`}
              style={{ width: `${cargaPercent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

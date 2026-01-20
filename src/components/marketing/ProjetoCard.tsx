import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ProjetoMarketing, 
  CATEGORIA_LABELS, 
  PRIORIDADE_LABELS, 
  PRIORIDADE_COLORS 
} from '@/types/marketing.types';
import React from 'react';

interface ProjetoCardProps {
  projeto: ProjetoMarketing;
  isDragging?: boolean;
}

export function ProjetoCard({ projeto, isDragging }: ProjetoCardProps) {
  const navigate = useNavigate();

  const getCategoriaIcon = () => {
    switch (projeto.categoria) {
      case 'render_3d':
        return '🎨';
      case 'design_grafico':
        return '✏️';
      case 'video_animacao':
        return '🎬';
      case 'evento':
        return '📅';
      default:
        return '📁';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Não navegar durante drag
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate(`/marketing/${projeto.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow bg-background cursor-pointer select-none"
      onClick={handleClick}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{getCategoriaIcon()}</span>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{projeto.titulo}</p>
              <p className="text-xs text-muted-foreground">{projeto.codigo}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {CATEGORIA_LABELS[projeto.categoria]}
          </Badge>
          <Badge 
            className="text-xs text-white"
            style={{ backgroundColor: PRIORIDADE_COLORS[projeto.prioridade] }}
          >
            {PRIORIDADE_LABELS[projeto.prioridade]}
          </Badge>
        </div>

        {projeto.empreendimento && (
          <p className="text-xs text-muted-foreground truncate">
            🏢 {projeto.empreendimento.nome}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {projeto.data_previsao && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(projeto.data_previsao), 'dd/MM', { locale: ptBR })}
            </div>
          )}
          
          {projeto.supervisor && (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {projeto.supervisor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, Star, Trash2 } from 'lucide-react';
import { useEmpreendimentoMidias, useUploadMidia, useSetMidiaCapa, useDeleteMidia } from '@/hooks/useEmpreendimentoMidias';

interface MidiasTabProps {
  empreendimentoId: string;
}

export function MidiasTab({ empreendimentoId }: MidiasTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: midias, isLoading } = useEmpreendimentoMidias(empreendimentoId);
  const uploadMutation = useUploadMidia();
  const setCapaMutation = useSetMidiaCapa();
  const deleteMutation = useDeleteMidia();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tipo = file.type.startsWith('video/') ? 'video' : 'imagem';
      await uploadMutation.mutateAsync({ empreendimentoId, file, tipo, isCapa: !midias?.length });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Mídias</h3>
            <p className="text-sm text-muted-foreground">{midias?.length || 0} arquivos</p>
          </div>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4 mr-2" />
            Enviar Mídia
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
        </div>

        {midias && midias.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {midias.map((midia) => (
              <div key={midia.id} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
                {midia.tipo === 'video' ? (
                  <video src={midia.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={midia.url} alt={midia.nome || ''} className="w-full h-full object-cover" />
                )}
                {midia.is_capa && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" /> Capa
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!midia.is_capa && (
                    <Button size="sm" variant="secondary" onClick={() => setCapaMutation.mutate({ id: midia.id, empreendimentoId })}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: midia.id, empreendimentoId, url: midia.url })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhuma mídia enviada</p>
        )}
      </CardContent>
    </Card>
  );
}

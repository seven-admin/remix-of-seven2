import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Upload, Trash2, Star, ExternalLink, Image, Video, Loader2 } from 'lucide-react';
import { useTicketCriativos } from '@/hooks/useTicketCriativos';
import type { TicketCriativo } from '@/types/marketing.types';

interface ProjetoCriativosProps {
  projetoId: string;
}

export function ProjetoCriativos({ projetoId }: ProjetoCriativosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    criativos,
    isLoading,
    uploadCriativo,
    deleteCriativo,
    toggleFinal,
    getSignedUrl,
  } = useTicketCriativos(projetoId);

  const [deleteTarget, setDeleteTarget] = useState<TicketCriativo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'imagem' | 'video'>('imagem');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Carregar URLs assinadas para os criativos
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const criativo of criativos) {
        const url = await getSignedUrl(criativo.url);
        if (url) {
          urls[criativo.id] = url;
        }
      }
      setSignedUrls(urls);
    };

    if (criativos.length > 0) {
      loadUrls();
    }
  }, [criativos]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await uploadCriativo.mutateAsync(file);
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCriativo.mutateAsync(deleteTarget);
    setDeleteTarget(null);
  };

  const handlePreview = async (criativo: TicketCriativo) => {
    const url = signedUrls[criativo.id] || await getSignedUrl(criativo.url);
    if (url) {
      setPreviewUrl(url);
      setPreviewType(criativo.tipo as 'imagem' | 'video');
    }
  };

  const handleOpenExternal = async (criativo: TicketCriativo) => {
    const url = signedUrls[criativo.id] || await getSignedUrl(criativo.url);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Criativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Criativos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {criativos.length} {criativos.length === 1 ? 'arquivo' : 'arquivos'}
            </p>
          </div>
          <Button onClick={handleFileSelect} disabled={uploadCriativo.isPending}>
            {uploadCriativo.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Enviar Arquivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </CardHeader>
        <CardContent>
          {criativos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum arquivo enviado</p>
              <p className="text-sm">Clique em "Enviar Arquivo" para adicionar</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {criativos.map((criativo) => (
                <CriativoCard
                  key={criativo.id}
                  criativo={criativo}
                  signedUrl={signedUrls[criativo.id]}
                  onPreview={() => handlePreview(criativo)}
                  onOpenExternal={() => handleOpenExternal(criativo)}
                  onDelete={() => setDeleteTarget(criativo)}
                  onToggleFinal={() =>
                    toggleFinal.mutate({ id: criativo.id, is_final: !criativo.is_final })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir arquivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCriativo.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewType === 'imagem' ? (
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          ) : (
            <video
              src={previewUrl || ''}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CriativoCardProps {
  criativo: TicketCriativo;
  signedUrl?: string;
  onPreview: () => void;
  onOpenExternal: () => void;
  onDelete: () => void;
  onToggleFinal: () => void;
}

function CriativoCard({
  criativo,
  signedUrl,
  onPreview,
  onOpenExternal,
  onDelete,
  onToggleFinal,
}: CriativoCardProps) {
  const isVideo = criativo.tipo === 'video';

  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
      {/* Thumbnail */}
      <div
        className="w-full h-full cursor-pointer"
        onClick={onPreview}
      >
        {signedUrl ? (
          isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Video className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={signedUrl}
              alt={criativo.nome || 'Criativo'}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Badge Final */}
      {criativo.is_final && (
        <Badge
          className="absolute top-2 left-2 bg-accent text-accent-foreground hover:bg-accent"
        >
          <Star className="h-3 w-3 mr-1 fill-current" />
          FINAL
        </Badge>
      )}

      {/* Overlay com ações */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFinal();
          }}
          title={criativo.is_final ? 'Remover marcação' : 'Marcar como final'}
        >
          <Star className={`h-4 w-4 ${criativo.is_final ? 'fill-accent text-accent' : ''}`} />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onOpenExternal();
          }}
          title="Abrir em nova aba"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Nome do arquivo */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-xs text-white truncate" title={criativo.nome || undefined}>
          {criativo.nome || 'Sem nome'}
        </p>
      </div>
    </div>
  );
}

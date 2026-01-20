import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConfiguracao } from '@/hooks/useConfiguracoesSistema';
import { useRegistrarAceite } from '@/hooks/useTermosAceite';
import { toast } from 'sonner';
import { FileText, Shield, Loader2 } from 'lucide-react';

interface AceitarTermosDialogProps {
  open: boolean;
  onAccepted: () => void;
}

export function AceitarTermosDialog({ open, onAccepted }: AceitarTermosDialogProps) {
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouPolitica, setAceitouPolitica] = useState(false);
  
  const { data: termos, isLoading: loadingTermos } = useConfiguracao('termos_uso');
  const { data: politica, isLoading: loadingPolitica } = useConfiguracao('politica_privacidade');
  const registrarAceite = useRegistrarAceite();
  
  const handleConfirmar = async () => {
    try {
      await registrarAceite.mutateAsync(['termos_uso', 'politica_privacidade']);
      toast.success('Termos aceitos com sucesso!');
      onAccepted();
    } catch (error) {
      console.error('Erro ao registrar aceite:', error);
      toast.error('Erro ao registrar aceite. Tente novamente.');
    }
  };
  
  const isLoading = loadingTermos || loadingPolitica;
  const podeConfirmar = aceitouTermos && aceitouPolitica && !registrarAceite.isPending;
  
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Aceite dos Termos
          </DialogTitle>
          <DialogDescription>
            Para continuar utilizando o sistema, você precisa ler e aceitar os termos atualizados.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Tabs defaultValue="termos" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="termos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Termos de Uso
                </TabsTrigger>
                <TabsTrigger value="politica" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Política de Privacidade
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="termos" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[350px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: termos?.valor || '<p>Termos de uso não configurados.</p>' }}
                  />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="politica" className="flex-1 min-h-0 mt-4">
                <ScrollArea className="h-[350px] border rounded-md p-4 bg-muted/30">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: politica?.valor || '<p>Política de privacidade não configurada.</p>' }}
                  />
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="aceito-termos"
                  checked={aceitouTermos}
                  onCheckedChange={(checked) => setAceitouTermos(checked === true)}
                />
                <Label htmlFor="aceito-termos" className="text-sm leading-relaxed cursor-pointer">
                  Li e aceito os <strong>Termos de Uso</strong> do sistema
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="aceito-politica"
                  checked={aceitouPolitica}
                  onCheckedChange={(checked) => setAceitouPolitica(checked === true)}
                />
                <Label htmlFor="aceito-politica" className="text-sm leading-relaxed cursor-pointer">
                  Li e aceito a <strong>Política de Privacidade</strong>
                </Label>
              </div>
            </div>
          </>
        )}
        
        <DialogFooter>
          <Button 
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
            className="w-full sm:w-auto"
          >
            {registrarAceite.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

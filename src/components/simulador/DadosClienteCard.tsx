import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DadosCliente } from '@/types/simulador.types';
import { useClientes } from '@/hooks/useClientes';

interface DadosClienteCardProps {
  dados: DadosCliente;
  onChange: (dados: DadosCliente) => void;
}

export function DadosClienteCard({ dados, onChange }: DadosClienteCardProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(dados.nome);
  const { data: clientes = [] } = useClientes();

  const handleSelect = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      onChange({ id: cliente.id, nome: cliente.nome });
      setInputValue(cliente.nome);
    }
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onChange({ id: undefined, nome: value });
  };

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Nome do Cliente</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
              >
                {dados.nome || 'Digite ou selecione um cliente...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar cliente..."
                  value={inputValue}
                  onValueChange={handleInputChange}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-2 text-sm text-muted-foreground">
                      Cliente não encontrado.
                      <br />
                      <span className="text-primary">
                        "{inputValue}" será usado como nome.
                      </span>
                    </div>
                  </CommandEmpty>
                  <CommandGroup heading="Clientes cadastrados">
                    {filteredClientes.slice(0, 10).map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        value={cliente.id}
                        onSelect={handleSelect}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            dados.id === cliente.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {cliente.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {!dados.id && dados.nome && (
            <p className="text-xs text-muted-foreground">
              ℹ️ Cliente não cadastrado - nome digitado manualmente
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

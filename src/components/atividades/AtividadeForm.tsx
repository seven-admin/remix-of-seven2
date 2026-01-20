import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Phone, Users, MapPin, MessageSquare, CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useClientes } from '@/hooks/useClientes';
import { useCorretores } from '@/hooks/useCorretores';
import { useImobiliarias } from '@/hooks/useImobiliarias';
import { useEmpreendimentos } from '@/hooks/useEmpreendimentos';
import { useGestorEmpreendimentos } from '@/hooks/useGestorEmpreendimentos';
import { useAuth } from '@/contexts/AuthContext';
import type { Atividade, AtividadeFormData, AtividadeTipo, AtividadeCategoria } from '@/types/atividades.types';
import { ATIVIDADE_TIPO_LABELS, ATIVIDADE_CATEGORIA_LABELS } from '@/types/atividades.types';
import { CLIENTE_TEMPERATURA_LABELS, type ClienteTemperatura } from '@/types/clientes.types';

const TIPO_ICONS: Record<AtividadeTipo, typeof Phone> = {
  ligacao: Phone,
  reuniao: Users,
  visita: MapPin,
  atendimento: MessageSquare,
};

const formSchema = z.object({
  tipo: z.enum(['ligacao', 'reuniao', 'visita', 'atendimento']),
  categoria: z.enum(['primeiro_atendimento', 'retorno']),
  titulo: z.string().min(1, 'Título é obrigatório'),
  cliente_id: z.string().optional(),
  corretor_id: z.string().optional(),
  imobiliaria_id: z.string().optional(),
  empreendimento_id: z.string().optional(),
  data: z.date({ required_error: 'Data é obrigatória' }),
  hora: z.string().min(1, 'Hora é obrigatória'),
  duracao_minutos: z.coerce.number().min(5).max(480).optional(),
  observacoes: z.string().optional(),
  temperatura_cliente: z.enum(['frio', 'morno', 'quente']).optional(),
  requer_followup: z.boolean().default(false),
  data_followup: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AtividadeFormProps {
  initialData?: Atividade;
  onSubmit: (data: AtividadeFormData) => void;
  isLoading?: boolean;
}

export function AtividadeForm({ initialData, onSubmit, isLoading }: AtividadeFormProps) {
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  const { corretores } = useCorretores();
  const { imobiliarias } = useImobiliarias();
  const { data: todosEmpreendimentos = [] } = useEmpreendimentos();
  const { data: gestorData } = useGestorEmpreendimentos();

  // Determinar lista de empreendimentos a exibir
  const hasGestorEmpreendimentos = gestorData?.empreendimentos && gestorData.empreendimentos.length > 0;
  const empreendimentos = hasGestorEmpreendimentos 
    ? gestorData.empreendimentos 
    : todosEmpreendimentos;

  // Filtrar apenas clientes em fase de prospecção/qualificação
  const clientesProspecto = clientes?.filter(c => 
    c.fase === 'prospecto' || c.fase === 'qualificado' || c.fase === 'negociando'
  ) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'ligacao',
      categoria: (initialData?.categoria as AtividadeCategoria) || 'primeiro_atendimento',
      titulo: initialData?.titulo || '',
      cliente_id: initialData?.cliente_id || undefined,
      corretor_id: initialData?.corretor_id || undefined,
      imobiliaria_id: initialData?.imobiliaria_id || undefined,
      empreendimento_id: initialData?.empreendimento_id || undefined,
      data: initialData ? new Date(initialData.data_hora) : new Date(),
      hora: initialData ? format(new Date(initialData.data_hora), 'HH:mm') : '09:00',
      duracao_minutos: initialData?.duracao_minutos || 30,
      observacoes: initialData?.observacoes || '',
      temperatura_cliente: initialData?.temperatura_cliente || undefined,
      requer_followup: initialData?.requer_followup || false,
      data_followup: initialData?.data_followup ? new Date(initialData.data_followup) : undefined,
    },
  });

  const requerFollowup = form.watch('requer_followup');
  const clienteId = form.watch('cliente_id');

  // Auto-selecionar empreendimento quando gestor tem apenas 1 vinculado
  useEffect(() => {
    if (!initialData && gestorData?.autoSelectedId) {
      form.setValue('empreendimento_id', gestorData.autoSelectedId);
    }
  }, [gestorData?.autoSelectedId, form, initialData]);

  const handleFormSubmit = (values: FormValues) => {
    const [hours, minutes] = values.hora.split(':').map(Number);
    const dataHora = new Date(values.data);
    dataHora.setHours(hours, minutes, 0, 0);

    const formData: AtividadeFormData = {
      tipo: values.tipo,
      categoria: values.categoria as AtividadeCategoria,
      titulo: values.titulo,
      cliente_id: values.cliente_id || undefined,
      corretor_id: values.corretor_id || undefined,
      imobiliaria_id: values.imobiliaria_id || undefined,
      empreendimento_id: values.empreendimento_id || undefined,
      gestor_id: user?.id,
      data_hora: dataHora.toISOString(),
      duracao_minutos: values.duracao_minutos,
      observacoes: values.observacoes || undefined,
      temperatura_cliente: values.temperatura_cliente as ClienteTemperatura | undefined,
      requer_followup: values.requer_followup,
      data_followup: values.data_followup?.toISOString(),
    };

    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Tipo de Atividade */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Atividade</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(ATIVIDADE_TIPO_LABELS) as AtividadeTipo[]).map((tipo) => {
                  const Icon = TIPO_ICONS[tipo];
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => field.onChange(tipo)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                        field.value === tipo
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{ATIVIDADE_TIPO_LABELS[tipo]}</span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria: Primeiro Atendimento ou Retorno */}
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ATIVIDADE_CATEGORIA_LABELS) as AtividadeCategoria[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => field.onChange(cat)}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors text-sm',
                      field.value === cat
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-input hover:bg-accent'
                    )}
                  >
                    {ATIVIDADE_CATEGORIA_LABELS[cat]}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Descreva a atividade..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hora"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cliente */}
        <FormField
          control={form.control}
          name="cliente_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente (opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientesProspecto.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Empreendimento */}
        <FormField
          control={form.control}
          name="empreendimento_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Empreendimento
                {hasGestorEmpreendimentos && empreendimentos.length === 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">(auto-selecionado)</span>
                )}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empreendimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {empreendimentos.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temperatura do Cliente - Só mostrar quando cliente selecionado */}
        {clienteId && (
          <FormField
            control={form.control}
            name="temperatura_cliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura do Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a temperatura" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(CLIENTE_TEMPERATURA_LABELS) as ClienteTemperatura[]).map((temp) => (
                      <SelectItem key={temp} value={temp}>
                        {CLIENTE_TEMPERATURA_LABELS[temp]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Seção Colapsável - Mais opções */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between text-muted-foreground">
              <span>Mais opções</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {/* Corretor e Imobiliária */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="corretor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corretor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {corretores.map((corretor) => (
                          <SelectItem key={corretor.id} value={corretor.id}>
                            {corretor.nome_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imobiliaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imobiliária</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {imobiliarias.map((imob) => (
                          <SelectItem key={imob.id} value={imob.id}>
                            {imob.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a atividade..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Follow-up */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="requer_followup"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel className="text-base">Requer Follow-up</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Agendar lembrete para acompanhamento
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {requerFollowup && (
            <FormField
              control={form.control}
              name="data_followup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do Follow-up</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar Atividade' : 'Criar Atividade'}
        </Button>
      </form>
    </Form>
  );
}

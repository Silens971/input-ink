import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown, X, Clock, Move, Sliders, Code, Image, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  effects: string[];
}

const faqItems: FAQItem[] = [
  {
    icon: <Clock className="w-4 h-4" />,
    title: "Multiplicador de Tempo",
    description: "Ajusta a velocidade de execução do macro sem alterar a trajetória.",
    effects: [
      "Valores > 1x: Macro executa MAIS RÁPIDO (ex: 2x = dobro da velocidade)",
      "Valores < 1x: Macro executa MAIS LENTO (ex: 0.5x = metade da velocidade)",
      "O movimento segue exatamente o mesmo caminho, apenas mais rápido ou devagar",
      "Útil para ajustar precisão vs velocidade"
    ]
  },
  {
    icon: <Sliders className="w-4 h-4" />,
    title: "Escala X/Y",
    description: "Multiplica as coordenadas do movimento nos eixos horizontal e vertical.",
    effects: [
      "Escala X > 1: Movimento mais largo horizontalmente",
      "Escala X < 1: Movimento mais estreito horizontalmente",
      "Escala Y > 1: Movimento mais alto verticalmente",
      "Escala Y < 1: Movimento mais baixo verticalmente",
      "Valores negativos invertem a direção do eixo"
    ]
  },
  {
    icon: <Move className="w-4 h-4" />,
    title: "Sistema de Coordenadas",
    description: "O centro da área de captura é o ponto (0,0). Todos os movimentos são relativos a este centro.",
    effects: [
      "Eixo X: valores positivos = direita, negativos = esquerda",
      "Eixo Y: valores positivos = cima, negativos = baixo",
      "Ao executar o script, movimentos são aplicados a partir da posição atual do mouse",
      "Intervalo de captura: -250 a +250 pixels do centro"
    ]
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "Suavização",
    description: "Reduz ruídos e tremores no movimento, criando uma trajetória mais fluida.",
    effects: [
      "Valor 0: Movimento original sem alterações",
      "Valores baixos: Suaviza pequenos tremores",
      "Valores altos: Movimento muito suave, pode perder detalhes",
      "Usa média móvel para calcular posições intermediárias"
    ]
  },
  {
    icon: <Code className="w-4 h-4" />,
    title: "Código em Tempo Real",
    description: "O código AutoHotkey e Lua exibido reflete SEMPRE o estado atual das edições.",
    effects: [
      "Qualquer alteração atualiza o código instantaneamente",
      "O código exibido é exatamente o que será exportado",
      "Não há botão 'gerar código' - é sempre ao vivo",
      "Comentários no código mostram configurações aplicadas"
    ]
  },
  {
    icon: <Image className="w-4 h-4" />,
    title: "Imagem de Referência",
    description: "Permite importar uma imagem como guia visual para desenhar movimentos.",
    effects: [
      "A imagem NÃO afeta os dados gravados",
      "Pode ser movida, redimensionada e ter opacidade ajustada",
      "Use o botão de trava para evitar mover acidentalmente",
      "Suporta PNG e JPG"
    ]
  },
];

export function FAQPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="glass-button gap-2 fixed bottom-4 right-4 z-50"
      >
        <HelpCircle className="w-4 h-4" />
        Ajuda
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] overflow-hidden glass-card rounded-2xl fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Manual de Funcionalidades
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(70vh-64px)]">
        {faqItems.map((item, index) => (
          <Collapsible
            key={index}
            open={expandedItems.has(index)}
            onOpenChange={() => toggleItem(index)}
          >
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-colors",
                "hover:bg-secondary/50",
                expandedItems.has(index) && "bg-secondary/30"
              )}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm">{item.title}</span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  expandedItems.has(index) && "rotate-180"
                )} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-3">
                <p className="text-sm text-muted-foreground pl-12">
                  {item.description}
                </p>
                
                <div className="pl-12 space-y-1.5">
                  <p className="text-xs font-medium text-foreground/80">O que muda:</p>
                  <ul className="space-y-1">
                    {item.effects.map((effect, i) => (
                      <li 
                        key={i}
                        className="text-xs text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-center text-muted-foreground">
            As alterações são aplicadas em tempo real e refletidas imediatamente no código exportado.
          </p>
        </div>
      </div>
    </div>
  );
}

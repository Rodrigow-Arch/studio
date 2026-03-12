
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, ShieldCheck, X } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const isTerms = type === 'terms';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px] h-[80vh] flex flex-col p-0 rounded-3xl overflow-hidden z-[300]">
        <DialogHeader className="p-6 border-b shrink-0 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center text-primary">
              {isTerms ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="font-headline text-xl">
                {isTerms ? 'Termos e Condições' : 'Política de Privacidade'}
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Portugal Unido • Janeiro 2025
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            {isTerms ? (
              <>
                <section>
                  <h4 className="font-bold text-foreground mb-2">1. Natureza da Plataforma</h4>
                  <p>O Portugal Unido é uma plataforma digital de ligação entre pessoas da comunidade portuguesa e não é responsável por encontros presenciais entre utilizadores.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">2. Verificação de Identidade</h4>
                  <p>O Portugal Unido não verifica a identidade real dos utilizadores além do email e telefone e não garante que as informações dos perfis são verdadeiras.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">3. Responsabilidade de Encontros</h4>
                  <p>Encontros presenciais são da total responsabilidade dos utilizadores envolvidos. Recomendamos sempre informar um familiar ou amigo de confiança antes de qualquer encontro.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">4. Pagamentos</h4>
                  <p>Pagamentos entre utilizadores são acordos privados e o Portugal Unido não intervém nem garante pagamentos entre utilizadores.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">5. Proibições de Conteúdo</h4>
                  <p>Conteúdo ofensivo, falso ou perigoso é proibido e pode resultar em suspensão imediata da conta.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">6. Direito de Suspensão</h4>
                  <p>O Portugal Unido reserva o direito de suspender ou eliminar contas que violem estes termos.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">7. Direito de Eliminação</h4>
                  <p>O utilizador tem o direito de eliminar a sua conta e todos os seus dados a qualquer momento nas Definições.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">8. Jurisdição</h4>
                  <p>Estes termos são regidos pela lei portuguesa e pela legislação da União Europeia.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">9. Contacto Legal</h4>
                  <p>Para contacto legal enviar email para legal@portugalbunido.pt.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">10. Atualização</h4>
                  <p>Última atualização: 25 de Janeiro de 2025.</p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h4 className="font-bold text-foreground mb-2">1. Dados Recolhidos</h4>
                  <p>Os dados recolhidos são: nome, email, telefone opcional, distrito, zona, data de nascimento e localização GPS opcional.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">2. Uso de Dados</h4>
                  <p>Os dados são usados exclusivamente para o funcionamento da plataforma e nunca são vendidos a terceiros.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">3. Localização GPS</h4>
                  <p>A localização GPS é usada apenas para mostrar posts próximos e nunca é partilhada com outros utilizadores de forma exata, apenas zona aproximada.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">4. Direito ao Esquecimento</h4>
                  <p>O utilizador pode eliminar todos os seus dados a qualquer momento nas Definições eliminando a conta.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">5. Serviços de Terceiros</h4>
                  <p>Utilizamos Firebase da Google para autenticação e base de dados, sujeito à política de privacidade da Google.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">6. Cookies</h4>
                  <p>Cookies e localStorage são usados apenas para manter a sessão ativa.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">7. Contacto de Privacidade</h4>
                  <p>Em caso de dúvidas sobre privacidade contactar privacidade@portugalbunido.pt.</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">8. RGPD</h4>
                  <p>Cumprimos o Regulamento Geral de Proteção de Dados da União Europeia (RGPD).</p>
                </section>
                <section>
                  <h4 className="font-bold text-foreground mb-2">9. Atualização</h4>
                  <p>Última atualização: 25 de Janeiro de 2025.</p>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-muted/20 border-t">
          <Button className="w-full rounded-2xl h-12 font-bold" onClick={onClose}>
            Entendi e Aceito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

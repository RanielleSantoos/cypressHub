import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="page-heading">
      <div>
        <h1>{{ title }}</h1>
        <p>evologCypress</p>
      </div>
    </section>
    @switch (area) {
      @case ('execucoes') {
        <section class="panel">
          <h2>Histórico de execuções</h2>
          <div class="inner-empty">
            <h3>Worker Cypress pendente</h3>
            <p>O histórico exibirá status, duração e evidências quando o worker começar a enviar resultados.</p>
            <a mat-stroked-button routerLink="/agendamentos">Ver agendamentos</a>
          </div>
        </section>
      }
      @case ('relatorios') {
        <section class="panel">
          <h2>Indicadores de qualidade</h2>
          <div class="inner-empty">
            <h3>Aguardando resultados</h3>
            <p>Taxa de sucesso e duração média são calculadas a partir de execuções concluídas.</p>
            <a mat-stroked-button routerLink="/execucoes">Ver execuções</a>
          </div>
        </section>
      }
      @case ('configuracoes') {
        <section class="panel">
          <h2>Ambiente do Hub</h2>
          <dl class="project-summary">
            <div><dt>Projeto ativo</dt><dd>evologCypress</dd></div>
            <div><dt>Origem do catálogo</dt><dd>Pasta Cypress local</dd></div>
            <div><dt>Execução automatizada</dt><dd>Aguardando worker</dd></div>
          </dl>
          <a mat-stroked-button routerLink="/integracoes">Ver Integrações</a>
        </section>
      }
    }
  `,
})
export class OperationsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly area = this.route.snapshot.routeConfig?.path;
  readonly title = this.route.snapshot.data['title'] as string;
}

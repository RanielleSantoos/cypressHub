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
            <p>As execuções do worker serão exibidas aqui. Consulte os arquivos gerados pelo Cypress em Relatórios.</p>
            <a mat-stroked-button routerLink="/relatorios">Ver Relatórios</a>
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
